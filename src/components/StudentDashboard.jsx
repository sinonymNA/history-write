import { useAuth } from '../context/AuthContext'
import { useGame } from '../context/GameContext'
import { BookOpen, Puzzle, Sprout, Gamepad2, Zap } from 'lucide-react'

export default function StudentDashboard() {
  const { userData } = useAuth()
  const { gameState } = useGame()

  const stats = gameState.gamification || { level: 1, xp: 0 }
  const level = stats.level || 1
  const nextXp = level * 200
  const pct = Math.min(100, Math.round((stats.xp / nextXp) * 100))

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-56px)] pageEnter">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg,var(--ac),var(--gd))' }}>
            <Puzzle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold fs">Welcome back, {userData?.name || 'Scholar'}</h2>
            <p className="text-xs text-[var(--mu)]">Sharpen your AP World writing skills.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hcard flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-[var(--acs)] text-[var(--ac)]">Lv{level}</div>
            <div>
              <div className="text-xs font-semibold">{stats.xp} XP</div>
              <div className="xpBar w-20 mt-1">
                <div className="xpFill" style={{ width: `${pct}%` }}></div>
              </div>
            </div>
          </div>
          <button className="btnG text-xs py-2 px-3" style={{ borderColor: '#c0392b', color: '#c0392b' }}>
            <Zap className="w-3 h-3 inline mr-1" />Join Quiz
          </button>
          <button className="btnP text-xs py-2 px-4">Join Class</button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-3 border-b border-[var(--bd)]">
        <button className="tabBtn on">
          <BookOpen className="w-3.5 h-3.5 inline mr-1" />Assignments
        </button>
        <button className="tabBtn">
          <Puzzle className="w-3.5 h-3.5 inline mr-1" />Essay Blocks
        </button>
        <button className="tabBtn">
          <Sprout className="w-3.5 h-3.5 inline mr-1" />Skill Garden
        </button>
        <button className="tabBtn">
          <Gamepad2 className="w-3.5 h-3.5 inline mr-1" />Arcade
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto csc">
        <div className="space-y-2 stagger">
          <p className="text-center text-[var(--mu)] py-8">No assignments yet. Check back soon!</p>
        </div>
      </div>
    </div>
  )
}
