'use client'

import { useState, useEffect } from 'react'
import { Monitor, Tv2, Clock, User, Play, Square, Lock, Unlock, Wifi, WifiOff } from 'lucide-react'
import type { Screen } from '@/types/database'
import { formatCurrency } from '@/lib/utils'

const STATUS_CONFIG = {
  available: { label: 'متاح', color: '#22c55e', bg: '#f0fdf4', border: '#86efac' },
  playing: { label: 'قيد اللعب', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  locked: { label: 'مغلق', color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
  offline: { label: 'غير متصل', color: '#94a3b8', bg: '#f8fafc', border: '#cbd5e1' },
}

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  PS4: <Tv2 size={20} />,
  PS5: <Tv2 size={20} />,
}

interface ScreenCardProps {
  screen: Screen
  pricePerHour?: number
  onStartSession: (screen: Screen) => void
  onEndSession: (screen: Screen) => void
  onLock: (screen: Screen) => void
}

export default function ScreenCard({
  screen,
  pricePerHour = 0,
  onStartSession,
  onEndSession,
  onLock,
}: ScreenCardProps) {
  const [duration, setDuration] = useState('00:00:00')
  const [currentAmount, setCurrentAmount] = useState(0)

  const cfg = STATUS_CONFIG[screen.status]
  const icon = DEVICE_ICONS[screen.device_type?.name ?? ''] ?? <Monitor size={20} />

  useEffect(() => {
    if (screen.status !== 'playing' || !screen.current_session?.started_at) {
      setDuration('00:00:00')
      setCurrentAmount(0)
      return
    }
    const update = () => {
      const start = new Date(screen.current_session!.started_at)
      const diff = Date.now() - start.getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setDuration(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
      setCurrentAmount(Math.round((diff / 3600000) * pricePerHour))
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [screen.status, screen.current_session?.started_at, pricePerHour])

  return (
    <div
      className="rounded-xl border-2 p-4 flex flex-col gap-3 transition-all hover:shadow-md cursor-default"
      style={{ background: cfg.bg, borderColor: cfg.border, minHeight: 180 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: cfg.color + '20', color: cfg.color }}
          >
            {icon}
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{screen.name}</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{screen.device_type?.name}</div>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.color + '20', color: cfg.color }}>
          {cfg.label}
        </span>
      </div>

      {screen.status === 'playing' && screen.current_session && (
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
            <Clock size={13} />
            <span className="font-mono font-bold" style={{ color: 'var(--foreground)' }}>{duration}</span>
          </div>
          {screen.current_session.customer && (
            <div className="flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
              <User size={13} />
              <span>{screen.current_session.customer.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
            <span className="text-xs">المبلغ الحالي:</span>
            <span className="font-semibold" style={{ color: 'var(--primary)' }}>{formatCurrency(currentAmount)}</span>
          </div>
        </div>
      )}

      {screen.ip && (
        <div className="flex items-center gap-1.5">
          {screen.status !== 'offline'
            ? <Wifi size={12} style={{ color: 'var(--success)' }} />
            : <WifiOff size={12} style={{ color: 'var(--muted-foreground)' }} />}
          <span className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>{screen.ip}:{screen.port}</span>
        </div>
      )}

      <div className="flex gap-2 mt-auto">
        {screen.status === 'available' && (
          <button
            onClick={() => onStartSession(screen)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-white"
            style={{ background: 'var(--primary)' }}
          >
            <Play size={12} /> بدء جلسة
          </button>
        )}
        {screen.status === 'playing' && (
          <button
            onClick={() => onEndSession(screen)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-white"
            style={{ background: 'var(--destructive)' }}
          >
            <Square size={12} /> إنهاء الجلسة
          </button>
        )}
        {(screen.status === 'available' || screen.status === 'locked') && (
          <button
            onClick={() => onLock(screen)}
            className="flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium border"
            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            {screen.status === 'locked' ? <Unlock size={12} /> : <Lock size={12} />}
          </button>
        )}
      </div>
    </div>
  )
}
