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
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Upload Call Transcript</h2>

      {!result ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paste transcript or upload .txt file
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={10}
              placeholder="Paste your call transcript here..."
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4ade80] focus:border-transparent resize-none"
            />
            <label className="inline-flex items-center gap-1.5 mt-2 text-sm text-gray-500 cursor-pointer hover:text-gray-700">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Call outcome
            </label>
            <div className="flex gap-2">
              {outcomeOptions.map((o) => (
                <button
                  key={o}
                  onClick={() => setOutcome(o)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    outcome === o
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            className="w-full py-2.5 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
              'Analyze & Store'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[#4ade80] text-lg">✓</span>
              <h3 className="font-semibold text-gray-800">Transcript analyzed and stored</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Company" value={result.company} />
              <Field label="Country" value={result.country} />
              <Field label="Industry" value={result.industry} />
              <Field label="Size" value={result.company_size} />
              <Field label="Contact" value={result.contact_title} />
              <Field label="Outcome" value={outcome} />
            </div>
            {result.opener_used && (
              <div className="mt-4">
                <Field label="Opener used" value={result.opener_used} full />
              </div>
            )}
            {result.objection_heard && (
              <div className="mt-3">
                <Field label="Objection" value={result.objection_heard} full />
              </div>
            )}
            {result.counter_response && (
              <div className="mt-3">
                <Field label="Counter" value={result.counter_response} full />
              </div>
            )}
            {result.key_learning && (
              <div className="mt-3">
                <Field label="Key learning" value={result.key_learning} full />
              </div>
            )}
          </div>
          <button
            onClick={() => setResult(null)}
            className="w-full py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Upload another transcript
          </button>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, full }) {
  return (
    <div className={full ? '' : ''}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-800 mt-0.5">{value || '—'}</p>
    </div>
  )
}
