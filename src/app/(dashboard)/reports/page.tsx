'use client'

import { useEffect, useState } from 'react'
import { BarChart2, TrendingUp, DollarSign, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Header from '@/components/layout/Header'
import { formatCurrency } from '@/lib/utils'

interface DailyStat {
  date: string
  sessions: number
  pos: number
  total: number
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week')
  const [stats, setStats] = useState({ sessions: 0, sessionRevenue: 0, posRevenue: 0, total: 0, activeSessions: 0 })
  const [chartData, setChartData] = useState<DailyStat[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [period])

  async function loadStats() {
    setLoading(true)
    const now = new Date()
    let from: Date
    if (period === 'today') { from = new Date(now); from.setHours(0, 0, 0, 0) }
    else if (period === 'week') { from = new Date(now); from.setDate(now.getDate() - 7) }
    else { from = new Date(now); from.setDate(now.getDate() - 30) }

    const [{ data: sessions }, { data: posOrders }, { data: activeSessions }] = await Promise.all([
      supabase.from('sessions').select('total_amount, ended_at, started_at').eq('status', 'ended').gte('ended_at', from.toISOString()),
      supabase.from('pos_orders').select('total, created_at').eq('status', 'completed').gte('created_at', from.toISOString()),
      supabase.from('sessions').select('id').eq('status', 'active'),
    ])

    const sessionRevenue = (sessions ?? []).reduce((s, r) => s + (r.total_amount ?? 0), 0)
    const posRevenue = (posOrders ?? []).reduce((s, r) => s + r.total, 0)

    setStats({
      sessions: (sessions ?? []).length,
      sessionRevenue,
      posRevenue,
      total: sessionRevenue + posRevenue,
      activeSessions: (activeSessions ?? []).length,
    })

    // Build chart data
    const dayMap = new Map<string, DailyStat>()
    for (const s of sessions ?? []) {
      const d = new Date(s.ended_at!).toLocaleDateString('ar-SA', { month: 'numeric', day: 'numeric' })
      if (!dayMap.has(d)) dayMap.set(d, { date: d, sessions: 0, pos: 0, total: 0 })
      const entry = dayMap.get(d)!
      entry.sessions += s.total_amount ?? 0
      entry.total += s.total_amount ?? 0
    }
    for (const o of posOrders ?? []) {
      const d = new Date(o.created_at).toLocaleDateString('ar-SA', { month: 'numeric', day: 'numeric' })
      if (!dayMap.has(d)) dayMap.set(d, { date: d, sessions: 0, pos: 0, total: 0 })
      const entry = dayMap.get(d)!
      entry.pos += o.total
      entry.total += o.total
    }
    setChartData(Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date)))
    setLoading(false)
  }

  const statCards = [
    { label: 'إجمالي الإيرادات', value: formatCurrency(stats.total), icon: DollarSign, color: '#2563eb' },
    { label: 'إيرادات الجلسات', value: formatCurrency(stats.sessionRevenue), icon: Clock, color: '#22c55e' },
    { label: 'إيرادات البيع', value: formatCurrency(stats.posRevenue), icon: TrendingUp, color: '#f59e0b' },
    { label: 'جلسات منتهية', value: String(stats.sessions), icon: BarChart2, color: '#8b5cf6' },
  ]

  return (
    <>
      <Header title="التقارير المالية" />
      <div className="flex-1 overflow-y-auto p-5">
        {/* Period selector */}
        <div className="flex gap-2 mb-6">
          {([['today', 'اليوم'], ['week', 'الأسبوع'], ['month', 'الشهر']] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setPeriod(v)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: period === v ? 'var(--primary)' : 'var(--secondary)',
                color: period === v ? '#fff' : 'var(--foreground)',
              }}
            >
              {l}
            </button>
          ))}
          {stats.activeSessions > 0 && (
            <div className="mr-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm" style={{ background: '#eff6ff', color: 'var(--primary)' }}>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              {stats.activeSessions} جلسة نشطة
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map(s => (
            <div key={s.label} className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: '#fff' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{s.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.color + '15' }}>
                  <s.icon size={16} style={{ color: s.color }} />
                </div>
              </div>
              <div className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: '#fff' }}>
            <h3 className="text-sm font-semibold mb-4">الإيرادات اليومية</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => [formatCurrency(Number(v)), '']}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="sessions" name="جلسات" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pos" name="بيع" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {loading && (
          <div className="text-center py-10" style={{ color: 'var(--muted-foreground)' }}>
            جارٍ التحميل...
          </div>
        )}
      </div>
    </>
  )
}
