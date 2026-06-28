'use client'

import { useEffect, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { EventLog } from '@/types/database'
import Header from '@/components/layout/Header'
import { formatDate } from '@/lib/utils'

export default function AuditPage() {
  const [logs, setLogs] = useState<EventLog[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase.from('event_log').select('*').order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => setLogs(data ?? []))
  }, [])

  return (
    <>
      <Header title="سجل المراقبة" />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex flex-col gap-2">
          {logs.length === 0 ? (
            <div className="text-center py-20" style={{ color: 'var(--muted-foreground)' }}>
              <ScrollText size={48} className="mx-auto mb-3 opacity-30" />
              <p>لا توجد أحداث مسجلة</p>
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="rounded-xl border p-3 flex items-start gap-3" style={{ borderColor: 'var(--border)', background: '#fff' }}>
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--primary)' }} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{log.action}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{formatDate(log.created_at)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
