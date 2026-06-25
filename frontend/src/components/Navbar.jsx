const tabs = [
  { id: 'calls', label: 'Daily call list' },
  { id: 'quick', label: 'Quick lookup' },
  { id: 'transcript', label: 'Upload transcript' },
  { id: 'knowledge', label: 'Knowledge base' },
]

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <nav className="bg-[#132337] border-b border-white/[0.08]">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#c4b1f9]" />
              <span className="text-[15px] font-semibold tracking-tight text-[#fffbf4]">Scout</span>
            </div>
            <span className="text-[11px] text-[#8899AA] hidden sm:inline">
              pre-call intelligence for LATAM SDRs
            </span>
          </div>
          <div className="flex gap-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-[12px] transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#c4b1f9]/[0.12] text-[#c4b1f9]'
                    : 'text-[#8899AA] hover:text-[#fffbf4] hover:bg-white/[0.05]'
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
