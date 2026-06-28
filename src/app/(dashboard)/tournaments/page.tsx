'use client'

import { useEffect, useState } from 'react'
import { Plus, Trophy, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Tournament, Team, TournamentParticipant, Match } from '@/types/database'
import Header from '@/components/layout/Header'

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selected, setSelected] = useState<Tournament | null>(null)
  const [participants, setParticipants] = useState<TournamentParticipant[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [showNewTournament, setShowNewTournament] = useState(false)
  const [newName, setNewName] = useState('')
  const supabase = createClient()

  async function load() {
    const [{ data: t }, { data: te }] = await Promise.all([
      supabase.from('tournaments').select('*').order('created_at', { ascending: false }),
      supabase.from('teams').select('*').order('name'),
    ])
    setTournaments(t ?? [])
    setTeams(te ?? [])
  }

  async function loadTournament(t: Tournament) {
    setSelected(t)
    const [{ data: p }, { data: m }] = await Promise.all([
      supabase.from('tournament_participants').select('*, team:teams(*)').eq('tournament_id', t.id).order('seed'),
      supabase.from('matches').select('*, team1:teams!matches_team1_id_fkey(*), team2:teams!matches_team2_id_fkey(*)').eq('tournament_id', t.id).order('round_num').order('match_num'),
    ])
    setParticipants(p ?? [])
    setMatches(m ?? [])
  }

  useEffect(() => { load() }, [])

  async function createTournament() {
    if (!newName) return
    const { data } = await supabase.from('tournaments').insert({ name: newName, format: 'SINGLE_ELIM', status: 'DRAFT' }).select().single()
    if (data) { setTournaments(prev => [data, ...prev]); setSelected(data) }
    setNewName(''); setShowNewTournament(false)
  }

  async function addParticipant(teamId: string) {
    if (!selected) return
    await supabase.from('tournament_participants').insert({ tournament_id: selected.id, team_id: teamId, seed: participants.length + 1 })
    loadTournament(selected)
  }

  async function generateBracket() {
    if (!selected || participants.length < 2) return
    const matchesData = []
    let matchNum = 1
    const firstRoundMatches = Math.ceil(participants.length / 2)
    for (let i = 0; i < firstRoundMatches; i++) {
      matchesData.push({
        tournament_id: selected.id,
        round_name: 'الدور الأول',
        round_num: 1,
        match_num: matchNum++,
        team1_id: participants[i * 2]?.team_id ?? null,
        team2_id: participants[i * 2 + 1]?.team_id ?? null,
      })
    }
    await supabase.from('matches').insert(matchesData)
    await supabase.from('tournaments').update({ status: 'ACTIVE' }).eq('id', selected.id)
    setSelected(prev => prev ? { ...prev, status: 'ACTIVE' } : null)
    loadTournament(selected)
  }

  const STATUS_LABELS = { DRAFT: 'مسودة', ACTIVE: 'نشط', COMPLETED: 'منتهي' }
  const STATUS_COLORS = { DRAFT: '#94a3b8', ACTIVE: '#22c55e', COMPLETED: '#2563eb' }

  return (
    <>
      <Header title="البطولات والفرق" />
      <div className="flex-1 flex overflow-hidden">
        {/* Left: tournaments list */}
        <div className="w-64 flex flex-col border-l" style={{ borderColor: 'var(--border)', background: '#fff' }}>
          <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => setShowNewTournament(true)}
              className="flex items-center gap-1.5 w-full py-2 rounded-lg text-sm font-medium text-white justify-center"
              style={{ background: 'var(--primary)' }}
            >
              <Plus size={14} /> بطولة جديدة
            </button>
            {showNewTournament && (
              <div className="mt-2 flex flex-col gap-2">
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="اسم البطولة"
                  className="w-full rounded-lg border px-3 py-1.5 text-sm outline-none"
                  style={{ borderColor: 'var(--border)' }}
                />
                <div className="flex gap-1">
                  <button onClick={() => setShowNewTournament(false)} className="flex-1 py-1.5 rounded text-xs border" style={{ borderColor: 'var(--border)' }}>إلغاء</button>
                  <button onClick={createTournament} className="flex-1 py-1.5 rounded text-xs text-white" style={{ background: 'var(--primary)' }}>إنشاء</button>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {tournaments.map(t => (
              <button
                key={t.id}
                onClick={() => loadTournament(t)}
                className="w-full text-right px-3 py-3 border-b hover:bg-slate-50 flex items-start justify-between gap-2"
                style={{ borderColor: 'var(--border)', background: selected?.id === t.id ? '#eff6ff' : '#fff' }}
              >
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{t.format}</div>
                </div>
                <span
                  className="text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: STATUS_COLORS[t.status] + '20', color: STATUS_COLORS[t.status] }}
                >
                  {STATUS_LABELS[t.status]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: tournament detail */}
        <div className="flex-1 overflow-y-auto p-5">
          {!selected ? (
            <div className="flex items-center justify-center h-full" style={{ color: 'var(--muted-foreground)' }}>
              <div className="text-center">
                <Trophy size={48} className="mx-auto mb-3 opacity-30" />
                <p>اختر بطولة أو أنشئ واحدة</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold">{selected.name}</h2>
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{selected.format} · {STATUS_LABELS[selected.status]}</span>
                </div>
                {selected.status === 'DRAFT' && participants.length >= 2 && (
                  <button
                    onClick={generateBracket}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ background: 'var(--primary)' }}
                  >
                    توليد البراكيت
                  </button>
                )}
              </div>

              {/* Participants */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={15} style={{ color: 'var(--muted-foreground)' }} />
                  <h3 className="text-sm font-semibold">الفرق المشاركة ({participants.length})</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {participants.map(p => (
                    <span key={p.id} className="text-sm px-3 py-1.5 rounded-lg border font-medium" style={{ borderColor: 'var(--border)', background: '#fff' }}>
                      #{p.seed} {(p as any).team?.name}
                    </span>
                  ))}
                  {selected.status === 'DRAFT' && (
                    <select
                      onChange={e => { if (e.target.value) addParticipant(e.target.value); e.target.value = '' }}
                      className="text-sm px-3 py-1.5 rounded-lg border outline-none"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <option value="">+ إضافة فريق</option>
                      {teams
                        .filter(t => !participants.some(p => p.team_id === t.id))
                        .map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {/* Matches */}
              {matches.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">المباريات</h3>
                  <div className="flex flex-col gap-2">
                    {matches.map(m => (
                      <div key={m.id} className="rounded-xl border p-4 flex items-center justify-between" style={{ borderColor: 'var(--border)', background: '#fff' }}>
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{m.round_name} — مباراة {m.match_num}</div>
                        <div className="flex items-center gap-3 text-sm font-semibold">
                          <span>{(m as any).team1?.name ?? 'TBD'}</span>
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--secondary)' }}>
                            {m.score1 ?? '-'} : {m.score2 ?? '-'}
                          </span>
                          <span>{(m as any).team2?.name ?? 'TBD'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
