import { useState } from 'react'
import { useGame } from '../../context/GameContext'
import { ChevronRight, Lock } from 'lucide-react'

export default function StoryLesson() {
  const { gameState } = useGame()
  const [chapters, setChapters] = useState([
    { id: 1, title: 'Chapter 1: The Beginning', unlocked: true },
    { id: 2, title: 'Chapter 2: The Turning Point', unlocked: gameState?.level >= 2 },
    { id: 3, title: 'Chapter 3: The Climax', unlocked: gameState?.level >= 3 },
    { id: 4, title: 'Chapter 4: The Resolution', unlocked: gameState?.level >= 4 }
  ])
  const [selectedChapter, setSelectedChapter] = useState(1)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold fs mb-6">Story Lessons</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {chapters.map(ch => (
          <button
            key={ch.id}
            onClick={() => ch.unlocked && setSelectedChapter(ch.id)}
            className={`hcard p-4 text-left transition-all ${selectedChapter === ch.id ? 'ring-2 ring-[var(--ac)]' : ''} ${!ch.unlocked ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
            disabled={!ch.unlocked}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[var(--tx)]">{ch.title}</h3>
              {!ch.unlocked && <Lock size={18} className="text-[var(--mu)]" />}
              {ch.unlocked && <ChevronRight size={18} className="text-[var(--ac)]" />}
            </div>
            {!ch.unlocked && <p className="text-xs text-[var(--mu)] mt-2">Level {ch.id} required</p>}
          </button>
        ))}
      </div>

      <div className="hcard p-6">
        <h2 className="text-lg font-bold mb-4">Chapter Content</h2>
        <p className="text-[var(--mu)]">Story narrative and quiz questions coming soon for selected chapter.</p>
      </div>
    </div>
  )
}
