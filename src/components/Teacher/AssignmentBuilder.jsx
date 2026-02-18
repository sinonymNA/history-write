import { useState } from 'react'
import { Plus } from 'lucide-react'

export default function AssignmentBuilder() {
  const [assignments, setAssignments] = useState([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [title, setTitle] = useState('')
  const [essayType, setEssayType] = useState('saq')
  const [dueDate, setDueDate] = useState('')

  const handleCreateAssignment = () => {
    if (title.trim() && dueDate) {
      setAssignments([...assignments, { id: Date.now(), title, essayType, dueDate }])
      setTitle('')
      setEssayType('saq')
      setDueDate('')
      setShowBuilder(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold fs">Create Assignment</h1>
        <button onClick={() => setShowBuilder(true)} className="btnP flex items-center gap-2">
          <Plus size={18} /> New Assignment
        </button>
      </div>

      {showBuilder && (
        <div className="hcard p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Assignment Details</h2>
          <input
            type="text"
            placeholder="Assignment title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="hinp mb-3"
          />
          <select value={essayType} onChange={(e) => setEssayType(e.target.value)} className="hinp mb-3">
            <option value="saq">SAQ (Short Answer)</option>
            <option value="leq">LEQ (Long Essay)</option>
            <option value="dbq">DBQ (Document Based)</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="hinp mb-4"
          />
          <div className="flex gap-2">
            <button onClick={handleCreateAssignment} className="btnP flex-1">Create</button>
            <button onClick={() => setShowBuilder(false)} className="btnG flex-1">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {assignments.length === 0 ? (
          <div className="hcard p-6 text-center">
            <p className="text-[var(--mu)]">No assignments yet.</p>
          </div>
        ) : (
          assignments.map(a => (
            <div key={a.id} className="hcard p-4">
              <h3 className="font-bold text-[var(--tx)]">{a.title}</h3>
              <p className="text-xs text-[var(--mu)]">Type: {a.essayType.toUpperCase()} | Due: {a.dueDate}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
