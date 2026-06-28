'use client'

import { useEffect, useState, useCallback } from 'react'
import { Monitor, Grid3X3, List, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Screen, Section, DeviceType, PlayMode, PriceMatrix } from '@/types/database'
import ScreenCard from '@/components/dashboard/ScreenCard'
import StartSessionDialog from '@/components/dashboard/StartSessionDialog'
import EndSessionDialog from '@/components/dashboard/EndSessionDialog'
import Header from '@/components/layout/Header'
import { agentStartSession, agentEndSession, agentLockScreen, agentUnlockScreen } from '@/lib/pc-agent'

export default function DashboardPage() {
  const [screens, setScreens] = useState<Screen[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([])
  const [playModes, setPlayModes] = useState<PlayMode[]>([])
  const [priceMatrix, setPriceMatrix] = useState<PriceMatrix[]>([])
  const [filterSection, setFilterSection] = useState<string | null>(null)
  const [filterDeviceType, setFilterDeviceType] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [startTarget, setStartTarget] = useState<Screen | null>(null)
  const [endTarget, setEndTarget] = useState<Screen | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const loadData = useCallback(async () => {
    const [{ data: screensData }, { data: sectionsData }, { data: dtData }, { data: pmData }, { data: pxData }] =
      await Promise.all([
        supabase
          .from('screens')
          .select('*, section:sections(*), device_type:device_types(*), current_session:sessions(*, play_mode:play_modes(*), customer:customers(*))')
          .order('name'),
        supabase.from('sections').select('*').order('sort_order'),
        supabase.from('device_types').select('*').order('name'),
        supabase.from('play_modes').select('*').order('players_count'),
        supabase.from('price_matrix').select('*'),
      ])
    setScreens(screensData ?? [])
    setSections(sectionsData ?? [])
    setDeviceTypes(dtData ?? [])
    setPlayModes(pmData ?? [])
    setPriceMatrix(pxData ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()

    const channel = supabase
      .channel('screens-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'screens' }, () => {
        loadData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        loadData()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadData])

  const filteredScreens = screens.filter(s => {
    if (filterSection && s.section_id !== filterSection) return false
    if (filterDeviceType && s.device_type_id !== filterDeviceType) return false
    return true
  })

  const counts = {
    available: screens.filter(s => s.status === 'available').length,
    playing: screens.filter(s => s.status === 'playing').length,
    locked: screens.filter(s => s.status === 'locked').length,
    offline: screens.filter(s => s.status === 'offline').length,
  }

  function getPriceForScreen(screen: Screen, playModeId: string): number {
    return priceMatrix.find(
      p => p.device_type_id === screen.device_type_id && p.play_mode_id === playModeId
    )?.price_per_hour ?? 0
  }

  function getScreenPrice(screen: Screen): number {
    if (!screen.current_session) return 0
    return getPriceForScreen(screen, screen.current_session.play_mode_id)
  }

  async function handleStartSession(
    screen: Screen,
    playModeId: string,
    customerId: string | null,
    sessionPassword: string
  ) {
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        screen_id: screen.id,
        play_mode_id: playModeId,
        customer_id: customerId,
        status: 'active',
      })
      .select()
      .single()

    if (error || !session) return

    await supabase
      .from('screens')
      .update({ status: 'playing', current_session_id: session.id })
      .eq('id', screen.id)

    if (screen.device_type?.name?.startsWith('PC') && screen.ip) {
      agentStartSession(screen, sessionPassword).catch(() => {})
    }

    setStartTarget(null)
    loadData()
  }

  async function handleEndSession(screen: Screen, totalAmount: number, notes: string) {
    if (!screen.current_session_id) return

    await supabase
      .from('sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString(), total_amount: totalAmount, notes })
      .eq('id', screen.current_session_id)

    await supabase
      .from('screens')
      .update({ status: 'available', current_session_id: null })
      .eq('id', screen.id)

    if (screen.device_type?.name?.startsWith('PC') && screen.ip) {
      agentEndSession(screen).catch(() => {})
    }

    setEndTarget(null)
    loadData()
  }

  async function handleLock(screen: Screen) {
    const newStatus = screen.status === 'locked' ? 'available' : 'locked'
    await supabase.from('screens').update({ status: newStatus }).eq('id', screen.id)
    if (screen.ip) {
      newStatus === 'locked' ? agentLockScreen(screen).catch(() => {}) : agentUnlockScreen(screen).catch(() => {})
    }
    loadData()
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
          />
          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            جارٍ التحميل...
          </span>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header title="لوحة التحكم" subtitle={`${screens.length} شاشة`} />

      <div className="flex-1 overflow-y-auto">
        {/* Stats bar */}
        <div className="px-5 py-3 border-b flex items-center gap-4 flex-wrap" style={{ borderColor: 'var(--border)', background: '#ffffff' }}>
          {[
            { label: 'متاح', count: counts.available, color: '#22c55e' },
            { label: 'قيد اللعب', count: counts.playing, color: '#2563eb' },
            { label: 'مغلق', count: counts.locked, color: '#f59e0b' },
            { label: 'غير متصل', count: counts.offline, color: '#94a3b8' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{s.label}</span>
              <span className="text-sm font-bold" style={{ color: s.color }}>{s.count}</span>
            </div>
          ))}

          <div className="mr-auto flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="تحديث"
            >
              <RefreshCw size={14} style={{ color: 'var(--muted-foreground)' }} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className="p-1.5 rounded-lg transition-colors"
              style={{ background: viewMode === 'grid' ? 'var(--primary)' : 'transparent' }}
            >
              <Grid3X3 size={14} style={{ color: viewMode === 'grid' ? '#fff' : 'var(--muted-foreground)' }} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="p-1.5 rounded-lg transition-colors"
              style={{ background: viewMode === 'list' ? 'var(--primary)' : 'transparent' }}
            >
              <List size={14} style={{ color: viewMode === 'list' ? '#fff' : 'var(--muted-foreground)' }} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-2.5 border-b flex items-center gap-2 flex-wrap" style={{ borderColor: 'var(--border)', background: '#ffffff' }}>
          <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>القسم:</span>
          <button
            onClick={() => setFilterSection(null)}
            className="text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
            style={{
              background: filterSection === null ? 'var(--primary)' : 'var(--secondary)',
              color: filterSection === null ? '#fff' : 'var(--foreground)',
            }}
          >
            الكل
          </button>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setFilterSection(filterSection === s.id ? null : s.id)}
              className="text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
              style={{
                background: filterSection === s.id ? 'var(--primary)' : 'var(--secondary)',
                color: filterSection === s.id ? '#fff' : 'var(--foreground)',
              }}
            >
              {s.name}
            </button>
          ))}

          <span className="text-xs font-medium mr-3" style={{ color: 'var(--muted-foreground)' }}>النوع:</span>
          <button
            onClick={() => setFilterDeviceType(null)}
            className="text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
            style={{
              background: filterDeviceType === null ? 'var(--primary)' : 'var(--secondary)',
              color: filterDeviceType === null ? '#fff' : 'var(--foreground)',
            }}
          >
            الكل
          </button>
          {deviceTypes.map(dt => (
            <button
              key={dt.id}
              onClick={() => setFilterDeviceType(filterDeviceType === dt.id ? null : dt.id)}
              className="text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
              style={{
                background: filterDeviceType === dt.id ? 'var(--primary)' : 'var(--secondary)',
                color: filterDeviceType === dt.id ? '#fff' : 'var(--foreground)',
              }}
            >
              {dt.name}
            </button>
          ))}
        </div>

        {/* Screens */}
        <div className="p-5">
          {filteredScreens.length === 0 ? (
            <div className="text-center py-20">
              <Monitor size={48} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
              <p style={{ color: 'var(--muted-foreground)' }}>لا توجد شاشات</p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>
                أضف شاشات من صفحة الإعدادات
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                  : 'flex flex-col gap-2'
              }
            >
              {filteredScreens.map(screen => (
                <ScreenCard
                  key={screen.id}
                  screen={screen}
                  pricePerHour={getScreenPrice(screen)}
                  onStartSession={s => setStartTarget(s)}
                  onEndSession={s => setEndTarget(s)}
                  onLock={handleLock}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {startTarget && (
        <StartSessionDialog
          screen={startTarget}
          playModes={playModes}
          onClose={() => setStartTarget(null)}
          onConfirm={(playModeId, customerId, password) =>
            handleStartSession(startTarget, playModeId, customerId, password)
          }
        />
      )}

      {endTarget && (
        <EndSessionDialog
          screen={endTarget}
          pricePerHour={getScreenPrice(endTarget)}
          onClose={() => setEndTarget(null)}
          onConfirm={(totalAmount, notes) => handleEndSession(endTarget, totalAmount, notes)}
        />
      )}
    </>
  )
}
