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
      <h2 className="text-lg font-medium text-[#fffbf4] mb-5">Quick company lookup</h2>

      <form onSubmit={handleSubmit} className="bg-[#1A2D42] rounded-xl border border-white/[0.08] p-5 mb-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[12px] font-medium text-[#8899AA] mb-1">Company name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Kavak"
              className="w-full rounded-lg bg-white/[0.05] border border-white/[0.08] px-3 py-2 text-[13px] text-[#fffbf4] placeholder-[#556677] focus:outline-none focus:ring-1 focus:ring-[#c4b1f9] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#8899AA] mb-1">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Mexico"
              className="w-full rounded-lg bg-white/[0.05] border border-white/[0.08] px-3 py-2 text-[13px] text-[#fffbf4] placeholder-[#556677] focus:outline-none focus:ring-1 focus:ring-[#c4b1f9] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#8899AA] mb-1">Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Fintech"
              className="w-full rounded-lg bg-white/[0.05] border border-white/[0.08] px-3 py-2 text-[13px] text-[#fffbf4] placeholder-[#556677] focus:outline-none focus:ring-1 focus:ring-[#c4b1f9] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#8899AA] mb-1">Company size</label>
            <input
              type="text"
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              placeholder="e.g. 201-500"
              className="w-full rounded-lg bg-white/[0.05] border border-white/[0.08] px-3 py-2 text-[13px] text-[#fffbf4] placeholder-[#556677] focus:outline-none focus:ring-1 focus:ring-[#c4b1f9] focus:border-transparent"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !companyName.trim() || !country.trim() || !industry.trim() || !companySize.trim()}
          className="mt-4 w-full py-2.5 rounded-lg text-[13px] font-medium bg-[#c4b1f9] text-[#0B1B2B] hover:bg-[#b39df7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
            'Get pre-call brief'
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
          <div className="text-center mt-5">
            <button
              onClick={() => { setBrief(null); setCompanyName(''); setCountry(''); setIndustry(''); setCompanySize('') }}
              className="text-[12px] text-[#8899AA] hover:text-[#fffbf4] underline"
            >
              Look up another company
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
