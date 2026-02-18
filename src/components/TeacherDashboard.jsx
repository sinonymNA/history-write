import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { BookOpen, Zap, Sparkles, Library, Plus } from 'lucide-react'

export default function TeacherDashboard() {
  const { userData } = useAuth()
  const [createClassOpen, setCreateClassOpen] = useState(false)
  const [className, setClassName] = useState('')

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pageEnter">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg,var(--ac),var(--gd))' }}>
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold fs">My Classes</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--mu)' }}>Create classes and assign writing tasks.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.location.hash = '#quiz-game'} className="btnG text-sm py-2 px-4 flex items-center gap-2" style={{ borderColor: '#c0392b', color: '#c0392b' }}>
            <Zap className="w-4 h-4" />Host Quiz
          </button>
          <button onClick={() => window.location.hash = '#lesson-lab'} className="btnG text-sm py-2 px-4 flex items-center gap-2" style={{ borderColor: 'var(--gd)', color: 'var(--gd)' }}>
            <Sparkles className="w-4 h-4" />Lesson Lab
          </button>
          <button onClick={() => window.location.hash = '#library'} className="btnG text-sm py-2 px-4 flex items-center gap-2">
            <Library className="w-4 h-4" />Library
          </button>
          <button onClick={() => setCreateClassOpen(true)} className="btnP text-sm py-2 px-4 flex items-center gap-2">
            <Plus className="w-4 h-4" />New Class
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
        <div className="col-span-full text-center py-12" style={{ border: '2px dashed var(--bd)', borderRadius: '16px' }}>
          <p className="text-sm mb-1" style={{ color: 'var(--mu)' }}>No classes yet</p>
          <p className="text-xs" style={{ color: 'var(--fa)' }}>Click "New Class" to get started.</p>
        </div>
      </div>

      {/* Create Class Modal */}
      {createClassOpen && (
        <div className="fixed inset-0 z-50">
          <div className="modalBg" onClick={() => setCreateClassOpen(false)}>
            <div className="modalBox" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">Create Class</h3>
              <input
                value={className}
                onChange={e => setClassName(e.target.value)}
                placeholder="e.g. Period 3 — AP World"
                className="hinp mb-4"
              />
              <div className="flex gap-2">
                <button onClick={() => setCreateClassOpen(false)} className="btnG flex-1">Cancel</button>
                <button onClick={() => { setCreateClassOpen(false); setClassName('') }} className="btnP flex-1">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
