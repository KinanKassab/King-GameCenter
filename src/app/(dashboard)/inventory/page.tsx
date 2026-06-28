'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, Edit2, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Product, Category } from '@/types/database'
import Header from '@/components/layout/Header'
import { formatCurrency } from '@/lib/utils'

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState({ name: '', sku: '', category_id: '', sale_price: '', purchase_price: '', quantity: '', alert_qty: '' })
  const supabase = createClient()

  async function load() {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('products').select('*, category:categories(*)').order('name'),
      supabase.from('categories').select('*').order('sort_order'),
    ])
    setProducts(p ?? [])
    setCategories(c ?? [])
  }

  useEffect(() => { load() }, [])

  const filtered = products.filter(p => {
    if (selectedCategory && p.category_id !== selectedCategory) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function openAdd() {
    setEditProduct(null)
    setForm({ name: '', sku: '', category_id: '', sale_price: '', purchase_price: '', quantity: '', alert_qty: '' })
    setShowForm(true)
  }

  function openEdit(p: Product) {
    setEditProduct(p)
    setForm({
      name: p.name, sku: p.sku ?? '', category_id: p.category_id ?? '',
      sale_price: String(p.sale_price), purchase_price: String(p.purchase_price),
      quantity: String(p.quantity), alert_qty: String(p.alert_qty),
    })
    setShowForm(true)
  }

  async function saveProduct() {
    const qty = parseInt(form.quantity) || 0
    const alertQty = parseInt(form.alert_qty) || 0
    const sale = parseFloat(form.sale_price) || 0
    const purchase = parseFloat(form.purchase_price) || 0
    const status: Product['status'] = qty === 0 ? 'out' : qty <= alertQty ? 'low' : 'active'

    if (editProduct) {
      await supabase.from('products').update({
        name: form.name, sku: form.sku || null,
        category_id: form.category_id || null,
        sale_price: sale, purchase_price: purchase,
        quantity: qty, alert_qty: alertQty, status,
      }).eq('id', editProduct.id)
    } else {
      await supabase.from('products').insert({
        name: form.name, sku: form.sku || null,
        category_id: form.category_id || null,
        sale_price: sale, purchase_price: purchase,
        quantity: qty, alert_qty: alertQty, status,
      })
    }
    setShowForm(false)
    load()
  }

  const STATUS_COLORS = { active: '#22c55e', low: '#f59e0b', out: '#ef4444' }
  const STATUS_LABELS = { active: 'متوفر', low: 'منخفض', out: 'نفد' }

  return (
    <>
      <Header title="إدارة المخزون" subtitle={`${products.length} منتج`} />
      <div className="flex-1 overflow-y-auto">
        {/* Toolbar */}
        <div className="px-5 py-3 border-b flex items-center gap-3 flex-wrap" style={{ borderColor: 'var(--border)', background: '#fff' }}>
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute top-1/2 -translate-y-1/2 end-3" style={{ color: 'var(--muted-foreground)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث في المنتجات..."
              className="w-full rounded-lg border pe-9 px-3 py-2 text-sm outline-none"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{ background: !selectedCategory ? 'var(--primary)' : 'var(--secondary)', color: !selectedCategory ? '#fff' : 'var(--foreground)' }}
            >
              الكل
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(selectedCategory === c.id ? null : c.id)}
                className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{ background: selectedCategory === c.id ? 'var(--primary)' : 'var(--secondary)', color: selectedCategory === c.id ? '#fff' : 'var(--foreground)' }}
              >
                {c.name}
              </button>
            ))}
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white mr-auto"
            style={{ background: 'var(--primary)' }}
          >
            <Plus size={14} /> منتج جديد
          </button>
        </div>

        {/* Table */}
        <div className="p-5">
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--secondary)' }}>
                  {['المنتج', 'الفئة', 'سعر البيع', 'سعر الشراء', 'المخزون', 'الحد الأدنى', 'الحالة', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-right font-medium text-xs" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderTop: '1px solid var(--border)' }}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.name}</div>
                      {p.sku && <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>#{p.sku}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>{p.category?.name ?? '-'}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--primary)' }}>{formatCurrency(p.sale_price)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>{formatCurrency(p.purchase_price)}</td>
                    <td className="px-4 py-3">
                      <span
                        className="font-bold"
                        style={{ color: p.quantity === 0 ? 'var(--destructive)' : p.quantity <= p.alert_qty ? 'var(--warning)' : 'var(--foreground)' }}
                      >
                        {p.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>{p.alert_qty}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: STATUS_COLORS[p.status] + '20', color: STATUS_COLORS[p.status] }}
                      >
                        {STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-100">
                        <Edit2 size={13} style={{ color: 'var(--muted-foreground)' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12" style={{ color: 'var(--muted-foreground)' }}>
                <Package size={36} className="mx-auto mb-2 opacity-30" />
                <p>لا توجد منتجات</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Form Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: '#fff' }}>
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-bold">{editProduct ? 'تعديل منتج' : 'منتج جديد'}</h2>
              <button onClick={() => setShowForm(false)} className="text-sm" style={{ color: 'var(--muted-foreground)' }}>✕</button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {[
                { label: 'اسم المنتج *', key: 'name', colSpan: true },
                { label: 'SKU (رمز)', key: 'sku' },
                { label: 'سعر البيع', key: 'sale_price', type: 'number' },
                { label: 'سعر الشراء', key: 'purchase_price', type: 'number' },
                { label: 'الكمية', key: 'quantity', type: 'number' },
                { label: 'حد التنبيه', key: 'alert_qty', type: 'number' },
              ].map(f => (
                <div key={f.key} className={f.colSpan ? 'col-span-2' : ''}>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{f.label}</label>
                  <input
                    type={f.type ?? 'text'}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)' }}
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>الفئة</label>
                <select
                  value={form.category_id}
                  onChange={e => setForm(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <option value="">بدون فئة</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border text-sm" style={{ borderColor: 'var(--border)' }}>إلغاء</button>
              <button onClick={saveProduct} className="flex-1 py-2.5 rounded-lg text-sm text-white font-medium" style={{ background: 'var(--primary)' }}>حفظ</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
