import { useState, useEffect } from 'react'
import { api } from '../api'

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

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">Loading knowledge base...</div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-400">Failed to load data</div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Knowledge Base</h2>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Calls" value={data.total_calls} />
        <StatCard label="SQLs" value={data.total_sqls} color="text-[#4ade80]" />
        <StatCard label="Win Rate" value={`${data.win_rate}%`} />
        <StatCard label="Brief Accuracy" value={`${data.brief_accuracy || '—'}%`} />
      </div>

      {/* Top openers */}
      <Card title="Top Performing Openers">
        <div className="space-y-3">
          {data.top_openers.map((o, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-xs font-medium text-gray-400 mt-0.5 w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{o.opener}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {o.sql_count} SQLs from {o.uses} uses
                </p>
              </div>
              <WinBadge wins={o.sql_count} total={o.uses} />
            </div>
          ))}
        </div>
      </Card>

      {/* Objections */}
      <Card title="Most Common Objections & Best Counters">
        <div className="space-y-4">
          {data.top_objections.map((o, i) => (
            <div key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-red-600">"{o.objection}"</p>
                <span className="text-xs text-gray-400 whitespace-nowrap">{o.times}x heard</span>
              </div>
              {o.counter && (
                <p className="text-sm text-[#4ade80] mt-1">→ "{o.counter}"</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">
                Led to SQL {o.worked} of {o.times} times
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Best titles */}
      <Card title="Best Contact Titles by Company Size">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                <th className="pb-2 font-medium">Title</th>
                <th className="pb-2 font-medium">Company Size</th>
                <th className="pb-2 font-medium text-right">Calls</th>
                <th className="pb-2 font-medium text-right">SQLs</th>
              </tr>
            </thead>
            <tbody>
              {data.best_titles.map((t, i) => (
                <tr key={i} className="border-t border-gray-50">
                  <td className="py-2 text-gray-800">{t.title}</td>
                  <td className="py-2 text-gray-500">{t.company_size}</td>
                  <td className="py-2 text-right text-gray-500">{t.times}</td>
                  <td className="py-2 text-right font-medium text-[#4ade80]">{t.sql_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Country breakdown */}
      <Card title="Country Breakdown">
        <div className="grid gap-3 sm:grid-cols-2">
          {data.countries.map((c, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{c.country}</p>
                <p className="text-xs text-gray-400">{c.total} calls · {c.sqls} SQLs</p>
              </div>
              <span className={`text-sm font-semibold ${
                c.win_rate >= 60 ? 'text-[#4ade80]' : c.win_rate >= 40 ? 'text-amber-500' : 'text-red-400'
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

function StatCard({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function WinBadge({ wins, total }) {
  const rate = total > 0 ? Math.round((wins / total) * 100) : 0
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
      rate >= 60 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
    }`}>
      {rate}%
    </span>
  )
}
