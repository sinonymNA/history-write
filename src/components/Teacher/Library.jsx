import { useState } from 'react'
import { Search, BookOpen } from 'lucide-react'

export default function Library() {
  const [searchQuery, setSearchQuery] = useState('')
  const [lessons, setLessons] = useState([])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold fs mb-6">Lesson Library</h1>

      <div className="hcard p-4 mb-6">
        <div className="flex items-center gap-2">
          <Search size={18} className="text-[var(--mu)]" />
          <input
            type="text"
            placeholder="Search lessons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[var(--tx)] placeholder-[var(--mu)] outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {lessons.length === 0 ? (
          <div className="hcard p-6 text-center">
            <BookOpen size={32} className="mx-auto mb-2 text-[var(--ac)]" />
            <p className="text-[var(--mu)]">No lessons in library yet. Create your first lesson to get started.</p>
          </div>
        ) : (
          lessons.map(lesson => (
            <div key={lesson.id} className="hcard p-4">
              <h3 className="font-bold text-[var(--tx)]">{lesson.title}</h3>
              <p className="text-xs text-[var(--mu)]">{lesson.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
