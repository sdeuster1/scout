const tabs = [
  { id: 'calls', label: 'Daily call list', icon: 'ti-list-check' },
  { id: 'quick', label: 'Quick lookup', icon: 'ti-search' },
  { id: 'transcript', label: 'Upload transcript', icon: 'ti-file-text' },
  { id: 'knowledge', label: 'Knowledge base', icon: 'ti-brain' },
]

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <nav className="bg-[#111827] border-b border-white/[0.06]">
      <div className="max-w-5xl mx-auto px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#c4b1f9] to-[#9b7ff0] flex items-center justify-center">
              <i className="ti ti-target-arrow text-[#0A0E1A] text-[14px]" />
            </div>
            <span className="text-[15px] font-medium tracking-tight text-[#F0EDE6]">Scout</span>
            <span className="text-[11px] text-[#7A7F8E] border-l border-white/[0.08] pl-3.5 ml-0.5 hidden sm:inline">
              Pre-call intelligence
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5 mr-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-md text-[12px] transition-all duration-150 flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-[#c4b1f9]/[0.1] text-[#c4b1f9] font-medium'
                      : 'text-[#7A7F8E] hover:text-[#E8E4DC] hover:bg-white/[0.04]'
                  }`}
                >
                  <i className={`ti ${tab.icon} text-[14px]`} />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </div>
            <i className="ti ti-bell text-[17px] text-[#7A7F8E] hover:text-[#E8E4DC] cursor-pointer transition-colors mr-3" />
            <div className="w-[30px] h-[30px] rounded-full bg-[#c4b1f9]/[0.15] flex items-center justify-center text-[11px] font-medium text-[#c4b1f9]">
              SD
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
