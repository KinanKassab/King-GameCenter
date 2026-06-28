'use client'

import { useEffect, useState } from 'react'
import { Save, Plus, Edit2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Screen, Section, DeviceType } from '@/types/database'
import Header from '@/components/layout/Header'

export default function SettingsPage() {
  const [storeName, setStoreName] = useState('')
  const [currency, setCurrency] = useState('SYP')
  const [rounding, setRounding] = useState('0')
  const [screens, setScreens] = useState<Screen[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([])
  const [tab, setTab] = useState<'store' | 'screens' | 'pricing'>('store')
  const [showScreenForm, setShowScreenForm] = useState(false)
  const [editScreen, setEditScreen] = useState<Screen | null>(null)
  const [screenForm, setScreenForm] = useState({
    name: '', section_id: '', device_type_id: '', ip: '', port: '9471', secret: '',
  })
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  async function load() {
    const [{ data: settings }, { data: sc }, { data: sec }, { data: dt }] = await Promise.all([
      supabase.from('settings').select('*'),
      supabase.from('screens').select('*, section:sections(*), device_type:device_types(*)').order('name'),
      supabase.from('sections').select('*').order('sort_order'),
      supabase.from('device_types').select('*').order('name'),
    ])
    for (const s of settings ?? []) {
      if (s.key === 'store_name') setStoreName(s.value)
      if (s.key === 'currency') setCurrency(s.value)
      if (s.key === 'rounding') setRounding(s.value)
    }
    setScreens(sc ?? [])
    setSections(sec ?? [])
    setDeviceTypes(dt ?? [])
  }

  useEffect(() => { load() }, [])

  async function saveStoreSettings() {
    await Promise.all([
      supabase.from('settings').upsert({ key: 'store_name', value: storeName }),
      supabase.from('settings').upsert({ key: 'currency', value: currency }),
      supabase.from('settings').upsert({ key: 'rounding', value: rounding }),
    ])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function openAddScreen() {
    setEditScreen(null)
    setScreenForm({ name: '', section_id: '', device_type_id: '', ip: '', port: '9471', secret: '' })
    setShowScreenForm(true)
  }

  function openEditScreen(s: Screen) {
    setEditScreen(s)
    setScreenForm({
      name: s.name, section_id: s.section_id ?? '', device_type_id: s.device_type_id ?? '',
      ip: s.ip ?? '', port: String(s.port ?? 9471), secret: s.secret ?? '',
    })
    setShowScreenForm(true)
  }

  async function saveScreen() {
    const data = {
      name: screenForm.name,
      section_id: screenForm.section_id || null,
      device_type_id: screenForm.device_type_id || null,
      ip: screenForm.ip || null,
      port: parseInt(screenForm.port) || 9471,
      secret: screenForm.secret || null,
    }
    if (editScreen) {
      await supabase.from('screens').update(data).eq('id', editScreen.id)
    } else {
      await supabase.from('screens').insert({ ...data, status: 'available' })
    }
    setShowScreenForm(false)
    load()
  }

  async function deleteScreen(id: string) {
    if (!confirm('حذف هذه الشاشة؟')) return
    await supabase.from('screens').delete().eq('id', id)
    load()
  }

  const tabs = [
    { key: 'store', label: 'إعدادات المتجر' },
    { key: 'screens', label: 'الشاشات' },
    { key: 'pricing', label: 'الأسعار' },
  ] as const

  return (
    <>
      <Header title="الإعدادات" />
      <div className="flex-1 overflow-y-auto p-5">
        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b" style={{ borderColor: 'var(--border)' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
              style={{
                borderColor: tab === t.key ? 'var(--primary)' : 'transparent',
                color: tab === t.key ? 'var(--primary)' : 'var(--muted-foreground)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Store Settings */}
        {tab === 'store' && (
          <div className="max-w-lg flex flex-col gap-4">
            <h2 className="text-base font-semibold">إعدادات المتجر</h2>
            {[
              { label: 'اسم المتجر', value: storeName, set: setStoreName },
              { label: 'العملة', value: currency, set: setCurrency },
              { label: 'التقريب (0 = بدون)', value: rounding, set: setRounding, type: 'number' },
            ].map(f => (
              <div key={f.label}>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--foreground)' }}>{f.label}</label>
                <input
                  type={f.type ?? 'text'}
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
            ))}
            <button
              onClick={saveStoreSettings}
              className="flex items-center gap-2 self-start px-4 py-2.5 rounded-lg text-sm font-medium text-white"
              style={{ background: saved ? 'var(--success)' : 'var(--primary)' }}
            >
              <Save size={14} />
              {saved ? 'تم الحفظ ✓' : 'حفظ الإعدادات'}
            </button>
          </div>
        )}

        {/* Screens */}
        {tab === 'screens' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">إدارة الشاشات ({screens.length})</h2>
              <button
                onClick={openAddScreen}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'var(--primary)' }}
              >
                <Plus size={14} /> شاشة جديدة
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {screens.map(s => (
                <div key={s.id} className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: '#fff' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                        {s.device_type?.name} · {s.section?.name}
                      </div>
                      {s.ip && (
                        <div className="text-xs mt-0.5 font-mono" style={{ color: 'var(--muted-foreground)' }}>
                          {s.ip}:{s.port}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEditScreen(s)} className="p-1.5 rounded-lg hover:bg-slate-100">
                        <Edit2 size={13} style={{ color: 'var(--muted-foreground)' }} />
                      </button>
                      <button onClick={() => deleteScreen(s.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 size={13} style={{ color: 'var(--destructive)' }} />
                      </button>
                    </div>
                  </div>
                  <div
                    className="mt-2 text-xs font-medium px-2 py-0.5 rounded-full inline-block"
                    style={{
                      background: s.status === 'available' ? '#f0fdf4' : s.status === 'playing' ? '#eff6ff' : '#fafafa',
                      color: s.status === 'available' ? '#16a34a' : s.status === 'playing' ? 'var(--primary)' : 'var(--muted-foreground)',
                    }}
                  >
                    {s.status === 'available' ? 'متاح' : s.status === 'playing' ? 'قيد اللعب' : s.status === 'locked' ? 'مغلق' : 'غير متصل'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing - placeholder */}
        {tab === 'pricing' && (
          <div>
            <h2 className="text-base font-semibold mb-4">مصفوفة الأسعار</h2>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              يمكنك إدارة أسعار الساعة لكل نوع جهاز ونمط لعب وشيفت من هنا.
            </p>
          </div>
        )}
      </div>

      {/* Screen Form Dialog */}
      {showScreenForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: '#fff' }}>
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-bold">{editScreen ? 'تعديل شاشة' : 'شاشة جديدة'}</h2>
              <button onClick={() => setShowScreenForm(false)} className="text-sm" style={{ color: 'var(--muted-foreground)' }}>✕</button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              {[
                { label: 'اسم الشاشة *', key: 'name' },
                { label: 'IP Address', key: 'ip' },
                { label: 'المنفذ (Port)', key: 'port', type: 'number' },
                { label: 'المفتاح السري (Secret)', key: 'secret' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{f.label}</label>
                  <input
                    type={f.type ?? 'text'}
                    value={(screenForm as any)[f.key]}
                    onChange={e => setScreenForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)' }}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>القسم</label>
                <select
                  value={screenForm.section_id}
                  onChange={e => setScreenForm(prev => ({ ...prev, section_id: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <option value="">بدون قسم</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>نوع الجهاز</label>
                <select
                  value={screenForm.device_type_id}
                  onChange={e => setScreenForm(prev => ({ ...prev, device_type_id: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <option value="">بدون نوع</option>
                  {deviceTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => setShowScreenForm(false)} className="flex-1 py-2.5 rounded-lg border text-sm" style={{ borderColor: 'var(--border)' }}>إلغاء</button>
              <button onClick={saveScreen} className="flex-1 py-2.5 rounded-lg text-sm text-white font-medium" style={{ background: 'var(--primary)' }}>حفظ</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
