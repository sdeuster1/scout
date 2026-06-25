import { useState, useEffect } from 'react'
import { api } from '../api'

const leaderboard = [
  { name: 'Maria G.', initials: 'MG', sqls: 7, color: 'bg-[#00D68F]/15 text-[#00D68F]' },
  { name: 'Santiago R.', initials: 'SR', sqls: 6, color: 'bg-amber-400/15 text-amber-400' },
  { name: 'Carlos R.', initials: 'CR', sqls: 5, color: 'bg-white/[0.06] text-[#8899AA]' },
  { name: 'Ana P.', initials: 'AP', sqls: 4, color: 'bg-white/[0.06] text-[#8899AA]' },
  { name: 'Diego M.', initials: 'DM', sqls: 3, color: 'bg-white/[0.06] text-[#8899AA]' },
]

export default function KnowledgeBase() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(api('/api/knowledge-base'))
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-[#8899AA]">Loading knowledge base...</div>
  if (!data) return <div className="text-center py-20 text-[#8899AA]">Failed to load data</div>

  const maxSqls = leaderboard[0].sqls

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-medium text-white">Knowledge base</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total calls" value={data.total_calls} />
        <StatCard label="SQLs" value={data.total_sqls} accent />
        <StatCard label="Win rate" value={`${data.win_rate}%`} />
        <StatCard label="Brief accuracy" value={`${data.brief_accuracy || '—'}%`} />
      </div>

      {/* Leaderboard */}
      <Card title="SQL leaderboard — this week" icon="🏆">
        <div className="space-y-0">
          {leaderboard.map((p, i) => (
            <div key={i} className="flex items-center py-2.5 border-b border-white/[0.06] last:border-0">
              <span className={`w-5 text-[13px] font-medium ${i < 2 ? 'text-amber-400' : 'text-[#8899AA]'}`}>
                {i + 1}
              </span>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium mr-2.5 ${p.color}`}>
                {p.initials}
              </div>
              <span className="flex-1 text-[13px] text-white">{p.name}</span>
              <span className="text-[15px] font-medium text-[#00D68F] w-7 text-right">{p.sqls}</span>
              <div className="w-16 h-1 bg-white/[0.06] rounded-full ml-3">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(p.sqls / maxSqls) * 100}%`,
                    background: i === 0 ? '#00D68F' : i === 1 ? '#F59E0B' : 'rgba(255,255,255,0.2)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top openers */}
      <Card title="Top performing openers">
        <div className="space-y-3">
          {data.top_openers.map((o, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-[11px] font-medium text-[#8899AA] mt-0.5 w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-white">{o.opener}</p>
                <p className="text-[11px] text-[#8899AA] mt-0.5">
                  {o.sql_count} SQLs from {o.uses} uses
                </p>
              </div>
              <WinBadge wins={o.sql_count} total={o.uses} />
            </div>
          ))}
        </div>
      </Card>

      {/* Objections */}
      <Card title="Most common objections & best counters">
        <div className="space-y-4">
          {data.top_objections.map((o, i) => (
            <div key={i} className="border-b border-white/[0.06] pb-3 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12px] font-medium text-red-400">"{o.objection}"</p>
                <span className="text-[11px] text-[#8899AA] whitespace-nowrap">{o.times}x heard</span>
              </div>
              {o.counter && (
                <p className="text-[12px] text-[#00D68F] mt-1">→ "{o.counter}"</p>
              )}
              <p className="text-[11px] text-[#8899AA] mt-0.5">
                Led to SQL {o.worked} of {o.times} times
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Best titles */}
      <Card title="Best contact titles by company size">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[10px] text-[#8899AA] uppercase tracking-wider">
                <th className="pb-2 font-medium">Title</th>
                <th className="pb-2 font-medium">Company size</th>
                <th className="pb-2 font-medium text-right">Calls</th>
                <th className="pb-2 font-medium text-right">SQLs</th>
              </tr>
            </thead>
            <tbody>
              {data.best_titles.map((t, i) => (
                <tr key={i} className="border-t border-white/[0.06]">
                  <td className="py-2 text-white">{t.title}</td>
                  <td className="py-2 text-[#8899AA]">{t.company_size}</td>
                  <td className="py-2 text-right text-[#8899AA]">{t.times}</td>
                  <td className="py-2 text-right font-medium text-[#00D68F]">{t.sql_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Country breakdown */}
      <Card title="Country breakdown">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {data.countries.map((c, i) => (
            <div key={i} className="flex items-center justify-between bg-white/[0.03] rounded-lg px-4 py-3 border border-white/[0.06]">
              <div>
                <p className="text-[13px] font-medium text-white">{c.country}</p>
                <p className="text-[11px] text-[#8899AA]">{c.total} calls · {c.sqls} SQLs</p>
              </div>
              <span className={`text-[13px] font-medium ${
                c.win_rate >= 60 ? 'text-[#00D68F]' : c.win_rate >= 40 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {c.win_rate}%
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-[#1A2D42] rounded-xl border border-white/[0.08] px-4 py-4">
      <p className="text-[10px] font-medium text-[#8899AA] uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-medium mt-1 ${accent ? 'text-[#00D68F]' : 'text-white'}`}>{value}</p>
    </div>
  )
}

function Card({ title, icon, children }) {
  return (
    <div className="bg-[#1A2D42] rounded-xl border border-white/[0.08] p-5">
      <h3 className="text-[13px] font-medium text-white mb-4">
        {icon && <span className="mr-1.5">{icon}</span>}
        {title}
      </h3>
      {children}
    </div>
  )
}

function WinBadge({ wins, total }) {
  const rate = total > 0 ? Math.round((wins / total) * 100) : 0
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
      rate >= 60 ? 'bg-[#00D68F]/15 text-[#00D68F]' : 'bg-white/[0.06] text-[#8899AA]'
    }`}>
      {rate}%
    </span>
  )
}
