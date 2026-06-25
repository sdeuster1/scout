import { useState, useRef } from 'react'
import { api } from '../api'

const outcomeOptions = ['SQL', 'Connected', 'Gatekeeper', 'No answer']

export default function UploadTranscript() {
  const [transcript, setTranscript] = useState('')
  const [outcome, setOutcome] = useState('SQL')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef()

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const text = await file.text()
    setTranscript(text)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (!transcript.trim()) return
    setLoading(true)
    try {
      const res = await fetch(api('/api/upload-transcript'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, outcome }),
      })
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch { throw new Error(text || 'Server error') }
      if (!res.ok) throw new Error(data.detail || 'Failed')
      setResult(data.extracted)
      setTranscript('')
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-lg font-medium text-white mb-5">Upload call transcript</h2>

      {!result ? (
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[#8899AA] mb-1">
              Paste transcript or upload .txt file
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={10}
              placeholder="Paste your call transcript here..."
              className="w-full rounded-lg bg-[#1A2D42] border border-white/[0.08] px-4 py-3 text-[13px] text-white placeholder-[#556677] focus:outline-none focus:ring-1 focus:ring-[#00D68F] focus:border-transparent resize-none"
            />
            <label className="inline-flex items-center gap-1.5 mt-2 text-[12px] text-[#8899AA] cursor-pointer hover:text-white">
              📎 Upload .txt file
              <input
                ref={fileRef}
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#8899AA] mb-2">
              Call outcome
            </label>
            <div className="flex gap-1.5">
              {outcomeOptions.map((o) => (
                <button
                  key={o}
                  onClick={() => setOutcome(o)}
                  className={`px-3.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                    outcome === o
                      ? 'bg-[#00D68F] text-[#0B1B2B]'
                      : 'bg-white/[0.05] text-[#8899AA] hover:bg-white/[0.1]'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!transcript.trim() || loading}
            className="w-full py-2.5 rounded-lg text-[13px] font-medium bg-[#00D68F] text-[#0B1B2B] hover:bg-[#00C282] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing transcript...
              </>
            ) : (
              'Analyze & store'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#1A2D42] rounded-xl border border-white/[0.08] p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[#00D68F] text-lg">✓</span>
              <h3 className="font-medium text-white text-[14px]">Transcript analyzed and stored</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Company" value={result.company} />
              <Field label="Country" value={result.country} />
              <Field label="Industry" value={result.industry} />
              <Field label="Size" value={result.company_size} />
              <Field label="Contact" value={result.contact_title} />
              <Field label="Outcome" value={outcome} />
            </div>
            {result.opener_used && <div className="mt-3"><Field label="Opener used" value={result.opener_used} /></div>}
            {result.objection_heard && <div className="mt-3"><Field label="Objection" value={result.objection_heard} /></div>}
            {result.counter_response && <div className="mt-3"><Field label="Counter" value={result.counter_response} /></div>}
            {result.key_learning && <div className="mt-3"><Field label="Key learning" value={result.key_learning} /></div>}
          </div>
          <button
            onClick={() => setResult(null)}
            className="w-full py-2.5 rounded-lg text-[13px] font-medium bg-white/[0.05] text-[#8899AA] hover:bg-white/[0.1] transition-colors"
          >
            Upload another transcript
          </button>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-[#8899AA] uppercase tracking-wider">{label}</p>
      <p className="text-[13px] text-white mt-0.5">{value || '—'}</p>
    </div>
  )
}
