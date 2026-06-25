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
      <h1 className="text-xl font-medium text-[#F0EDE6] tracking-tight mb-6">Upload call transcript</h1>

      {!result ? (
        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-medium text-[#7A7F8E] uppercase tracking-wider mb-2">
              Paste transcript or upload .txt file
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={10}
              placeholder="Paste your call transcript here..."
              className="w-full rounded-[10px] bg-[#1A1F2E] border border-white/[0.06] px-5 py-4 text-[13px] text-[#E8E4DC] placeholder-[#555B6A] focus:outline-none focus:ring-1 focus:ring-[#c4b1f9]/50 focus:border-[#c4b1f9]/30 resize-none leading-relaxed transition-all duration-150"
            />
            <label className="inline-flex items-center gap-2 mt-2 text-[12px] text-[#555B6A] cursor-pointer hover:text-[#E8E4DC] transition-colors">
              <i className="ti ti-paperclip text-[14px]" /> Upload .txt file
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
            <label className="block text-[11px] font-medium text-[#7A7F8E] uppercase tracking-wider mb-2.5">
              Call outcome
            </label>
            <div className="flex gap-2">
              {outcomeOptions.map((o) => (
                <button
                  key={o}
                  onClick={() => setOutcome(o)}
                  className={`px-4 py-2 rounded-md text-[12px] font-medium transition-all duration-150 ${
                    outcome === o
                      ? 'bg-[#c4b1f9] text-[#0A0E1A]'
                      : 'bg-white/[0.04] text-[#7A7F8E] border border-white/[0.06] hover:bg-white/[0.08]'
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
            className="w-full py-3 rounded-lg text-[13px] font-medium bg-gradient-to-r from-[#c4b1f9] to-[#a78bfa] text-[#0A0E1A] hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-[#c4b1f9]/[0.1]"
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
              <>
                <i className="ti ti-brain text-[15px]" />
                Analyze & store
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="bg-[#1A1F2E] rounded-[14px] border border-white/[0.06] p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#34D399]/[0.1] flex items-center justify-center">
                <i className="ti ti-check text-[16px] text-[#34D399]" />
              </div>
              <h3 className="font-medium text-[#F0EDE6] text-[14px]">Transcript analyzed and stored</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <DataField label="Company" value={result.company} icon="ti-building" />
              <DataField label="Country" value={result.country} icon="ti-map-pin" />
              <DataField label="Industry" value={result.industry} icon="ti-category" />
              <DataField label="Size" value={result.company_size} icon="ti-users" />
              <DataField label="Contact" value={result.contact_title} icon="ti-user" />
              <DataField label="Outcome" value={outcome} icon="ti-target" />
            </div>
            {result.opener_used && <div className="mt-4"><DataField label="Opener used" value={result.opener_used} icon="ti-message" /></div>}
            {result.objection_heard && <div className="mt-4"><DataField label="Objection" value={result.objection_heard} icon="ti-alert-triangle" /></div>}
            {result.counter_response && <div className="mt-4"><DataField label="Counter" value={result.counter_response} icon="ti-shield-check" /></div>}
            {result.key_learning && <div className="mt-4"><DataField label="Key learning" value={result.key_learning} icon="ti-bulb" /></div>}
          </div>
          <button
            onClick={() => setResult(null)}
            className="w-full py-3 rounded-lg text-[13px] font-medium bg-white/[0.04] border border-white/[0.06] text-[#7A7F8E] hover:bg-white/[0.08] hover:border-white/[0.1] transition-all duration-150"
          >
            Upload another transcript
          </button>
        </div>
      )}
    </div>
  )
}

function DataField({ label, value, icon }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-[#555B6A] uppercase tracking-widest flex items-center gap-1.5 mb-1">
        <i className={`ti ${icon} text-[12px]`} /> {label}
      </p>
      <p className="text-[13px] text-[#E8E4DC]">{value || '—'}</p>
    </div>
  )
}
