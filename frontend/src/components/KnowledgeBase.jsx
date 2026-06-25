import { useState, useEffect } from 'react'
import { api } from '../api'

const leaderboard = [
  { name: 'Maria G.', initials: 'MG', sqls: 7, bg: 'bg-[#c4b1f9]/[0.12]', text: 'text-[#c4b1f9]' },
  { name: 'Santiago R.', initials: 'SR', sqls: 6, bg: 'bg-[#ffe27c]/[0.12]', text: 'text-[#ffe27c]' },
  { name: 'Carlos R.', initials: 'CR', sqls: 5, bg: 'bg-white/[0.04]', text: 'text-[#7A7F8E]' },
  { name: 'Ana P.', initials: 'AP', sqls: 4, bg: 'bg-white/[0.04]', text: 'text-[#7A7F8E]' },
  { name: 'Diego M.', initials: 'DM', sqls: 3, bg: 'bg-white/[0.04]', text: 'text-[#7A7F8E]' },
]

const outcomeBadge = {
  SQL: 'bg-[#34D399]/[0.1] text-[#34D399]',
  Connected: 'bg-[#ffe27c]/[0.1] text-[#ffe27c]',
  Gatekeeper: 'bg-[#F87171]/[0.1] text-[#F87171]',
  'No answer': 'bg-white/[0.06] text-[#7A7F8E]',
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

  if (loading) return (
    <div className="text-center py-24">
      <div className="w-10 h-10 rounded-xl bg-[#c4b1f9]/[0.1] flex items-center justify-center mx-auto mb-3 animate-pulse">
        <i className="ti ti-brain text-[20px] text-[#c4b1f9]" />
      </div>
      <p className="text-[13px] text-[#7A7F8E]">Loading knowledge base...</p>
    </div>
  )
  if (!data) return <div className="text-center py-24 text-[#7A7F8E]">Failed to load data</div>

  const maxSqls = leaderboard[0].sqls

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-medium text-[#F0EDE6] tracking-tight">Knowledge base</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total calls" value={data.total_calls} hint="+3 this week" hintUp icon="ti-phone" />
        <StatCard label="SQLs" value={data.total_sqls} accent hint={`${data.win_rate}% win rate`} hintUp icon="ti-target" />
        <StatCard label="Win rate" value={`${data.win_rate}%`} hint="Steady" icon="ti-chart-line" />
        <StatCard label="Brief accuracy" value={`${data.brief_accuracy || '—'}%`} hint="+5% this week" hintUp icon="ti-sparkles" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card title="SQL leaderboard — this week" icon="ti-trophy">
          <div>
            {leaderboard.map((p, i) => (
              <div key={i} className="flex items-center py-2.5 border-b border-white/[0.04] last:border-0">
                <span className={`w-5 text-[13px] font-medium ${i < 2 ? 'text-[#ffe27c]' : 'text-[#555B6A]'}`}>
                  {i + 1}
                </span>
                <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-medium mr-3 ${p.bg} ${p.text}`}>
                  {p.initials}
                </div>
                <span className="flex-1 text-[13px] text-[#E8E4DC]">{p.name}</span>
                <span className="text-[16px] font-medium text-[#c4b1f9] w-7 text-right">{p.sqls}</span>
                <div className="w-14 h-1 bg-white/[0.05] rounded-full ml-3">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(p.sqls / maxSqls) * 100}%`,
                      background: i === 0 ? '#c4b1f9' : i === 1 ? '#ffe27c' : 'rgba(255,255,255,0.12)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Key learnings" icon="ti-bulb">
          <div className="space-y-0 max-h-[280px] overflow-y-auto">
            {(data.key_learnings || []).map((l, i) => (
              <div key={i} className="py-3 border-b border-white/[0.04] last:border-0">
                <p className="text-[13px] text-[#E8E4DC] leading-relaxed italic">"{l.learning}"</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-[#555B6A]">{l.company} · {l.industry}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${outcomeBadge[l.outcome] || 'bg-white/[0.06] text-[#7A7F8E]'}`}>
                    {l.outcome}
                  </span>
                </div>
              </div>
            ))}
            {(!data.key_learnings || data.key_learnings.length === 0) && (
              <p className="text-[12px] text-[#555B6A] py-6 text-center">
                Upload call transcripts to build tribal knowledge
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card title="Objection prep by industry" icon="ti-shield" full>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {(data.objections_by_industry || []).map((group, gi) => (
            <div key={gi}>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.04]">
                <i className="ti ti-building-bank text-[14px] text-[#c4b1f9]" />
                <span className="text-[12px] font-medium text-[#c4b1f9]">{group.industry}</span>
              </div>
              <div className="space-y-2">
                {group.objections.map((o, i) => (
                  <div key={i} className="bg-white/[0.02] rounded-[8px] px-4 py-3 border border-white/[0.04] hover:bg-white/[0.035] transition-colors duration-150">
                    <p className="text-[12px] text-[#F87171]">"{o.objection}"</p>
                    {o.counter && (
                      <p className="text-[12px] text-[#34D399] mt-1.5 flex items-start gap-1.5">
                        <i className="ti ti-arrow-right text-[13px] mt-0.5 flex-shrink-0" />
                        <span>{o.counter}</span>
                      </p>
                    )}
                    <p className="text-[10px] text-[#555B6A] mt-1.5">
                      Led to SQL {o.worked}/{o.times}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {(!data.objections_by_industry || data.objections_by_industry.length === 0) && (
            <p className="text-[12px] text-[#555B6A] py-6 text-center col-span-2">
              Log call outcomes to build prep cards
            </p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card title="ICP by company size" icon="ti-user-check">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[10px] text-[#555B6A] uppercase tracking-wider">
                  <th className="pb-2.5 font-medium">Title</th>
                  <th className="pb-2.5 font-medium">Size</th>
                  <th className="pb-2.5 font-medium text-right">Calls</th>
                  <th className="pb-2.5 font-medium text-right">SQLs</th>
                </tr>
              </thead>
              <tbody>
                {data.best_titles.map((t, i) => (
                  <tr key={i} className="border-t border-white/[0.04]">
                    <td className="py-2.5 text-[#E8E4DC]">{t.title}</td>
                    <td className="py-2.5 text-[#7A7F8E]">{t.company_size}</td>
                    <td className="py-2.5 text-right text-[#7A7F8E]">{t.times}</td>
                    <td className="py-2.5 text-right font-medium text-[#c4b1f9]">{t.sql_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Best industries" icon="ti-chart-bar">
          <div className="space-y-2.5">
            {(data.best_industries || []).map((ind, i) => {
              const maxTotal = (data.best_industries || [])[0]?.total || 1
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[11px] font-medium text-[#555B6A] w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px] text-[#E8E4DC]">{ind.industry}</span>
                      <span className="text-[11px] text-[#555B6A]">
                        {ind.sqls}/{ind.total}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.04] rounded-full">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(ind.total / maxTotal) * 100}%`,
                          background: ind.win_rate >= 60 ? '#c4b1f9' : ind.win_rate >= 40 ? '#ffe27c' : 'rgba(255,255,255,0.12)',
                        }}
                      />
                    </div>
                  </div>
                  <span className={`text-[12px] font-medium min-w-[36px] text-right ${
                    ind.win_rate >= 60 ? 'text-[#c4b1f9]' : ind.win_rate >= 40 ? 'text-[#ffe27c]' : 'text-[#555B6A]'
                  }`}>
                    {ind.win_rate}%
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <Card title="Country breakdown" icon="ti-world">
        <div className="grid gap-3 sm:grid-cols-2">
          {data.countries.map((c, i) => (
            <div key={i} className="flex items-center justify-between bg-white/[0.02] rounded-[10px] px-5 py-3.5 border border-white/[0.04] hover:bg-white/[0.035] transition-colors duration-150">
              <div>
                <p className="text-[13px] font-medium text-[#E8E4DC]">{c.country}</p>
                <p className="text-[11px] text-[#555B6A] mt-0.5">{c.total} calls · {c.sqls} SQLs</p>
              </div>
              <span className={`text-[14px] font-medium ${
                c.win_rate >= 60 ? 'text-[#c4b1f9]' : c.win_rate >= 40 ? 'text-[#ffe27c]' : 'text-[#F87171]'
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

function StatCard({ label, value, accent, hint, hintUp, icon }) {
  return (
    <div className="bg-[#1A1F2E] rounded-[10px] border border-white/[0.06] px-5 py-4 hover:border-white/[0.1] transition-colors duration-200">
      <p className="text-[11px] text-[#7A7F8E] uppercase tracking-wider font-medium flex items-center gap-1.5">
        <i className={`ti ${icon} text-[13px]`} /> {label}
      </p>
      <p className={`text-[28px] font-medium mt-1.5 tracking-tight ${accent ? 'text-[#c4b1f9]' : 'text-[#F0EDE6]'}`}>{value}</p>
      {hint && (
        <p className={`text-[11px] mt-1 flex items-center gap-1 ${hintUp ? 'text-[#34D399]' : 'text-[#555B6A]'}`}>
          <i className={`ti ${hintUp ? 'ti-trending-up' : 'ti-minus'} text-[13px]`} /> {hint}
        </p>
      )}
    </div>
  )
}

function Card({ title, icon, full, children }) {
  return (
    <div className={`bg-[#1A1F2E] rounded-[14px] border border-white/[0.06] p-5 hover:border-white/[0.1] transition-colors duration-200 ${full ? 'col-span-full' : ''}`}>
      <h3 className="text-[13px] font-medium text-[#F0EDE6] mb-4 flex items-center gap-2">
        <i className={`ti ${icon} text-[16px] text-[#c4b1f9]`} />
        {title}
      </h3>
      {children}
    </div>
  )
}
