'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Monitor,
  ShoppingCart,
  Package,
  Users,
  Trophy,
  BarChart2,
  Settings,
  ScrollText,
  MessageSquare,
  DollarSign,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/', icon: Monitor, label: 'لوحة التحكم' },
  { href: '/pos', icon: ShoppingCart, label: 'نقطة البيع' },
  { href: '/cashier', icon: DollarSign, label: 'الصندوق / الوردية' },
  { href: '/inventory', icon: Package, label: 'المخزون' },
  { href: '/customers', icon: Users, label: 'العملاء والديون' },
  { href: '/tournaments', icon: Trophy, label: 'البطولات والفرق' },
  { href: '/reports', icon: BarChart2, label: 'التقارير' },
  { href: '/audit', icon: ScrollText, label: 'سجل المراقبة' },
  { href: '/chat', icon: MessageSquare, label: 'محادثة المدير' },
  { href: '/settings', icon: Settings, label: 'الإعدادات' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col h-full"
      style={{ background: 'var(--sidebar-bg)' }}
    >
      {/* Logo */}
      <div className="px-4 py-5 border-b" style={{ borderColor: '#334155' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: 'var(--primary)' }}
          >
            K
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">King</div>
            <div className="text-xs leading-tight" style={{ color: 'var(--sidebar-text)' }}>
              GameCenter
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5">
        {navItems.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: active ? 'var(--sidebar-active-bg)' : 'transparent',
                color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
              }}
            >
              <item.icon size={16} className="flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t" style={{ borderColor: '#334155' }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/10"
          style={{ color: 'var(--sidebar-text)' }}
        >
          <LogOut size={16} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  )
}
