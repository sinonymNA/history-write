import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Trash2, Plus, Users } from 'lucide-react'

export default function ClassManager() {
  const { currentUser } = useAuth()
  const [classes, setClasses] = useState([])
  const [showNewClass, setShowNewClass] = useState(false)
  const [newClassName, setNewClassName] = useState('')

  const handleCreateClass = async () => {
    if (newClassName.trim()) {
      setClasses([...classes, { id: Date.now(), name: newClassName, students: 0 }])
      setNewClassName('')
      setShowNewClass(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold fs">My Classes</h1>
        <button onClick={() => setShowNewClass(true)} className="btnP flex items-center gap-2">
          <Plus size={18} /> New Class
        </button>
      </div>

      {showNewClass && (
        <div className="hcard p-4 mb-6">
          <input
            type="text"
            placeholder="Class name"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            className="hinp mb-3"
          />
          <div className="flex gap-2">
            <button onClick={handleCreateClass} className="btnP flex-1">Create</button>
            <button onClick={() => setShowNewClass(false)} className="btnG flex-1">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {classes.length === 0 ? (
          <div className="hcard p-6 text-center">
            <p className="text-[var(--mu)]">No classes yet. Create your first class to get started.</p>
          </div>
        ) : (
          classes.map(cls => (
            <div key={cls.id} className="hcard p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Users size={20} className="text-[var(--ac)]" />
                <div>
                  <h3 className="font-bold text-[var(--tx)]">{cls.name}</h3>
                  <p className="text-xs text-[var(--mu)]">{cls.students} students</p>
                </div>
              </div>
              <button className="p-2 hover:bg-[var(--bd)] rounded">
                <Trash2 size={18} className="text-[var(--ac)]" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
