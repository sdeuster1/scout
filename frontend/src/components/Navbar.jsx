const tabs = [
  { id: 'calls', label: 'Daily Call List' },
  { id: 'quick', label: 'Quick Lookup' },
  { id: 'transcript', label: 'Upload Transcript' },
  { id: 'knowledge', label: 'Knowledge Base' },
]

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <nav className="bg-black text-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80]" />
              <span className="text-lg font-semibold tracking-tight">Scout</span>
            </div>
            <span className="text-xs text-gray-400 hidden sm:inline">
              pre-call intelligence for LATAM SDRs
            </span>
          </div>
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white/15 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
