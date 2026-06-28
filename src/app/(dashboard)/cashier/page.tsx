'use client'

import { useEffect, useState } from 'react'
import { DollarSign, ArrowDownCircle, ArrowUpCircle, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { CashBox, CashTransaction, Expense } from '@/types/database'
import Header from '@/components/layout/Header'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function CashierPage() {
  const [boxes, setBoxes] = useState<CashBox[]>([])
  const [selectedBox, setSelectedBox] = useState<CashBox | null>(null)
  const [transactions, setTransactions] = useState<CashTransaction[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expAmount, setExpAmount] = useState('')
  const [expDesc, setExpDesc] = useState('')
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('cash_boxes').select('*').order('name')
    setBoxes(data ?? [])
    if (data && data.length > 0 && !selectedBox) setSelectedBox(data[0])
  }

  async function loadBox(box: CashBox) {
    setSelectedBox(box)
    const [{ data: tx }, { data: exp }] = await Promise.all([
      supabase.from('cash_transactions').select('*').eq('box_id', box.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('expenses').select('*').eq('box_id', box.id).order('created_at', { ascending: false }).limit(20),
    ])
    setTransactions(tx ?? [])
    setExpenses(exp ?? [])
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (selectedBox) loadBox(selectedBox) }, [selectedBox?.id])

  async function addExpense() {
    if (!selectedBox || !expAmount) return
    const amount = parseFloat(expAmount)
    if (isNaN(amount) || amount <= 0) return
    await supabase.from('expenses').insert({ amount, description: expDesc || null, box_id: selectedBox.id })
    await supabase.from('cash_boxes').update({ balance: selectedBox.balance - amount }).eq('id', selectedBox.id)
    setExpAmount(''); setExpDesc(''); setShowExpenseForm(false)
    load()
  }

  return (
    <>
      <Header title="الصندوق / الوردية" />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-56 flex flex-col border-l" style={{ borderColor: 'var(--border)', background: '#fff' }}>
          <div className="p-3 text-xs font-semibold border-b" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>الصناديق</div>
          {boxes.map(box => (
            <button key={box.id} onClick={() => loadBox(box)}
              className="w-full text-right px-3 py-3 border-b hover:bg-slate-50"
              style={{ borderColor: 'var(--border)', background: selectedBox?.id === box.id ? '#eff6ff' : '#fff' }}>
              <div className="text-sm font-medium">{box.name}</div>
              <div className="text-xs mt-0.5" style={{ color: box.balance >= 0 ? 'var(--success)' : 'var(--destructive)', fontWeight: 600 }}>{formatCurrency(box.balance)}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{box.type === 'cash' ? 'نقدي' : 'خزنة'}</div>
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {selectedBox && (
            <>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold">{selectedBox.name}</h2>
                  <div className="text-2xl font-bold mt-1" style={{ color: selectedBox.balance >= 0 ? 'var(--success)' : 'var(--destructive)' }}>{formatCurrency(selectedBox.balance)}</div>
                </div>
                <button onClick={() => setShowExpenseForm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--destructive)' }}>
                  <Plus size={14} /> مصروف
                </button>
              </div>
              {showExpenseForm && (
                <div className="mb-4 p-4 rounded-xl border flex flex-col gap-3" style={{ borderColor: 'var(--border)', background: '#fef2f2' }}>
                  <h3 className="text-sm font-semibold">تسجيل مصروف</h3>
                  <input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="المبلغ (SYP)"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: 'var(--border)' }} />
                  <input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="الوصف"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: 'var(--border)' }} />
                  <div className="flex gap-2">
                    <button onClick={() => setShowExpenseForm(false)} className="flex-1 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border)' }}>إلغاء</button>
                    <button onClick={addExpense} className="flex-1 py-2 rounded-lg text-sm text-white" style={{ background: 'var(--destructive)' }}>تسجيل</button>
                  </div>
                </div>
              )}
              <h3 className="text-sm font-semibold mb-3">آخر العمليات</h3>
              <div className="flex flex-col gap-2">
                {transactions.map(tx => (
                  <div key={tx.id} className="rounded-xl border p-3 flex items-center justify-between" style={{ borderColor: 'var(--border)', background: '#fff' }}>
                    <div className="flex items-center gap-3">
                      {tx.type === 'in' ? <ArrowDownCircle size={18} style={{ color: 'var(--success)' }} /> : <ArrowUpCircle size={18} style={{ color: 'var(--destructive)' }} />}
                      <div>
                        <div className="text-sm">{tx.description ?? (tx.type === 'in' ? 'وارد' : 'صادر')}</div>
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{formatDate(tx.created_at)}</div>
                      </div>
                    </div>
                    <span className="font-bold text-sm" style={{ color: tx.type === 'in' ? 'var(--success)' : 'var(--destructive)' }}>
                      {tx.type === 'in' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
                {transactions.length === 0 && <p className="text-sm text-center py-8" style={{ color: 'var(--muted-foreground)' }}>لا توجد عمليات</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
