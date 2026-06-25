import { useState, useEffect } from 'react'
import { api } from '../api'

const leaderboard = [
  { name: 'Maria G.', initials: 'MG', sqls: 7, color: 'bg-[#c4b1f9]/15 text-[#c4b1f9]' },
  { name: 'Santiago R.', initials: 'SR', sqls: 6, color: 'bg-[#ffe27c]/15 text-[#ffe27c]' },
  { name: 'Carlos R.', initials: 'CR', sqls: 5, color: 'bg-white/[0.06] text-[#8899AA]' },
  { name: 'Ana P.', initials: 'AP', sqls: 4, color: 'bg-white/[0.06] text-[#8899AA]' },
  { name: 'Diego M.', initials: 'DM', sqls: 3, color: 'bg-white/[0.06] text-[#8899AA]' },
]

const outcomeBadge = {
  SQL: 'bg-[#00D68F]/15 text-[#00D68F]',
  Connected: 'bg-[#ffe27c]/15 text-[#ffe27c]',
  Gatekeeper: 'bg-red-400/15 text-red-400',
  'No answer': 'bg-white/[0.06] text-[#8899AA]',
}

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
      <h2 className="text-lg font-medium text-[#fffbf4]">Knowledge base</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total calls" value={data.total_calls} />
        <StatCard label="SQLs" value={data.total_sqls} accent />
        <StatCard label="Win rate" value={`${data.win_rate}%`} />
        <StatCard label="Brief accuracy" value={`${data.brief_accuracy || '—'}%`} />
      </div>

      <Card title="SQL leaderboard — this week" icon="🏆">
        <div className="space-y-0">
          {leaderboard.map((p, i) => (
            <div key={i} className="flex items-center py-2.5 border-b border-white/[0.06] last:border-0">
              <span className={`w-5 text-[13px] font-medium ${i < 2 ? 'text-[#ffe27c]' : 'text-[#8899AA]'}`}>
                {i + 1}
              </span>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium mr-2.5 ${p.color}`}>
                {p.initials}
              </div>
              <span className="flex-1 text-[13px] text-[#fffbf4]">{p.name}</span>
              <span className="text-[15px] font-medium text-[#c4b1f9] w-7 text-right">{p.sqls}</span>
              <div className="w-16 h-1 bg-white/[0.06] rounded-full ml-3">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(p.sqls / maxSqls) * 100}%`,
                    background: i === 0 ? '#c4b1f9' : i === 1 ? '#ffe27c' : 'rgba(255,255,255,0.15)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Key learnings from calls" icon="💡">
        <div className="space-y-0 max-h-[320px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1A2D42 transparent' }}>
          {(data.key_learnings || []).map((l, i) => (
            <div key={i} className="py-3 border-b border-white/[0.06] last:border-0">
              <p className="text-[13px] text-[#fffbf4] leading-relaxed">"{l.learning}"</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] text-[#8899AA]">{l.company}</span>
                <span className="text-[11px] text-[#8899AA]">·</span>
                <span className="text-[11px] text-[#8899AA]">{l.industry}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${outcomeBadge[l.outcome] || 'bg-white/[0.06] text-[#8899AA]'}`}>
                  {l.outcome}
                </span>
              </div>
            </div>
          ))}
          {(!data.key_learnings || data.key_learnings.length === 0) && (
            <p className="text-[12px] text-[#8899AA] py-4 text-center">
              No learnings yet — upload call transcripts to build tribal knowledge
            </p>
          )}
        </div>
      </Card>

      <Card title="Objection prep by industry" icon="🛡️">
        <div className="space-y-5">
          {(data.objections_by_industry || []).map((group, gi) => (
            <div key={gi}>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[12px] font-medium text-[#c4b1f9]">{group.industry}</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
              <div className="space-y-2.5">
                {group.objections.map((o, i) => (
                  <div key={i} className="bg-white/[0.03] rounded-lg px-4 py-3 border border-white/[0.06]">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12px] text-red-400">"{o.objection}"</p>
                      <span className="text-[10px] text-[#8899AA] whitespace-nowrap mt-0.5">{o.times}x</span>
                    </div>
                    {o.counter && (
                      <p className="text-[12px] text-[#00D68F] mt-1.5">→ "{o.counter}"</p>
                    )}
                    <p className="text-[10px] text-[#8899AA] mt-1">
                      Led to SQL {o.worked}/{o.times} times
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {(!data.objections_by_industry || data.objections_by_industry.length === 0) && (
            <p className="text-[12px] text-[#8899AA] py-4 text-center">
              No objection data yet — log call outcomes to build prep cards
            </p>
          )}
        </div>
      </Card>

      <Card title="ICP by company size">
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
                  <td className="py-2 text-[#fffbf4]">{t.title}</td>
                  <td className="py-2 text-[#8899AA]">{t.company_size}</td>
                  <td className="py-2 text-right text-[#8899AA]">{t.times}</td>
                  <td className="py-2 text-right font-medium text-[#c4b1f9]">{t.sql_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Best industries">
        <div className="space-y-2">
          {(data.best_industries || []).map((ind, i) => {
            const maxTotal = (data.best_industries || [])[0]?.total || 1
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-[#8899AA] w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-[#fffbf4]">{ind.industry}</span>
                    <span className="text-[11px] text-[#8899AA]">
                      {ind.sqls} SQLs / {ind.total} calls
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(ind.total / maxTotal) * 100}%`,
                        background: ind.win_rate >= 60 ? '#c4b1f9' : ind.win_rate >= 40 ? '#ffe27c' : 'rgba(255,255,255,0.15)',
                      }}
                    />
                  </div>
                </div>
                <span className={`text-[12px] font-medium min-w-[36px] text-right ${
                  ind.win_rate >= 60 ? 'text-[#c4b1f9]' : ind.win_rate >= 40 ? 'text-[#ffe27c]' : 'text-[#8899AA]'
                }`}>
                  {ind.win_rate}%
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      <Card title="Country breakdown">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {data.countries.map((c, i) => (
            <div key={i} className="flex items-center justify-between bg-white/[0.03] rounded-lg px-4 py-3 border border-white/[0.06]">
              <div>
                <p className="text-[13px] font-medium text-[#fffbf4]">{c.country}</p>
                <p className="text-[11px] text-[#8899AA]">{c.total} calls · {c.sqls} SQLs</p>
              </div>
              <span className={`text-[13px] font-medium ${
                c.win_rate >= 60 ? 'text-[#c4b1f9]' : c.win_rate >= 40 ? 'text-[#ffe27c]' : 'text-red-400'
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
      <p className={`text-2xl font-medium mt-1 ${accent ? 'text-[#c4b1f9]' : 'text-[#fffbf4]'}`}>{value}</p>
    </div>
  )
}

function Card({ title, icon, children }) {
  return (
    <div className="bg-[#1A2D42] rounded-xl border border-white/[0.08] p-5">
      <h3 className="text-[13px] font-medium text-[#fffbf4] mb-4">
        {icon && <span className="mr-1.5">{icon}</span>}
        {title}
      </h3>
      {children}
    </div>
  )
}
