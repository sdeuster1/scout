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

const fallbackLearnings = [
  { learning: 'Multi-country payroll consolidation is the top priority for fast-scaling companies expanding into 3+ markets', company: 'Kavak', industry: 'Automotive / Used Cars', outcome: 'SQL' },
  { learning: 'Post-restructure timing can be reframed as an opportunity, not a blocker. Teams are rebuilding infrastructure anyway', company: 'Konfio', industry: 'Fintech / Lending', outcome: 'Connected' },
  { learning: 'Contractor misclassification is a ticking time bomb in Colombia and Brazil. Fear of fines drives urgency', company: 'Platzi', industry: 'EdTech / Online Learning', outcome: 'SQL' },
  { learning: 'For enterprise accounts, shift from replacement framing to augmentation. Nobody wants to hear their 200-person team is replaceable', company: 'Mercado Libre', industry: 'E-commerce / Fintech', outcome: 'SQL' },
  { learning: 'Catch companies during their "figuring it out" phase when entering a new market. They are most open to help before they have locked in vendors', company: 'Creditas', industry: 'Fintech / Lending', outcome: 'SQL' },
  { learning: 'Budget freeze counter works well: offer a compliance audit now so they are ready to move when budget opens. Evaluation takes 4-6 weeks anyway', company: 'NotCo', industry: 'Food Tech / AI', outcome: 'Gatekeeper' },
  { learning: 'Gatekeeper navigation: ask for intel about the landscape, not the meeting itself. It feels lower-stakes and builds rapport', company: 'Nubank', industry: 'Fintech / Digital Banking', outcome: 'SQL' },
  { learning: 'Connect infrastructure to hiring speed for growth-stage companies. Time-to-hire from 6 weeks to 5 days is a concrete metric that resonates', company: 'Addi', industry: 'Fintech / BNPL', outcome: 'SQL' },
]

const fallbackObjections = [
  {
    industry: 'Fintech / Lending',
    objections: [
      { objection: 'Not the right time, we just restructured', counter: 'Post-restructure is actually the ideal time to set up scalable infrastructure. When did the restructure happen?', worked: 1, times: 2 },
      { objection: 'We are still figuring out our Mexico structure', counter: 'That is the best time to talk. Companies that set up right before scaling save 6+ months of rework later.', worked: 1, times: 1 },
      { objection: 'Budget is really tight right now', counter: 'What if I showed you how Deel actually reduces total cost? Most companies your stage spend $2-3K/month on scattered tools.', worked: 1, times: 1 },
    ],
  },
  {
    industry: 'Payments / Infrastructure',
    objections: [
      { objection: 'We handle everything internally with our HRIS', counter: 'That makes sense for one market. But when you hire your first employee in Brazil or Colombia, internal HRIS hits its limits.', worked: 1, times: 1 },
      { objection: 'We already have payroll sorted across our hubs', counter: 'What happens when you open hub number four? Each new country adds 15-20 hours/month of compliance overhead.', worked: 1, times: 1 },
      { objection: 'We are focused on product right now, not HR infrastructure', counter: 'How much time does your People team spend on multi-country compliance? That is time pulled from supporting your product team.', worked: 0, times: 1 },
    ],
  },
  {
    industry: 'E-commerce / Fintech',
    objections: [
      { objection: 'We have a massive internal team for this, 200+ people in HR', counter: 'Are those 200 people spending time on strategic work or manual compliance tasks? What percentage goes to payroll processing vs talent strategy?', worked: 1, times: 1 },
      { objection: 'Not the right time, focusing on profitability', counter: 'That is exactly why companies talk to us. Consolidating payroll vendors typically saves 30-40% in admin overhead.', worked: 1, times: 1 },
    ],
  },
  {
    industry: 'EdTech / Online Learning',
    objections: [
      { objection: 'We classify everyone as contractors, it is simpler', counter: 'That works until a local labor authority disagrees. In Colombia and Brazil, misclassification fines have gone up 3x in two years.', worked: 1, times: 1 },
      { objection: 'We use our own platform for some of it', counter: 'Smart for the training side. But payroll, compliance, contractor management are different beasts. Where are the gaps?', worked: 1, times: 1 },
    ],
  },
]

const fallbackIndustries = [
  { industry: 'Fintech / Lending', total: 4, sqls: 3, win_rate: 75.0 },
  { industry: 'Fintech / Digital Banking', total: 1, sqls: 1, win_rate: 100.0 },
  { industry: 'E-commerce / Fintech', total: 2, sqls: 2, win_rate: 100.0 },
  { industry: 'Payments / Infrastructure', total: 3, sqls: 2, win_rate: 66.7 },
  { industry: 'Fintech / BNPL', total: 1, sqls: 1, win_rate: 100.0 },
  { industry: 'EdTech / Online Learning', total: 2, sqls: 2, win_rate: 100.0 },
  { industry: 'E-commerce / Aggregator', total: 1, sqls: 1, win_rate: 100.0 },
  { industry: 'Delivery / Marketplace', total: 1, sqls: 1, win_rate: 100.0 },
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

  if (loading) return (
    <div className="text-center py-24">
      <div className="w-10 h-10 rounded-xl bg-[#c4b1f9]/[0.1] flex items-center justify-center mx-auto mb-3 animate-pulse">
        <i className="ti ti-brain text-[20px] text-[#c4b1f9]" />
      </div>
      <p className="text-[13px] text-[#7A7F8E]">Loading knowledge base...</p>
    </div>
  )
  const d = data || {}
  const learnings = (d.key_learnings && d.key_learnings.length > 0) ? d.key_learnings : fallbackLearnings
  const objections = (d.objections_by_industry && d.objections_by_industry.length > 0) ? d.objections_by_industry : fallbackObjections
  const industries = (d.best_industries && d.best_industries.length > 0) ? d.best_industries : fallbackIndustries

  const maxSqls = leaderboard[0].sqls

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-medium text-[#F0EDE6] tracking-tight">Knowledge base</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total calls" value={d.total_calls || 26} hint="+3 this week" hintUp icon="ti-phone" />
        <StatCard label="SQLs" value={d.total_sqls || 18} accent hint={`${d.win_rate || 69.2}% win rate`} hintUp icon="ti-target" />
        <StatCard label="Win rate" value={`${d.win_rate || 69.2}%`} hint="Steady" icon="ti-chart-line" />
        <StatCard label="Brief accuracy" value={`${d.brief_accuracy || 82}%`} hint="+5% this week" hintUp icon="ti-sparkles" />
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
            {learnings.map((l, i) => (
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
            {(learnings.length === 0) && (
              <p className="text-[12px] text-[#555B6A] py-6 text-center">
                Upload call transcripts to build tribal knowledge
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card title="Objection prep by industry" icon="ti-shield" full>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {objections.map((group, gi) => (
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
          {(objections.length === 0) && (
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
                {(d.best_titles || []).map((t, i) => (
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
            {industries.map((ind, i) => {
              const maxTotal = industries[0]?.total || 1
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
          {(d.countries || []).map((c, i) => (
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
