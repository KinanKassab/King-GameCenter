'use client'

import { useState, useEffect } from 'react'
import { X, User, Gamepad2 } from 'lucide-react'
import type { Screen, PlayMode, Customer, PriceMatrix } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface StartSessionDialogProps {
  screen: Screen
  playModes: PlayMode[]
  onClose: () => void
  onConfirm: (playModeId: string, customerId: string | null, password: string) => Promise<void>
}

export default function StartSessionDialog({ screen, playModes, onClose, onConfirm }: StartSessionDialogProps) {
  const [selectedPlayMode, setSelectedPlayMode] = useState(playModes[0]?.id ?? '')
  const [customerSearch, setCustomerSearch] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [password, setPassword] = useState('')
  const [priceMatrix, setPriceMatrix] = useState<PriceMatrix[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('price_matrix').select('*').eq('device_type_id', screen.device_type_id ?? '')
      .then(({ data }) => setPriceMatrix(data ?? []))
  }, [screen.device_type_id])

  useEffect(() => {
    if (customerSearch.length < 1) { setCustomers([]); return }
    const supabase = createClient()
    const t = setTimeout(async () => {
      const { data } = await supabase.from('customers').select('*')
        .or(`name.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%`).limit(5)
      setCustomers(data ?? [])
    }, 300)
    return () => clearTimeout(t)
  }, [customerSearch])

  const currentPrice = priceMatrix.find(p => p.play_mode_id === selectedPlayMode)?.price_per_hour ?? 0

  async function handleConfirm() {
    if (!selectedPlayMode) return
    setLoading(true)
    try { await onConfirm(selectedPlayMode, selectedCustomer?.id ?? null, password) } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: '#ffffff' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-base font-bold">بدء جلسة — {screen.name}</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{screen.device_type?.name} · {screen.section?.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">نمط اللعب</label>
            <div className="grid grid-cols-2 gap-2">
              {playModes.map(pm => (
                <button key={pm.id} onClick={() => setSelectedPlayMode(pm.id)}
                  className="flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium"
                  style={{ borderColor: selectedPlayMode === pm.id ? 'var(--primary)' : 'var(--border)', background: selectedPlayMode === pm.id ? '#eff6ff' : '#fff', color: selectedPlayMode === pm.id ? 'var(--primary)' : 'var(--foreground)' }}>
                  <Gamepad2 size={14} /><span>{pm.name}</span>
                  <span className="text-xs mr-auto" style={{ color: 'var(--muted-foreground)' }}>{pm.players_count}P</span>
                </button>
              ))}
            </div>
          </div>
          {currentPrice > 0 && (
            <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: '#eff6ff' }}>
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>سعر الساعة</span>
              <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{formatCurrency(currentPrice)}</span>
            </div>
          )}
          <div className="relative">
            <label className="text-sm font-medium mb-2 block"><span className="flex items-center gap-1.5"><User size={13} />عميل (اختياري)</span></label>
            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <div className="text-sm font-medium">{selectedCustomer.name}</div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{selectedCustomer.phone} · رصيد: {formatCurrency(selectedCustomer.balance)}</div>
                </div>
                <button onClick={() => { setSelectedCustomer(null); setCustomerSearch('') }} className="text-xs hover:underline" style={{ color: 'var(--destructive)' }}>إزالة</button>
              </div>
            ) : (
              <>
                <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="بحث باسم أو رقم الهاتف..."
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: 'var(--border)' }} />
                {customers.length > 0 && (
                  <div className="absolute top-full mt-1 w-full rounded-lg border shadow-lg z-10" style={{ background: '#fff', borderColor: 'var(--border)' }}>
                    {customers.map(c => (
                      <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomers([]) }}
                        className="w-full text-right px-3 py-2 text-sm hover:bg-slate-50">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{c.phone}</div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          {screen.device_type?.name?.startsWith('PC') && (
            <div>
              <label className="text-sm font-medium mb-2 block">كلمة مرور الجلسة (PC Agent)</label>
              <input type="text" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="اختياري" className="w-full rounded-lg border px-3 py-2 text-sm outline-none font-mono" style={{ borderColor: 'var(--border)' }} />
            </div>
          )}
        </div>
        <div className="flex gap-2 p-5 pt-0">
          <button onClick={onClose} className="flex-1 rounded-lg border py-2.5 text-sm font-medium hover:bg-slate-50" style={{ borderColor: 'var(--border)' }}>إلغاء</button>
          <button onClick={handleConfirm} disabled={!selectedPlayMode || loading}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-60" style={{ background: 'var(--primary)' }}>
            {loading ? 'جارِ التشغيل...' : 'بدء الجلسة'}
          </button>
        </div>
      </div>
    </div>
  )
}
