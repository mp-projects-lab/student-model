import { useState } from 'react'
import Header from './components/layout/Header'
import Main from './components/layout/Main'
import { GuideModal } from './components/modals/GuideModal'

function App() {
  const [isGuideOpen, setIsGuideOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface text-ink">
      <Header onOpenGuide={() => setIsGuideOpen(true)} />
      <Main />
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  )
}

export default App
