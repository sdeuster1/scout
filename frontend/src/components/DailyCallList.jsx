import { useState, useRef } from 'react'
import { api } from '../api'

const outcomes = [
  { label: 'SQL', cls: 'bg-[#34D399] text-[#0A0E1A]' },
  { label: 'Connected', cls: 'bg-[#ffe27c] text-[#0A0E1A]' },
  { label: 'Gatekeeper', cls: 'bg-[#F87171] text-white' },
  { label: 'No answer', cls: 'bg-white/[0.06] text-[#7A7F8E] border border-white/[0.06]' },
]

function ScoreBadge({ score }) {
  let cls = 'bg-[#F87171]/[0.1] text-[#F87171] border-[#F87171]/[0.12]'
  if (score >= 8) cls = 'bg-[#c4b1f9]/[0.1] text-[#c4b1f9] border-[#c4b1f9]/[0.12]'
  else if (score >= 5) cls = 'bg-[#ffe27c]/[0.1] text-[#ffe27c] border-[#ffe27c]/[0.12]'
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium border ${cls}`}>
      <i className="ti ti-chart-dots-3 text-[14px]" />
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
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-[#c4b1f9]/[0.1] flex items-center justify-center mx-auto mb-5">
            <i className="ti ti-file-upload text-[28px] text-[#c4b1f9]" />
          </div>
          <h2 className="text-lg font-medium text-[#F0EDE6] mb-2">Upload your call list</h2>
          <p className="text-[#7A7F8E] mb-8 text-[13px] max-w-sm mx-auto leading-relaxed">
            CSV with columns: company name, country, industry, company size.
            Optionally include contact name and position.
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#c4b1f9] to-[#a78bfa] text-[#0A0E1A] rounded-lg cursor-pointer hover:opacity-90 transition-opacity text-[13px] font-medium shadow-lg shadow-[#c4b1f9]/[0.15]">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating briefs...
              </span>
            ) : (
              <>
                <i className="ti ti-upload text-[15px]" />
                Choose CSV file
              </>
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
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-medium text-[#F0EDE6] tracking-tight">Call list</h1>
              <select
                value={currentIndex}
                onChange={(e) => setCurrentIndex(Number(e.target.value))}
                className="bg-[#1A1F2E] border border-white/[0.06] rounded-md px-3 py-1.5 text-[12px] text-[#E8E4DC] focus:outline-none focus:ring-1 focus:ring-[#c4b1f9]/50 cursor-pointer appearance-none pr-7"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%237A7F8E'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
              >
                {briefs.map((b, i) => (
                  <option key={i} value={i}>
                    {b.company}{outcomeGiven[b.id] ? ` ✓` : ''}
                  </option>
                ))}
              </select>
              <span className="text-[12px] text-[#7A7F8E]">{currentIndex + 1} of {briefs.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-[#7A7F8E]">{completedCount} completed</span>
              <div className="w-20 h-[3px] bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / briefs.length) * 100}%`, background: 'linear-gradient(90deg, #c4b1f9, #a78bfa)' }}
                />
              </div>
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
              className="px-5 py-2.5 rounded-lg text-[13px] font-medium bg-[#1A1F2E] border border-white/[0.06] text-[#7A7F8E] hover:bg-[#222738] hover:border-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 flex items-center gap-1.5"
            >
              <i className="ti ti-arrow-left text-[14px]" /> Previous
            </button>
            <button
              onClick={() => { if (currentIndex < briefs.length - 1) setCurrentIndex((i) => i + 1) }}
              disabled={currentIndex >= briefs.length - 1}
              className="px-5 py-2.5 rounded-lg text-[13px] font-medium bg-gradient-to-r from-[#c4b1f9] to-[#a78bfa] text-[#0A0E1A] hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 flex items-center gap-1.5 shadow-lg shadow-[#c4b1f9]/[0.1]"
            >
              Next <i className="ti ti-arrow-right text-[14px]" />
            </button>
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => { setBriefs([]); setCurrentIndex(0) }}
              className="text-[12px] text-[#555B6A] hover:text-[#E8E4DC] transition-colors"
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
    <div className="bg-[#1A1F2E] rounded-[14px] border border-white/[0.06] overflow-hidden hover:border-white/[0.1] transition-colors duration-200">
      <div className="px-6 py-5 border-b border-white/[0.06] flex items-start justify-between">
        <div>
          <h2 className="text-[18px] font-medium text-[#F0EDE6] tracking-tight">{brief.company}</h2>
          <p className="text-[12px] text-[#7A7F8E] mt-1 tracking-wide">
            {brief.country} · {brief.industry} · {brief.company_size} employees
          </p>
          {(brief.contact_name || brief.contact_position) && (
            <p className="text-[12px] text-[#c4b1f9] mt-1.5 flex items-center gap-1.5">
              <i className="ti ti-user text-[13px]" />
              {brief.contact_name}{brief.contact_name && brief.contact_position ? ' — ' : ''}{brief.contact_position}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ScoreBadge score={brief.icp_score} />
          {outcomeGiven?.[brief.id] && (
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
              outcomes.find(o => o.label === outcomeGiven[brief.id])?.cls || ''
            }`}>
              {outcomeGiven[brief.id]}
            </span>
          )}
        </div>
      </div>

      <div className="px-6 py-5">
        <p className="text-[13px] text-[#7A7F8E] leading-relaxed mb-4">{brief.icp_reason}</p>
        <div className="grid gap-3 sm:grid-cols-2 mb-4">
          <Section label="ICP" icon="ti-user-check" labelCls="text-[#c4b1f9]" primary={brief.who_to_ask} secondary={brief.who_reason} bold />
          <Section label="Lead with" icon="ti-bulb" labelCls="text-[#ffe27c]" bulletColor="#ffe27c" primary={brief.lead_with} />
          <Section label="Expect" icon="ti-alert-triangle" labelCls="text-[#F87171]" primary={brief.expect_objection} />
          <Section label="Counter" icon="ti-shield-check" labelCls="text-[#34D399]" primary={brief.counter} />
        </div>
        <div className="bg-[#c4b1f9]/[0.06] rounded-[10px] px-5 py-3.5 border border-[#c4b1f9]/[0.08]">
          <div className="text-[10px] font-medium text-[#c4b1f9] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <i className="ti ti-target text-[13px]" /> Call goal
          </div>
          <p className="text-[13px] text-[#F0EDE6] font-medium leading-relaxed">{brief.call_goal}</p>
        </div>
      </div>

      {logOutcome && logFeedback && (
        <div className="px-6 py-4 border-t border-white/[0.06]">
          {!outcomeGiven?.[brief.id] && (
            <div>
              <p className="text-[10px] font-medium text-[#7A7F8E] uppercase tracking-widest mb-3">Log outcome</p>
              <div className="flex gap-2 flex-wrap">
                {outcomes.map((o) => (
                  <button
                    key={o.label}
                    onClick={() => logOutcome(o.label)}
                    className={`px-4 py-2 rounded-md text-[12px] font-medium transition-all duration-150 hover:translate-y-[-1px] ${o.cls}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {outcomeGiven?.[brief.id] && feedbackGiven?.[brief.id] === undefined && (
            <div>
              <p className="text-[10px] font-medium text-[#7A7F8E] uppercase tracking-widest mb-3">Was this brief useful?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => logFeedback(true)}
                  className="px-4 py-2 rounded-md text-[12px] font-medium bg-[#c4b1f9]/[0.1] text-[#c4b1f9] hover:bg-[#c4b1f9]/[0.18] transition-colors"
                >
                  <i className="ti ti-thumb-up text-[13px] mr-1" /> Useful
                </button>
                <button
                  onClick={() => logFeedback(false)}
                  className="px-4 py-2 rounded-md text-[12px] font-medium bg-[#F87171]/[0.1] text-[#F87171] hover:bg-[#F87171]/[0.18] transition-colors"
                >
                  <i className="ti ti-thumb-down text-[13px] mr-1" /> Not useful
                </button>
              </div>
            </div>
          )}

          {feedbackGiven?.[brief.id] !== undefined && (
            <p className="text-[12px] text-[#555B6A] flex items-center gap-1.5">
              <i className="ti ti-check text-[14px] text-[#34D399]" />
              Feedback recorded — {feedbackGiven[brief.id] ? 'marked useful' : 'marked not useful'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ label, icon, labelCls, bulletColor, primary, secondary, bold }) {
  const text = typeof primary === 'string' ? primary : ''
  const hasBullets = text.includes('•') || text.includes('\n')
  const items = hasBullets
    ? text.split(/[•\n]/).map(s => s.trim()).filter(Boolean)
    : []

  return (
    <div className="bg-white/[0.02] rounded-[10px] px-5 py-4 border border-white/[0.06] hover:bg-white/[0.035] transition-colors duration-150">
      <div className={`text-[10px] font-medium uppercase tracking-widest mb-2.5 flex items-center gap-1.5 ${labelCls || 'text-[#7A7F8E]'}`}>
        <i className={`ti ${icon} text-[14px]`} /> {label}
      </div>
      {items.length > 1 ? (
        <ul className="text-[13px] text-[#E8E4DC] space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="w-[5px] h-[5px] rounded-full mt-[7px] flex-shrink-0" style={{ background: bulletColor || '#c4b1f9' }} />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={`text-[13px] text-[#E8E4DC] leading-relaxed ${bold ? 'font-medium' : ''}`}>{primary}</p>
      )}
      {secondary && <p className="text-[11px] text-[#555B6A] mt-1.5">{secondary}</p>}
    </div>
  )
}
