import { useState, useRef } from 'react'
import { api } from '../api'

const outcomes = [
  { label: 'SQL', color: 'bg-[#00D68F] text-[#0B1B2B]' },
  { label: 'Connected', color: 'bg-[#ffe27c] text-[#0B1B2B]' },
  { label: 'Gatekeeper', color: 'bg-red-400 text-white' },
  { label: 'No answer', color: 'bg-white/[0.1] text-[#8899AA]' },
]

function ScoreBadge({ score }) {
  let color = 'bg-red-400/15 text-red-400'
  if (score >= 8) color = 'bg-[#c4b1f9]/15 text-[#c4b1f9]'
  else if (score >= 5) color = 'bg-[#ffe27c]/15 text-[#ffe27c]'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold ${color}`}>
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
          <h2 className="text-lg font-medium text-[#fffbf4] mb-2">Upload your call list</h2>
          <p className="text-[#8899AA] mb-6 text-[13px]">
            CSV with columns: company name, country, industry, company size
          </p>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c4b1f9] text-[#0B1B2B] rounded-lg cursor-pointer hover:bg-[#b39df7] transition-colors text-[13px] font-medium">
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
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[12px] text-[#8899AA]">
                Company {currentIndex + 1} of {briefs.length}
              </span>
              <span className="text-[12px] text-[#8899AA]">
                {completedCount} calls completed
              </span>
            </div>
            <div className="w-full h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#c4b1f9] transition-all duration-300 rounded-full"
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

          <div className="flex justify-between items-center mt-5">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="px-5 py-2 rounded-lg text-[12px] font-medium bg-[#1A2D42] border border-white/[0.08] text-[#8899AA] hover:bg-[#223548] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={() => {
                if (currentIndex < briefs.length - 1) setCurrentIndex((i) => i + 1)
              }}
              disabled={currentIndex >= briefs.length - 1}
              className="px-5 py-2 rounded-lg text-[12px] font-medium bg-[#c4b1f9] text-[#0B1B2B] hover:bg-[#b39df7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => { setBriefs([]); setCurrentIndex(0) }}
              className="text-[12px] text-[#8899AA] hover:text-[#fffbf4] underline"
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
    <div className="bg-[#1A2D42] rounded-xl border border-white/[0.08] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.08] flex items-start justify-between">
        <div>
          <h2 className="text-[17px] font-medium text-[#fffbf4]">{brief.company}</h2>
          <p className="text-[12px] text-[#8899AA] mt-0.5">
            {brief.country} · {brief.industry} · {brief.company_size} employees
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ScoreBadge score={brief.icp_score} />
          {outcomeGiven?.[brief.id] && (
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
              outcomes.find(o => o.label === outcomeGiven[brief.id])?.color || ''
            }`}>
              {outcomeGiven[brief.id]}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        <p className="text-[12px] text-[#8899AA]">{brief.icp_reason}</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Section label="ICP" labelColor="text-[#c4b1f9]" primary={brief.who_to_ask} secondary={brief.who_reason} />
          <Section label="Lead with" labelColor="text-[#ffe27c]" bulletColor="text-[#ffe27c]" primary={brief.lead_with} />
          <Section label="Expect" labelColor="text-red-400" primary={brief.expect_objection} />
          <Section label="Counter" labelColor="text-[#00D68F]" primary={brief.counter} />
        </div>
        <div className="bg-[#c4b1f9]/[0.08] rounded-lg px-4 py-3 border border-[#c4b1f9]/[0.15]">
          <div className="text-[10px] font-medium text-[#c4b1f9] uppercase tracking-wider mb-1">
            Call goal
          </div>
          <p className="text-[12px] text-[#fffbf4] font-medium">{brief.call_goal}</p>
        </div>
      </div>

      {logOutcome && logFeedback && (
        <div className="px-5 py-3 border-t border-white/[0.08] space-y-3">
          {!outcomeGiven?.[brief.id] && (
            <div>
              <p className="text-[10px] font-medium text-[#8899AA] uppercase tracking-wider mb-2">Log outcome</p>
              <div className="flex gap-1.5 flex-wrap">
                {outcomes.map((o) => (
                  <button
                    key={o.label}
                    onClick={() => logOutcome(o.label)}
                    className={`px-3.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ${o.color} hover:opacity-80`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {outcomeGiven?.[brief.id] && feedbackGiven?.[brief.id] === undefined && (
            <div>
              <p className="text-[10px] font-medium text-[#8899AA] uppercase tracking-wider mb-2">Was this brief useful?</p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => logFeedback(true)}
                  className="px-3.5 py-1.5 rounded-md text-[12px] font-medium bg-[#c4b1f9]/15 text-[#c4b1f9] hover:bg-[#c4b1f9]/25 transition-colors"
                >
                  👍 Useful
                </button>
                <button
                  onClick={() => logFeedback(false)}
                  className="px-3.5 py-1.5 rounded-md text-[12px] font-medium bg-red-400/15 text-red-400 hover:bg-red-400/25 transition-colors"
                >
                  👎 Not useful
                </button>
              </div>
            </div>
          )}

          {feedbackGiven?.[brief.id] !== undefined && (
            <p className="text-[12px] text-[#8899AA]">
              Feedback recorded — {feedbackGiven[brief.id] ? 'marked useful' : 'marked not useful'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ label, labelColor, bulletColor, primary, secondary }) {
  const hasBullets = typeof primary === 'string' && primary.includes('•')
  const bColor = bulletColor || 'text-[#c4b1f9]'
  return (
    <div className="bg-white/[0.03] rounded-lg px-4 py-3 border border-white/[0.08]">
      <div className={`text-[10px] font-medium uppercase tracking-wider mb-1.5 ${labelColor || 'text-[#8899AA]'}`}>
        {label}
      </div>
      {hasBullets ? (
        <ul className="text-[12px] text-[#fffbf4] space-y-0.5">
          {primary.split('•').filter(s => s.trim()).map((item, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className={`${bColor} mt-0.5`}>•</span>
              <span>{item.trim()}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-[#fffbf4] leading-relaxed">{primary}</p>
      )}
      {secondary && <p className="text-[11px] text-[#8899AA] mt-1">{secondary}</p>}
    </div>
  )
}
