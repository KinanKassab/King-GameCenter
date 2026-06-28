'use client'

import { MessageSquare } from 'lucide-react'
import Header from '@/components/layout/Header'

export default function ChatPage() {
  return (
    <>
      <Header title="محادثة المدير" />
      <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--muted-foreground)' }}>
        <div className="text-center">
          <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">محادثة المدير</p>
          <p className="text-sm mt-1">قيد التطوير</p>
        </div>
      </div>
    </>
  )
}
