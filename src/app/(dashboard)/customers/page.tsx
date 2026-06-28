'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, User, Phone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Customer, CustomerTransaction } from '@/types/database'
import Header from '@/components/layout/Header'
import { formatCurrency, formatDate } from '@/lib/utils'

type FilterTab = 'all' | 'debt' | 'no_debt'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selected, setSelected] = useState<Customer | null>(null)
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<FilterTab>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showTxForm, setShowTxForm] = useState<'debt' | 'payment' | null>(null)
  const [txAmount, setTxAmount] = useState('')
  const [txDesc, setTxDesc] = useState('')
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const supabase = createClient()

  async function loadCustomers() {
    const { data } = await supabase.from('customers').select('*').order('name')
    setCustomers(data ?? [])
  }

  async function loadTransactions(customerId: string) {
    const { data } = await supabase
      .from('customer_transactions')
      .select('*')
      .eq('customer_id', customerId)
      .eq('cancelled', false)
      .order('created_at', { ascending: false })
    setTransactions(data ?? [])
  }

  useEffect(() => { loadCustomers() }, [])

  useEffect(() => {
    if (selected) loadTransactions(selected.id)
  }, [selected])

  const filtered = customers.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !(c.phone?.includes(search))) return false
    if (tab === 'debt' && c.balance >= 0) return false
    if (tab === 'no_debt' && c.balance < 0) return false
    return true
  })

  async function addCustomer() {
    if (!newName) return
    await supabase.from('customers').insert({ name: newName, phone: newPhone || null })
    setNewName(''); setNewPhone(''); setShowAddForm(false)
    loadCustomers()
  }

  async function addTransaction(type: 'debt_added' | 'payment') {
    if (!selected || !txAmount) return
    const amount = parseFloat(txAmount)
    if (isNaN(amount) || amount <= 0) return

    await supabase.from('customer_transactions').insert({
      customer_id: selected.id,
      type,
      amount,
      description: txDesc || null,
    })

    const delta = type === 'debt_added' ? -amount : amount
    const newBalance = selected.balance + delta
    await supabase.from('customers').update({ balance: newBalance }).eq('id', selected.id)

    setTxAmount(''); setTxDesc(''); setShowTxForm(null)
    loadCustomers()
    loadTransactions(selected.id)
    setSelected(prev => prev ? { ...prev, balance: newBalance } : null)
  }

  return (
    <>
      <Header title="العملاء والديون" />
      <div className="flex-1 flex overflow-hidden">
        {/* List */}
        <div className="w-72 flex flex-col border-l" style={{ borderColor: 'var(--border)', background: '#fff' }}>
          <div className="p-3 border-b flex flex-col gap-2" style={{ borderColor: 'var(--border)' }}>
            <div className="relative">
              <Search size={14} className="absolute top-1/2 -translate-y-1/2 end-3" style={{ color: 'var(--muted-foreground)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث..."
                className="w-full rounded-lg border pe-8 px-3 py-1.5 text-sm outline-none"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>
            <div className="flex gap-1">
              {([['all', 'الكل'], ['debt', 'مدينون'], ['no_debt', 'بلا دين']] as const).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setTab(v)}
                  className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors"
                  style={{
                    background: tab === v ? 'var(--primary)' : 'var(--secondary)',
                    color: tab === v ? '#fff' : 'var(--foreground)',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ background: 'var(--primary)' }}
            >
              <Plus size={12} /> عميل جديد
            </button>
          </div>

          {showAddForm && (
            <div className="p-3 border-b flex flex-col gap-2" style={{ borderColor: 'var(--border)', background: '#f8fafc' }}>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="اسم العميل *"
                className="w-full rounded-lg border px-3 py-1.5 text-sm outline-none"
                style={{ borderColor: 'var(--border)' }}
              />
              <input
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                placeholder="رقم الهاتف"
                className="w-full rounded-lg border px-3 py-1.5 text-sm outline-none"
                style={{ borderColor: 'var(--border)' }}
              />
              <div className="flex gap-2">
                <button onClick={() => setShowAddForm(false)} className="flex-1 py-1.5 rounded-lg text-xs border" style={{ borderColor: 'var(--border)' }}>إلغاء</button>
                <button onClick={addCustomer} className="flex-1 py-1.5 rounded-lg text-xs text-white" style={{ background: 'var(--primary)' }}>حفظ</button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className="w-full text-right px-3 py-3 border-b flex items-center justify-between gap-2 transition-colors hover:bg-slate-50"
                style={{
                  borderColor: 'var(--border)',
                  background: selected?.id === c.id ? '#eff6ff' : '#fff',
                }}
              >
                <div>
                  <div className="text-sm font-medium">{c.name}</div>
                  {c.phone && (
                    <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      <Phone size={10} />{c.phone}
                    </div>
                  )}
                </div>
                {c.balance < 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#fef2f2', color: 'var(--destructive)' }}>
                    {formatCurrency(Math.abs(c.balance))}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--muted-foreground)' }}>
              <div className="text-center">
                <User size={48} className="mx-auto mb-3 opacity-30" />
                <p>اختر عميلاً لعرض تفاصيله</p>
              </div>
            </div>
          ) : (
            <>
              {/* Customer header */}
              <div className="p-5 border-b" style={{ borderColor: 'var(--border)', background: '#fff' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{selected.name}</h2>
                    {selected.phone && (
                      <div className="flex items-center gap-1.5 text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                        <Phone size={13} />{selected.phone}
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>الرصيد</div>
                    <div
                      className="text-xl font-bold"
                      style={{ color: selected.balance < 0 ? 'var(--destructive)' : 'var(--success)' }}
                    >
                      {selected.balance < 0 ? `-${formatCurrency(Math.abs(selected.balance))}` : formatCurrency(selected.balance)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowTxForm('debt')}
                    className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ background: 'var(--destructive)' }}
                  >
                    تسجيل دين
                  </button>
                  <button
                    onClick={() => setShowTxForm('payment')}
                    className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ background: 'var(--success)' }}
                  >
                    تسجيل دفعة
                  </button>
                </div>

                {showTxForm && (
                  <div className="mt-3 flex flex-col gap-2 p-3 rounded-xl" style={{ background: 'var(--secondary)' }}>
                    <div className="text-sm font-medium">
                      {showTxForm === 'debt' ? 'تسجيل دين جديد' : 'تسجيل دفعة'}
                    </div>
                    <input
                      type="number"
                      value={txAmount}
                      onChange={e => setTxAmount(e.target.value)}
                      placeholder="المبلغ (SYP)"
                      className="w-full rounded-lg border px-3 py-1.5 text-sm outline-none"
                      style={{ borderColor: 'var(--border)' }}
                    />
                    <input
                      value={txDesc}
                      onChange={e => setTxDesc(e.target.value)}
                      placeholder="وصف (اختياري)"
                      className="w-full rounded-lg border px-3 py-1.5 text-sm outline-none"
                      style={{ borderColor: 'var(--border)' }}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setShowTxForm(null)} className="flex-1 py-1.5 rounded-lg text-sm border" style={{ borderColor: 'var(--border)' }}>إلغاء</button>
                      <button
                        onClick={() => addTransaction(showTxForm === 'debt' ? 'debt_added' : 'payment')}
                        className="flex-1 py-1.5 rounded-lg text-sm text-white"
                        style={{ background: showTxForm === 'debt' ? 'var(--destructive)' : 'var(--success)' }}
                      >
                        تأكيد
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Transactions */}
              <div className="flex-1 overflow-y-auto p-5">
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  سجل المعاملات
                </h3>
                <div className="flex flex-col gap-2">
                  {transactions.length === 0 ? (
                    <p className="text-sm text-center py-8" style={{ color: 'var(--muted-foreground)' }}>لا توجد معاملات</p>
                  ) : (
                    transactions.map(tx => (
                      <div
                        key={tx.id}
                        className="rounded-xl border p-3 flex items-center justify-between"
                        style={{ borderColor: 'var(--border)', background: '#fff' }}
                      >
                        <div>
                          <div className="text-sm font-medium">
                            {tx.type === 'debt_added' ? 'دين' : tx.type === 'payment' ? 'دفعة' : tx.type === 'refund' ? 'مرتجع' : 'رصيد افتتاحي'}
                          </div>
                          {tx.description && (
                            <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{tx.description}</div>
                          )}
                          <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{formatDate(tx.created_at)}</div>
                        </div>
                        <span
                          className="font-bold text-sm"
                          style={{ color: tx.type === 'debt_added' ? 'var(--destructive)' : 'var(--success)' }}
                        >
                          {tx.type === 'debt_added' ? '-' : '+'}{formatCurrency(tx.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
