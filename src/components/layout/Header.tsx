'use client'

import { Bell, Wifi } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header
      className="h-14 flex items-center justify-between px-5 border-b flex-shrink-0"
      style={{ background: '#ffffff', borderColor: 'var(--border)' }}
    >
      <div>
        <h1 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-left hidden sm:block">
          <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {timeStr}
          </div>
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {dateStr}
          </div>
        </div>

        <button
          className="relative p-2 rounded-lg transition-colors hover:bg-slate-100"
          title="الإشعارات"
        >
          <Bell size={18} style={{ color: 'var(--muted-foreground)' }} />
        </button>

        <div className="flex items-center gap-1.5">
          <Wifi size={14} style={{ color: 'var(--success)' }} />
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            متصل
          </span>
        </div>
      </div>
    </header>
  )
}
