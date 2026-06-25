import { useState } from 'react'
import Navbar from './components/Navbar'
import DailyCallList from './components/DailyCallList'
import QuickLookup from './components/QuickLookup'
import UploadTranscript from './components/UploadTranscript'
import KnowledgeBase from './components/KnowledgeBase'

export default function App() {
  const [activeTab, setActiveTab] = useState('calls')
  const [briefs, setBriefs] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [feedbackGiven, setFeedbackGiven] = useState({})
  const [outcomeGiven, setOutcomeGiven] = useState({})

  return (
    <div className="min-h-screen">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="max-w-5xl mx-auto px-8 py-8">
        {activeTab === 'calls' && (
          <DailyCallList
            briefs={briefs} setBriefs={setBriefs}
            currentIndex={currentIndex} setCurrentIndex={setCurrentIndex}
            completedCount={completedCount} setCompletedCount={setCompletedCount}
            feedbackGiven={feedbackGiven} setFeedbackGiven={setFeedbackGiven}
            outcomeGiven={outcomeGiven} setOutcomeGiven={setOutcomeGiven}
          />
        )}
        {activeTab === 'quick' && <QuickLookup />}
        {activeTab === 'transcript' && <UploadTranscript />}
        {activeTab === 'knowledge' && <KnowledgeBase />}
      </main>
    </div>
  )
}
