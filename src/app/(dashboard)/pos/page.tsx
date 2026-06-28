'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, Search, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Product, Category, Session } from '@/types/database'
import Header from '@/components/layout/Header'
import { formatCurrency } from '@/lib/utils'
import { usePOSStore } from '@/store/usePOSStore'

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeSessions, setActiveSessions] = useState<Session[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [paymentType, setPaymentType] = useState<'cash' | 'session' | 'customer_debt'>('cash')
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const { cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal } = usePOSStore()
  const supabase = createClient()

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('*, category:categories(*)').eq('status', 'active').order('name'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('sessions').select('*, screen:screens(name)').eq('status', 'active'),
    ]).then(([{ data: p }, { data: c }, { data: s }]) => {
      setProducts(p ?? [])
      setCategories(c ?? [])
      setActiveSessions(s ?? [])
    })
  }, [])

  const filtered = products.filter(p => {
    if (selectedCategory && p.category_id !== selectedCategory) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function handleCheckout() {
    if (cart.length === 0) return
    setProcessing(true)
    try {
      const total = cartTotal()
      const { data: order } = await supabase
        .from('pos_orders')
        .insert({
          total,
          payment_type: paymentType,
          session_id: paymentType === 'session' ? selectedSession : null,
        })
        .select()
        .single()

      if (!order) return

      await supabase.from('pos_order_items').insert(
        cart.map(item => ({
          order_id: order.id,
          product_id: item.product.id,
          qty: item.qty,
          unit_price: item.unitPrice,
          addons_json: [],
        }))
      )

      for (const item of cart) {
        await supabase
          .from('products')
          .update({ quantity: Math.max(0, item.product.quantity - item.qty) })
          .eq('id', item.product.id)
      }

      clearCart()
      setSuccessMsg(`تم إتمام البيع — ${formatCurrency(total)}`)
      setTimeout(() => setSuccessMsg(''), 3000)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      <Header title="نقطة البيع" subtitle="الكافتيريا والمنتجات" />
      <div className="flex-1 flex overflow-hidden">
        {/* Products panel */}
        <div className="flex-1 flex flex-col overflow-hidden border-l" style={{ borderColor: 'var(--border)' }}>
          {/* Search + categories */}
          <div className="p-4 border-b flex flex-col gap-3" style={{ borderColor: 'var(--border)', background: '#fff' }}>
            <div className="relative">
              <Search size={15} className="absolute top-1/2 -translate-y-1/2 end-3" style={{ color: 'var(--muted-foreground)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث في المنتجات..."
                className="w-full rounded-lg border pe-9 px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{
                  background: !selectedCategory ? 'var(--primary)' : 'var(--secondary)',
                  color: !selectedCategory ? '#fff' : 'var(--foreground)',
                }}
              >
                الكل
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(selectedCategory === c.id ? null : c.id)}
                  className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{
                    background: selectedCategory === c.id ? 'var(--primary)' : 'var(--secondary)',
                    color: selectedCategory === c.id ? '#fff' : 'var(--foreground)',
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="rounded-xl border p-3 text-right hover:border-blue-300 hover:shadow-sm transition-all"
                  style={{ borderColor: 'var(--border)', background: '#fff' }}
                >
                  <div className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                    {product.name}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {product.category?.name}
                  </div>
                  <div className="text-sm font-bold mt-2" style={{ color: 'var(--primary)' }}>
                    {formatCurrency(product.sale_price)}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: product.quantity < 5 ? 'var(--destructive)' : 'var(--muted-foreground)' }}>
                    مخزون: {product.quantity}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart panel */}
        <div className="w-72 flex flex-col" style={{ background: '#fff' }}>
          <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} style={{ color: 'var(--primary)' }} />
              <span className="font-bold text-sm">السلة</span>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full text-white mr-auto"
                style={{ background: 'var(--primary)' }}
              >
                {cart.reduce((s, i) => s + i.qty, 0)}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {cart.length === 0 ? (
              <div className="text-center py-10" style={{ color: 'var(--muted-foreground)' }}>
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">السلة فارغة</p>
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.product.id}
                  className="rounded-lg border p-2.5 flex flex-col gap-1.5"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-xs font-medium leading-tight flex-1">{item.product.name}</span>
                    <button onClick={() => removeFromCart(item.product.id)}>
                      <Trash2 size={12} style={{ color: 'var(--destructive)' }} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(item.product.id, item.qty - 1)}
                        className="w-5 h-5 rounded flex items-center justify-center"
                        style={{ background: 'var(--secondary)' }}
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-xs font-bold w-6 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.product.id, item.qty + 1)}
                        className="w-5 h-5 rounded flex items-center justify-center"
                        style={{ background: 'var(--secondary)' }}
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                    <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
                      {formatCurrency(item.unitPrice * item.qty)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout */}
          {cart.length > 0 && (
            <div className="p-3 border-t flex flex-col gap-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--muted-foreground)' }}>الإجمالي</span>
                <span className="font-bold" style={{ color: 'var(--primary)' }}>
                  {formatCurrency(cartTotal())}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>طريقة الدفع</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['cash', 'session', 'customer_debt'] as const).map(pt => (
                    <button
                      key={pt}
                      onClick={() => setPaymentType(pt)}
                      className="text-xs py-1.5 rounded-lg font-medium transition-colors"
                      style={{
                        background: paymentType === pt ? 'var(--primary)' : 'var(--secondary)',
                        color: paymentType === pt ? '#fff' : 'var(--foreground)',
                      }}
                    >
                      {pt === 'cash' ? 'نقدي' : pt === 'session' ? 'جلسة' : 'دين'}
                    </button>
                  ))}
                </div>
              </div>

              {paymentType === 'session' && (
                <select
                  value={selectedSession ?? ''}
                  onChange={e => setSelectedSession(e.target.value)}
                  className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <option value="">اختر جلسة...</option>
                  {activeSessions.map(s => (
                    <option key={s.id} value={s.id}>
                      {(s as any).screen?.name ?? s.screen_id}
                    </option>
                  ))}
                </select>
              )}

              {successMsg && (
                <div className="text-xs text-center py-1.5 rounded-lg" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                  {successMsg}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => clearCart()}
                  className="px-3 py-2 rounded-lg text-xs border"
                  style={{ borderColor: 'var(--border)' }}
                >
                  مسح
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={processing}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                  style={{ background: 'var(--primary)' }}
                >
                  {processing ? 'جارٍ البيع...' : 'إتمام البيع'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
