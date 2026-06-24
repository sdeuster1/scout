import { useState, useRef } from 'react'
import { api } from '../api'

const outcomes = [
  { label: 'SQL', color: 'bg-[#4ade80] text-black' },
  { label: 'Connected', color: 'bg-amber-400 text-black' },
  { label: 'Gatekeeper', color: 'bg-red-400 text-white' },
  { label: 'No answer', color: 'bg-gray-300 text-gray-700' },
]

function ScoreBadge({ score }) {
  let color = 'bg-red-100 text-red-700'
  if (score >= 8) color = 'bg-green-100 text-green-700'
  else if (score >= 5) color = 'bg-amber-100 text-amber-700'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${color}`}>
      {score}/10
    </span>
  )
}

export default function DailyCallList({
  briefs, setBriefs, currentIndex, setCurrentIndex,
  completedCount, setCompletedCount, feedbackGiven, setFeedbackGiven,
  outcomeGiven, setOutcomeGiven,
}) {
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch(api('/api/generate-briefs'), { method: 'POST', body: form })
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch { throw new Error(text || 'Server error') }
      if (!res.ok) throw new Error(data.detail || 'Upload failed')
      setBriefs(data.briefs)
      setCurrentIndex(0)
      setCompletedCount(0)
      setFeedbackGiven({})
      setOutcomeGiven({})
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const logOutcome = async (outcome) => {
    const brief = briefs[currentIndex]
    if (outcomeGiven[brief.id]) return
    try {
      await fetch(api('/api/log-outcome'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief_id: brief.id, outcome }),
      })
      setOutcomeGiven((p) => ({ ...p, [brief.id]: outcome }))
      setCompletedCount((c) => c + 1)
    } catch {}
  }

  const logFeedback = async (useful) => {
    const brief = briefs[currentIndex]
    if (feedbackGiven[brief.id] !== undefined) return
    try {
      await fetch(api('/api/log-feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief_id: brief.id, useful }),
      })
      setFeedbackGiven((p) => ({ ...p, [brief.id]: useful }))
    } catch {}
  }

  const brief = briefs[currentIndex]

  return (
    <div>
      {briefs.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Upload your call list</h2>
          <p className="text-gray-500 mb-6 text-sm">
            CSV with columns: company name, country, industry, company size
          </p>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating briefs...
              </span>
            ) : (
              'Choose CSV file'
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleUpload}
              className="hidden"
              disabled={loading}
            />
          </label>
        </div>
      )}

      {briefs.length > 0 && brief && (
        <div>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">
                Company {currentIndex + 1} of {briefs.length}
              </span>
              <span className="text-sm text-gray-500">
                {completedCount} calls completed
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4ade80] transition-all duration-300 rounded-full"
                style={{ width: `${(completedCount / briefs.length) * 100}%` }}
              />
            </div>
          </div>

          <BriefCard
            brief={brief}
            outcomeGiven={outcomeGiven}
            feedbackGiven={feedbackGiven}
            logOutcome={logOutcome}
            logFeedback={logFeedback}
          />

          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="px-6 py-2.5 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={() => {
                if (currentIndex < briefs.length - 1) setCurrentIndex((i) => i + 1)
              }}
              disabled={currentIndex >= briefs.length - 1}
              className="px-6 py-2.5 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => { setBriefs([]); setCurrentIndex(0) }}
              className="text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Upload new call list
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function BriefCard({ brief, outcomeGiven, feedbackGiven, logOutcome, logFeedback }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{brief.company}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {brief.country} · {brief.industry} · {brief.company_size} employees
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ScoreBadge score={brief.icp_score} />
          {outcomeGiven?.[brief.id] && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              outcomes.find(o => o.label === outcomeGiven[brief.id])?.color || ''
            }`}>
              {outcomeGiven[brief.id]}
            </span>
          )}
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        <p className="text-sm text-gray-500">{brief.icp_reason}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Section icon="👤" label="ICP" primary={brief.who_to_ask} secondary={brief.who_reason} />
          <Section icon="🎯" label="LEAD WITH" primary={brief.lead_with} />
          <Section icon="⚡" label="EXPECT" primary={brief.expect_objection} />
          <Section icon="💬" label="COUNTER" primary={brief.counter} />
        </div>
        <div className="bg-gray-50 rounded-lg px-4 py-3">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Call Goal</div>
          <p className="text-sm text-gray-800 font-medium">{brief.call_goal}</p>
        </div>
      </div>

      {logOutcome && logFeedback && (
        <div className="px-6 py-4 border-t border-gray-100 space-y-3">
          {!outcomeGiven?.[brief.id] && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Log outcome</p>
              <div className="flex gap-2 flex-wrap">
                {outcomes.map((o) => (
                  <button
                    key={o.label}
                    onClick={() => logOutcome(o.label)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${o.color} hover:opacity-80`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {outcomeGiven?.[brief.id] && feedbackGiven?.[brief.id] === undefined && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Was this brief useful?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => logFeedback(true)}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                >
                  👍 Useful
                </button>
                <button
                  onClick={() => logFeedback(false)}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                >
                  👎 Not useful
                </button>
              </div>
            </div>
          )}

          {feedbackGiven?.[brief.id] !== undefined && (
            <p className="text-sm text-gray-400">
              Feedback recorded — {feedbackGiven[brief.id] ? 'marked useful' : 'marked not useful'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ icon, label, primary, secondary }) {
  const hasBullets = typeof primary === 'string' && primary.includes('•')
  return (
    <div className="bg-gray-50 rounded-lg px-4 py-3">
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
        {icon} {label}
      </div>
      {hasBullets ? (
        <ul className="text-sm text-gray-800 space-y-0.5">
          {primary.split('•').filter(s => s.trim()).map((item, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="text-[#4ade80] mt-0.5">•</span>
              <span>{item.trim()}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-800">{primary}</p>
      )}
      {secondary && <p className="text-xs text-gray-500 mt-1">{secondary}</p>}
    </div>
  )
}
