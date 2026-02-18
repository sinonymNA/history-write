import { BookOpen, Zap, Sparkles, Library, Plus } from 'lucide-react'

export default function TeacherDashboard() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pageEnter">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg,var(--ac),var(--gd))' }}>
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold fs">My Classes</h2>
            <p className="text-sm text-[var(--mu)]">Create classes and assign writing tasks.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btnG text-sm py-2 px-4 flex items-center gap-2" style={{ borderColor: '#c0392b', color: '#c0392b' }}>
            <Zap className="w-4 h-4" />Host Quiz
          </button>
          <button className="btnG text-sm py-2 px-4 flex items-center gap-2" style={{ borderColor: 'var(--gd)', color: 'var(--gd)' }}>
            <Sparkles className="w-4 h-4" />Lesson Lab
          </button>
          <button className="btnG text-sm py-2 px-4 flex items-center gap-2">
            <Library className="w-4 h-4" />Library
          </button>
          <button className="btnP text-sm py-2 px-4 flex items-center gap-2">
            <Plus className="w-4 h-4" />New Class
          </button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <p className="text-[var(--mu)]">No classes yet. Create one to get started.</p>
      </div>
    </div>
  )
}
