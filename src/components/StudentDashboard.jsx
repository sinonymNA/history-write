import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGame } from '../context/GameContext'
import { BookOpen, Puzzle, Sprout, Gamepad2, Zap, Clock, Grid3x3, Scale, CheckSquare, Search } from 'lucide-react'
import { ESSAY_BLOCKS_PROMPTS } from '../lib/constants'

export default function StudentDashboard() {
  const { userData } = useAuth()
  const { gameState } = useGame()
  const [activeTab, setActiveTab] = useState('assign')
  const [arcadeTab, setArcadeTab] = useState('chrono')
  const [joinClassOpen, setJoinClassOpen] = useState(false)
  const [joinQuizOpen, setJoinQuizOpen] = useState(false)
  const [classCode, setClassCode] = useState('')
  const [quizCode, setQuizCode] = useState('')

  const stats = gameState.gamification || { level: 1, xp: 0, xpToNextLevel: 100 }
  const level = stats.level || 1
  const nextXp = level * 200
  const pct = Math.min(100, Math.round((stats.xp / nextXp) * 100))

  const tabs = [
    { id: 'assign', label: 'Assignments', icon: BookOpen },
    { id: 'blocks', label: 'Essay Blocks', icon: Puzzle },
    { id: 'skills', label: 'Skill Garden', icon: Sprout },
    { id: 'arcade', label: 'Arcade', icon: Gamepad2 }
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-56px)] pageEnter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg,var(--ac),var(--gd))' }}>
            <Puzzle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold fs tracking-tight">Welcome back, {userData?.name || 'Scholar'}</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--mu)' }}>Sharpen your AP World writing skills.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hcard flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'var(--acs)', color: 'var(--ac)' }}>Lv{level}</div>
            <div>
              <div className="text-xs font-semibold">{stats.xp} XP</div>
              <div className="xpBar w-20 mt-1"><div className="xpFill" style={{ width: `${pct}%` }}></div></div>
            </div>
          </div>
          <button onClick={() => setJoinQuizOpen(true)} className="btnG text-xs py-2 px-3" style={{ borderColor: '#c0392b', color: '#c0392b' }}>
            <Zap className="w-3 h-3 inline mr-1" />Join Quiz
          </button>
          <button onClick={() => setJoinClassOpen(true)} className="btnP text-xs py-2 px-4">Join Class</button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-3" style={{ borderBottom: '1px solid var(--bd)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tabBtn ${activeTab === tab.id ? 'on' : ''}`}
          >
            <tab.icon className="w-3.5 h-3.5 inline mr-1" />{tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto csc">

        {/* Assignments tab */}
        {activeTab === 'assign' && (
          <div className="space-y-2 stagger">
            <div className="text-center py-12" style={{ border: '2px dashed var(--bd)', borderRadius: '16px' }}>
              <p className="text-sm mb-1" style={{ color: 'var(--mu)' }}>No assignments yet</p>
              <p className="text-xs" style={{ color: 'var(--fa)' }}>Join a class to see assignments from your teacher.</p>
            </div>
          </div>
        )}

        {/* Essay Blocks tab */}
        {activeTab === 'blocks' && (
          <div className="px-1 py-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: 'var(--acs)' }}>🧩</div>
              <div>
                <h3 className="font-bold text-sm">Essay Blocks</h3>
                <p className="text-xs" style={{ color: 'var(--mu)' }}>Build essays piece by piece — one fun block at a time!</p>
              </div>
            </div>
            <div className="hcard p-4 mb-4 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1">
                <h4 className="text-sm font-bold">Join a Live Session</h4>
                <p className="text-xs" style={{ color: 'var(--mu)' }}>Got a session code from your teacher?</p>
              </div>
              <div className="flex gap-2">
                <input placeholder="CODE" className="hinp fm uppercase text-center" style={{ width: '120px' }} />
                <button className="btnP text-xs py-2 px-4">Join</button>
              </div>
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--fa)' }}>Solo Practice</h4>
            <div className="grid sm:grid-cols-2 gap-3 stagger">
              {ESSAY_BLOCKS_PROMPTS.map((p, i) => {
                const color = p.type === 'saq' ? 'var(--sg)' : p.type === 'leq' ? 'var(--ry)' : 'var(--ac)'
                const bgColor = p.type === 'saq' ? 'rgba(77,128,96,.1)' : p.type === 'leq' ? 'rgba(92,109,179,.1)' : 'var(--acs)'
                const diff = p.difficulty === 'Easy' ? '🟢' : p.difficulty === 'Medium' ? '🟡' : '🔴'
                return (
                  <div key={i} className="hcard p-5 flex flex-col justify-between">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold fm uppercase px-2 py-1 rounded" style={{ background: bgColor, color }}>{p.type.toUpperCase()}</span>
                        <span className="text-[10px]">{diff} {p.difficulty}</span>
                      </div>
                      <h3 className="font-bold text-sm">{p.title}</h3>
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--mu)' }}>{p.prompt.substring(0, 120)}{p.prompt.length > 120 ? '…' : ''}</p>
                    </div>
                    <button onClick={() => window.location.hash = '#blocks-solo'} className="btnP text-xs w-full flex items-center justify-center gap-2">
                      <Puzzle className="w-3.5 h-3.5" />Start Blocks
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Skill Garden tab */}
        {activeTab === 'skills' && (
          <div className="py-2">
            <div className="garden-summary">
              <div className="garden-stat"><div className="text-lg font-bold" style={{ color: 'var(--gd)' }}>0</div><div className="text-[10px]" style={{ color: 'var(--mu)' }}>🌳 Mastered</div></div>
              <div className="garden-stat"><div className="text-lg font-bold" style={{ color: 'var(--sg)' }}>0</div><div className="text-[10px]" style={{ color: 'var(--mu)' }}>🌿 Growing</div></div>
              <div className="garden-stat"><div className="text-lg font-bold" style={{ color: 'var(--fa)' }}>0</div><div className="text-[10px]" style={{ color: 'var(--mu)' }}>🌱 Seedlings</div></div>
            </div>
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: 'var(--acs)' }}>
              <div className="text-2xl">🌱</div>
              <div>
                <p className="text-xs font-semibold">Overall Garden Health: 0%</p>
                <p className="text-[10px]" style={{ color: 'var(--mu)' }}>Complete essays and games to grow your skill garden!</p>
              </div>
            </div>
            <div className="text-center py-8" style={{ border: '2px dashed var(--bd)', borderRadius: '16px' }}>
              <Sprout className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--sg)' }} />
              <p className="text-sm" style={{ color: 'var(--mu)' }}>Your garden is empty</p>
              <p className="text-xs" style={{ color: 'var(--fa)' }}>Submit essays and play games to plant skills and watch them grow.</p>
            </div>
          </div>
        )}

        {/* Arcade tab */}
        {activeTab === 'arcade' && (
          <div className="arcP h-full flex flex-col">
            <div className="flex overflow-x-auto" style={{ borderBottom: '1px solid #332f26' }}>
              {[
                { id: 'chrono', label: 'Timeline', icon: Clock },
                { id: 'blast', label: 'Block Blast', icon: Grid3x3 },
                { id: 'thesis', label: 'Thesis', icon: Scale },
                { id: 'evidence', label: 'Evidence', icon: CheckSquare },
                { id: 'source', label: 'Source', icon: Search }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setArcadeTab(tab.id)}
                  className={`arcTab flex-1 ${arcadeTab === tab.id ? 'on' : ''}`}
                >
                  <tab.icon className="w-3 h-3" /><span>{tab.label}</span>
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto csc p-4">
              {arcadeTab === 'chrono' && (
                <div className="text-center py-8">
                  <Clock className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--ac)' }} />
                  <h3 className="font-bold mb-1">Timeline Race</h3>
                  <p className="text-xs mb-4" style={{ color: 'var(--mu)' }}>Put historical events in the correct order as fast as you can!</p>
                  <button onClick={() => window.location.hash = '#timeline-race'} className="btnP text-sm">Start Game</button>
                </div>
              )}
              {arcadeTab === 'blast' && (
                <div className="text-center py-8">
                  <Grid3x3 className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--gd)' }} />
                  <h3 className="font-bold mb-1">Block Blast</h3>
                  <p className="text-xs mb-4" style={{ color: 'var(--mu)' }}>Answer 20 AP MCQs as fast as you can. How high can you score?</p>
                  <button onClick={() => window.location.hash = '#block-blast'} className="btnP text-sm">Start Game</button>
                </div>
              )}
              {arcadeTab === 'thesis' && (
                <div className="text-center py-8">
                  <Scale className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--ry)' }} />
                  <h3 className="font-bold mb-1">Thesis Judge</h3>
                  <p className="text-xs mb-4" style={{ color: 'var(--mu)' }}>Is it a strong thesis, a weak one, or not a thesis at all? You decide.</p>
                  <button className="btnP text-sm">Start Game</button>
                </div>
              )}
              {arcadeTab === 'evidence' && (
                <div className="text-center py-8">
                  <CheckSquare className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--sg)' }} />
                  <h3 className="font-bold mb-1">Evidence or Nah?</h3>
                  <p className="text-xs mb-4" style={{ color: 'var(--mu)' }}>Is the evidence specific enough for AP credit? Swipe to judge.</p>
                  <button className="btnP text-sm">Start Game</button>
                </div>
              )}
              {arcadeTab === 'source' && (
                <div className="text-center py-8">
                  <Search className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--ac)' }} />
                  <h3 className="font-bold mb-1">Source Detective</h3>
                  <p className="text-xs mb-4" style={{ color: 'var(--mu)' }}>Analyze primary sources and identify point of view.</p>
                  <button onClick={() => window.location.hash = '#source-detective'} className="btnP text-sm">Start Game</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Join Class Modal */}
      {joinClassOpen && (
        <div className="fixed inset-0 z-50">
          <div className="modalBg" onClick={() => setJoinClassOpen(false)}>
            <div className="modalBox" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">Join Class</h3>
              <input
                value={classCode}
                onChange={e => setClassCode(e.target.value.toUpperCase())}
                placeholder="Enter class code"
                className="hinp mb-4 uppercase fm"
              />
              <div className="flex gap-2">
                <button onClick={() => setJoinClassOpen(false)} className="btnG flex-1">Cancel</button>
                <button onClick={() => { setJoinClassOpen(false) }} className="btnP flex-1">Join</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Quiz Modal */}
      {joinQuizOpen && (
        <div className="fixed inset-0 z-50">
          <div className="modalBg" onClick={() => setJoinQuizOpen(false)}>
            <div className="modalBox" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-2">Join Live Quiz</h3>
              <p className="text-xs mb-3" style={{ color: 'var(--mu)' }}>Enter the game code from your teacher.</p>
              <input
                value={quizCode}
                onChange={e => setQuizCode(e.target.value.toUpperCase())}
                placeholder="Game code"
                className="hinp mb-4 uppercase fm"
                maxLength={6}
              />
              <div className="flex gap-2">
                <button onClick={() => setJoinQuizOpen(false)} className="btnG flex-1">Cancel</button>
                <button onClick={() => { setJoinQuizOpen(false); window.location.hash = '#quiz-game' }} className="btnP flex-1" style={{ background: '#c0392b' }}>Join Game</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
