import { useState } from 'react'
import { Wand2 } from 'lucide-react'

export default function LessonLab() {
  const [topic, setTopic] = useState('')
  const [gradeLevel, setGradeLevel] = useState('ap')
  const [loading, setLoading] = useState(false)
  const [generatedLesson, setGeneratedLesson] = useState(null)

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    // AI generation will be implemented in Phase 3
    setTimeout(() => {
      setGeneratedLesson({ topic, gradeLevel, content: 'AI-generated lesson content coming soon...' })
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold fs mb-6">Lesson Lab (AI)</h1>

      <div className="hcard p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Generate Lesson</h2>
        <input
          type="text"
          placeholder="Topic (e.g., 'French Revolution')"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="hinp mb-3"
        />
        <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="hinp mb-4">
          <option value="ap">AP World History</option>
          <option value="honors">Honors</option>
          <option value="regular">Regular</option>
        </select>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btnP w-full flex items-center justify-center gap-2"
        >
          <Wand2 size={18} />
          {loading ? 'Generating...' : 'Generate with Claude'}
        </button>
      </div>

      {generatedLesson && (
        <div className="hcard p-6">
          <h3 className="font-bold text-[var(--tx)] mb-2">{generatedLesson.topic}</h3>
          <p className="text-[var(--mu)] text-sm">{generatedLesson.content}</p>
        </div>
      )}
    </div>
  )
}
