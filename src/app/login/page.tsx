'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) {
        setError('بيانات الدخول غير صحيحة')
      } else {
        router.push('/')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 shadow-2xl"
        style={{ background: '#ffffff' }}
      >
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: 'var(--primary)' }}
          >
            K
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            King GameCenter
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            THE KING STATION
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors"
              style={{ borderColor: 'var(--border)', background: '#f8fafc', color: 'var(--foreground)' }}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors"
              style={{ borderColor: 'var(--border)', background: '#f8fafc', color: 'var(--foreground)' }}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {error && (
            <p className="text-sm text-center rounded-lg px-3 py-2" style={{ background: '#fef2f2', color: 'var(--destructive)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: 'var(--primary)' }}
          >
            {loading ? 'جارِ الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  )
}
