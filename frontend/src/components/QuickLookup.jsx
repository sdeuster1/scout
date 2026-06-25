import { useState } from 'react'
import { api } from '../api'
import { BriefCard } from './DailyCallList'

export default function QuickLookup() {
  const [companyName, setCompanyName] = useState('')
  const [country, setCountry] = useState('')
  const [industry, setIndustry] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [loading, setLoading] = useState(false)
  const [brief, setBrief] = useState(null)
  const [outcomeGiven, setOutcomeGiven] = useState({})
  const [feedbackGiven, setFeedbackGiven] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!companyName.trim() || !country.trim() || !industry.trim() || !companySize.trim()) return
    setLoading(true)
    setBrief(null)

    const csv = `company name,country,industry,company size\n${companyName},${country},${industry},${companySize}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const form = new FormData()
    form.append('file', blob, 'quick.csv')

    try {
      const res = await fetch(api('/api/generate-briefs'), { method: 'POST', body: form })
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch { throw new Error(text || 'Server error') }
      if (!res.ok) throw new Error(data.detail || 'Failed')
      if (data.briefs?.length > 0) setBrief(data.briefs[0])
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const logOutcome = async (outcome) => {
    if (!brief || outcomeGiven[brief.id]) return
    try {
      await fetch(api('/api/log-outcome'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief_id: brief.id, outcome }),
      })
      setOutcomeGiven((p) => ({ ...p, [brief.id]: outcome }))
    } catch {}
  }

  const logFeedback = async (useful) => {
    if (!brief || feedbackGiven[brief.id] !== undefined) return
    try {
      await fetch(api('/api/log-feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief_id: brief.id, useful }),
      })
      setFeedbackGiven((p) => ({ ...p, [brief.id]: useful }))
    } catch {}
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-medium text-[#F0EDE6] tracking-tight mb-6">Quick company lookup</h1>

      <form onSubmit={handleSubmit} className="bg-[#1A1F2E] rounded-[14px] border border-white/[0.06] p-6 mb-6 hover:border-white/[0.1] transition-colors duration-200">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name" placeholder="e.g. Kavak" value={companyName} onChange={setCompanyName} icon="ti-building" />
          <Field label="Country" placeholder="e.g. Mexico" value={country} onChange={setCountry} icon="ti-map-pin" />
          <Field label="Industry" placeholder="e.g. Fintech" value={industry} onChange={setIndustry} icon="ti-category" />
          <Field label="Company size" placeholder="e.g. 201-500" value={companySize} onChange={setCompanySize} icon="ti-users" />
        </div>
        <button
          type="submit"
          disabled={loading || !companyName.trim() || !country.trim() || !industry.trim() || !companySize.trim()}
          className="mt-5 w-full py-3 rounded-lg text-[13px] font-medium bg-gradient-to-r from-[#c4b1f9] to-[#a78bfa] text-[#0A0E1A] hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-[#c4b1f9]/[0.1]"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating brief...
            </>
          ) : (
            <>
              <i className="ti ti-sparkles text-[15px]" />
              Get pre-call brief
            </>
          )}
        </button>
      </form>

      {brief && (
        <div>
          <BriefCard
            brief={brief}
            outcomeGiven={outcomeGiven}
            feedbackGiven={feedbackGiven}
            logOutcome={logOutcome}
            logFeedback={logFeedback}
          />
          <div className="text-center mt-6">
            <button
              onClick={() => { setBrief(null); setCompanyName(''); setCountry(''); setIndustry(''); setCompanySize('') }}
              className="text-[12px] text-[#555B6A] hover:text-[#E8E4DC] transition-colors"
            >
              Look up another company
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, placeholder, value, onChange, icon }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[#7A7F8E] uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <i className={`ti ${icon} absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#555B6A]`} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] pl-9 pr-3 py-2.5 text-[13px] text-[#E8E4DC] placeholder-[#555B6A] focus:outline-none focus:ring-1 focus:ring-[#c4b1f9]/50 focus:border-[#c4b1f9]/30 transition-all duration-150"
        />
      </div>
    </div>
  )
}
