'use client'

import { useState, useEffect } from 'react'
import { X, Clock, DollarSign } from 'lucide-react'
import type { Screen } from '@/types/database'
import { formatCurrency } from '@/lib/utils'

interface EndSessionDialogProps {
  screen: Screen
  pricePerHour: number
  onClose: () => void
  onConfirm: (totalAmount: number, notes: string) => Promise<void>
}

export default function EndSessionDialog({ screen, pricePerHour, onClose, onConfirm }: EndSessionDialogProps) {
  const [duration, setDuration] = useState('00:00:00')
  const [hours, setHours] = useState(0)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const update = () => {
      if (!screen.current_session?.started_at) return
      const start = new Date(screen.current_session.started_at)
      const diff = Date.now() - start.getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setDuration(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
      setHours(diff / 3600000)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [screen.current_session?.started_at])

  const totalAmount = Math.round(hours * pricePerHour)

  async function handleConfirm() {
    setLoading(true)
    try { await onConfirm(totalAmount, notes) } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-sm rounded-2xl shadow-2xl" style={{ background: '#ffffff' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-base font-bold">إنهاء الجلسة — {screen.name}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4 text-center" style={{ background: '#eff6ff' }}>
              <Clock size={20} className="mx-auto mb-2" style={{ color: 'var(--primary)' }} />
              <div className="text-xl font-bold font-mono" style={{ color: 'var(--primary)' }}>{duration}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>مدة الجلسة</div>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: '#f0fdf4' }}>
              <DollarSign size={20} className="mx-auto mb-2" style={{ color: 'var(--success)' }} />
              <div className="text-xl font-bold" style={{ color: 'var(--success)' }}>{totalAmount.toLocaleString('ar')}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>المبلغ (SYP)</div>
            </div>
          </div>
          {screen.current_session?.play_mode && (
            <div className="flex items-center justify-between text-sm px-3 py-2 rounded-lg" style={{ background: 'var(--secondary)' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>نمط اللعب</span>
              <span className="font-medium">{screen.current_session.play_mode.name}</span>
            </div>
          )}
          {screen.current_session?.customer && (
            <div className="flex items-center justify-between text-sm px-3 py-2 rounded-lg" style={{ background: 'var(--secondary)' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>العميل</span>
              <span className="font-medium">{screen.current_session.customer.name}</span>
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-1.5 block">ملاحظات (اختياري)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
              style={{ borderColor: 'var(--border)' }}
              placeholder="أي ملاحظات على الجلسة..."
            />
          </div>
        </div>
        <div className="flex gap-2 p-5 pt-0">
          <button onClick={onClose} className="flex-1 rounded-lg border py-2.5 text-sm font-medium hover:bg-slate-50" style={{ borderColor: 'var(--border)' }}>إلغاء</button>
          <button onClick={handleConfirm} disabled={loading} className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-60" style={{ background: 'var(--destructive)' }}>
            {loading ? 'جارِ الإنهاء...' : `إنهاء — ${formatCurrency(totalAmount)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
