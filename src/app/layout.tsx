import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'King GameCenter',
  description: 'نظام إدارة مركز الألعاب',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
