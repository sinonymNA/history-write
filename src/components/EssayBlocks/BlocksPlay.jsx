import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useGame } from '../../context/GameContext'
import { BLOCK_TEMPLATES } from '../../lib/constants'
import { doc, collection, onSnapshot, updateDoc, setDoc } from 'firebase/firestore'
import { ArrowLeft, Clock, Users, Send, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

export default function BlocksPlay() {
  const { firebase, user, userData } = useAuth()
  const { addXP } = useGame()

  const [sessionCode, setSessionCode] = useState('')
  const [sessionData, setSessionData] = useState(null)
  const [players, setPlayers] = useState([])
  const [blocks, setBlocks] = useState([])
  const [assignedBlock, setAssignedBlock] = useState(null)
  const [response, setResponse] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [playerSubmissions, setPlayerSubmissions] = useState({})

  const timerRef = useRef(null)
  const unsubRefs = useRef([])
  const isTeacher = userData?.role === 'teacher'

  // Load session code
  useEffect(() => {
    let code = ''
    try {
      code = sessionStorage.getItem('blocksSessionCode') || ''
    } catch {}
    if (code) setSessionCode(code)
  }, [])

  // Subscribe to session data and players
  useEffect(() => {
    if (!sessionCode || !firebase?.db) return

    const sessionRef = doc(firebase.db, 'blocksSessions', sessionCode)
    const playersRef = collection(firebase.db, 'blocksSessions', sessionCode, 'players')
    const submissionsRef = collection(firebase.db, 'blocksSessions', sessionCode, 'submissions')

    const unsubSession = onSnapshot(sessionRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setSessionData(data)

        // Generate blocks from session data
        const type = data.essayType || 'leq'
        let generated = []
        if (type === 'saq') {
          generated = BLOCK_TEMPLATES.saq(data.prompt, data.parts || 3)
        } else if (type === 'dbq') {
          generated = BLOCK_TEMPLATES.dbq(data.prompt, data.sources || [])
        } else {
          generated = BLOCK_TEMPLATES.leq(data.prompt)
        }
        setBlocks(generated)

        // Set timer from session start time
        if (data.startedAt && data.timeLimit) {
          const elapsed = Math.floor((Date.now() - data.startedAt) / 1000)
          const totalSeconds = data.timeLimit * 60
          const remaining = Math.max(0, totalSeconds - elapsed)
          setTimeLeft(remaining)
        }

        // Navigate to review when session moves to review phase
        if (data.status === 'reviewing') {
          window.location.hash = '#blocks-review'
        }

        setLoading(false)
      }
    })

    const unsubPlayers = onSnapshot(playersRef, (snap) => {
      const list = []
      snap.forEach(d => list.push({ id: d.id, ...d.data() }))
      setPlayers(list.sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0)))
    })

    const unsubSubmissions = onSnapshot(submissionsRef, (snap) => {
      const subs = {}
      snap.forEach(d => { subs[d.id] = d.data() })
      setPlayerSubmissions(subs)
    })

    unsubRefs.current = [unsubSession, unsubPlayers, unsubSubmissions]

    return () => {
      unsubRefs.current.forEach(fn => fn())
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [sessionCode, firebase?.db])

  // Assign block to student based on player order
  useEffect(() => {
    if (!user || isTeacher || blocks.length === 0 || players.length === 0) return

    const playerIndex = players.findIndex(p => p.uid === user.uid)
    if (playerIndex >= 0) {
      const blockIndex = playerIndex % blocks.length
      setAssignedBlock(blocks[blockIndex])
    }
  }, [blocks, players, user, isTeacher])

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || submitted) return

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          // Auto-submit if time is up
          if (!submitted && !isTeacher) {
            handleSubmit(true)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timeLeft, submitted, isTeacher])

  const handleTextChange = (text) => {
    setResponse(text)
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length)
  }

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submitted || !firebase?.db || !user || !assignedBlock) return
    setSubmitted(true)

    try {
      const subRef = doc(firebase.db, 'blocksSessions', sessionCode, 'submissions', user.uid)
      await setDoc(subRef, {
        uid: user.uid,
        name: userData?.name || 'Student',
        blockId: assignedBlock.id,
        blockLabel: assignedBlock.label,
        blockEmoji: assignedBlock.emoji,
        response: response,
        wordCount: wordCount,
        submittedAt: Date.now(),
        autoSubmitted: autoSubmit
      })
      addXP(15)
    } catch (err) {
      console.error('Failed to submit block:', err)
      setSubmitted(false)
    }
  }, [submitted, firebase?.db, user, assignedBlock, sessionCode, response, wordCount, userData, addXP])

  // Teacher: advance to review phase
  const handleAdvanceToReview = async () => {
    if (!firebase?.db || !isTeacher) return
    try {
      const sessionRef = doc(firebase.db, 'blocksSessions', sessionCode)
      await updateDoc(sessionRef, { status: 'reviewing' })
    } catch (err) {
      console.error('Failed to advance to review:', err)
    }
  }

  const handleBack = () => {
    if (!submitted && response.trim()) {
      setShowExitConfirm(true)
      return
    }
    unsubRefs.current.forEach(fn => fn())
    if (timerRef.current) clearInterval(timerRef.current)
    window.location.hash = isTeacher ? '#teacher-dash' : '#student-dash'
  }

  const confirmExit = () => {
    setShowExitConfirm(false)
    unsubRefs.current.forEach(fn => fn())
    if (timerRef.current) clearInterval(timerRef.current)
    window.location.hash = isTeacher ? '#teacher-dash' : '#student-dash'
  }

  // Format time display
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const isUrgent = timeLeft > 0 && timeLeft <= 60

  if (loading) {
    return (
      <div className="eb-wrap pageEnter">
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: 'var(--ac)' }} />
          <p className="text-sm" style={{ color: 'var(--mu)' }}>Loading game...</p>
        </div>
      </div>
    )
  }

  const submittedCount = Object.keys(playerSubmissions).length
  const totalStudents = players.filter(p => p.uid !== sessionData?.teacherUid).length

  // ---------- TEACHER VIEW ----------
  if (isTeacher) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 pageEnter">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={handleBack} className="text-sm flex items-center gap-1" style={{ color: 'var(--mu)' }}>
            <ArrowLeft className="w-4 h-4" />Back
          </button>
          <div className={`eb-timer flex items-center gap-2 px-4 py-2 rounded-xl font-bold fm ${isUrgent ? 'urgent' : ''}`} style={{ background: isUrgent ? 'rgba(212,98,47,.1)' : 'var(--elev)', border: '1px solid var(--bd)', color: isUrgent ? 'var(--ac)' : 'var(--tx)' }}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Prompt bar */}
        <div className="p-4 rounded-xl mb-5" style={{ background: 'var(--elev)', border: '1px solid var(--bd)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold fm uppercase px-2 py-1 rounded" style={{ background: 'var(--acs)', color: 'var(--ac)' }}>
              {(sessionData?.essayType || 'leq').toUpperCase()}
            </span>
            <span className="text-xs font-semibold" style={{ color: 'var(--mu)' }}>{sessionData?.title || 'Essay Blocks'}</span>
          </div>
          <p className="text-sm fs leading-relaxed" style={{ color: 'var(--mu)' }}>{sessionData?.prompt}</p>
        </div>

        {/* Progress summary */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: 'var(--mu)' }} />
            <span className="text-sm font-semibold">Student Progress</span>
          </div>
          <span className="text-xs fm" style={{ color: 'var(--fa)' }}>
            {submittedCount}/{totalStudents} submitted
          </span>
        </div>

        {/* Student progress grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 stagger">
          {players.filter(p => p.uid !== sessionData?.teacherUid).map(player => {
            const sub = playerSubmissions[player.uid]
            const playerBlock = (() => {
              const idx = players.findIndex(p => p.uid === player.uid)
              if (idx >= 0 && blocks.length > 0) return blocks[idx % blocks.length]
              return null
            })()

            return (
              <div key={player.id} className="hcard p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: sub ? 'var(--sg)' : 'var(--ac)' }}>
                      {(player.name || '?')[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold">{player.name}</span>
                  </div>
                  {sub ? (
                    <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--sg)' }} />
                  ) : (
                    <div className="w-4 h-4 rounded-full" style={{ border: '2px solid var(--bd)' }} />
                  )}
                </div>
                {playerBlock && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{playerBlock.emoji}</span>
                    <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--ac)' }}>{playerBlock.label}</span>
                  </div>
                )}
                {sub ? (
                  <div>
                    <p className="text-xs line-clamp-2" style={{ color: 'var(--mu)' }}>{sub.response}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--sg)' }}>{sub.wordCount} words {sub.autoSubmitted ? '(auto)' : ''}</p>
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--fa)' }}>Writing...</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Teacher actions */}
        <div className="flex gap-3">
          <button
            onClick={handleAdvanceToReview}
            disabled={submittedCount === 0}
            className="btnP flex-1 flex items-center justify-center gap-2 text-sm"
          >
            <Send className="w-4 h-4" />
            {timeLeft === 0 ? 'Time\'s Up — Go to Review' : `End Early & Review (${submittedCount} submitted)`}
          </button>
        </div>
      </div>
    )
  }

  // ---------- STUDENT VIEW ----------
  return (
    <div className="eb-wrap pageEnter">
      {/* Header with timer */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={handleBack} className="text-sm flex items-center gap-1" style={{ color: 'var(--mu)' }}>
          <ArrowLeft className="w-4 h-4" />Exit
        </button>
        <div className={`eb-timer flex items-center gap-2 px-4 py-2 rounded-xl font-bold fm ${isUrgent ? 'urgent' : ''}`} style={{ background: isUrgent ? 'rgba(212,98,47,.1)' : 'var(--elev)', border: '1px solid var(--bd)', color: isUrgent ? 'var(--ac)' : 'var(--tx)', fontSize: '16px' }}>
          <Clock className="w-4 h-4" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Prompt bar */}
      <div className="p-3 rounded-xl mb-4" style={{ background: 'var(--elev)', border: '1px solid var(--bd)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold fm uppercase px-2 py-1 rounded" style={{ background: 'var(--acs)', color: 'var(--ac)' }}>
            {(sessionData?.essayType || 'leq').toUpperCase()}
          </span>
        </div>
        <p className="text-xs fs leading-relaxed" style={{ color: 'var(--mu)' }}>{sessionData?.prompt}</p>
      </div>

      {/* Block assignment indicator */}
      <div className="flex items-center gap-2 mb-2">
        <span className="eb-block-label">Your Block</span>
        {blocks.length > 0 && (
          <span className="text-[10px]" style={{ color: 'var(--fa)' }}>
            ({players.filter(p => p.uid !== sessionData?.teacherUid).length} students, {blocks.length} blocks)
          </span>
        )}
      </div>

      {/* Teammate block assignments */}
      <div className="flex flex-wrap gap-2 mb-4">
        {players.filter(p => p.uid !== sessionData?.teacherUid).map((player, i) => {
          const blockIdx = i % blocks.length
          const b = blocks[blockIdx]
          const isMe = player.uid === user?.uid
          return (
            <div
              key={player.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px]"
              style={{
                background: isMe ? 'var(--acs)' : 'var(--elev)',
                border: isMe ? '1px solid var(--ac)' : '1px solid var(--bd)',
                fontWeight: isMe ? '700' : '500'
              }}
            >
              <span>{b?.emoji}</span>
              <span style={{ color: isMe ? 'var(--ac)' : 'var(--fa)' }}>{player.name?.split(' ')[0]}</span>
            </div>
          )
        })}
      </div>

      {/* Assigned block card */}
      {assignedBlock && !submitted && (
        <div className="eb-card eb-block">
          <span className="eb-emoji">{assignedBlock.emoji}</span>
          <h2 className="text-xl font-bold fs mb-1">{assignedBlock.label}</h2>
          <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--mu)' }}>{assignedBlock.question}</p>

          {assignedBlock.hint && (
            <div className="mb-4 p-3 rounded-xl text-xs leading-relaxed" style={{ background: 'rgba(196,149,40,.08)', border: '1px solid rgba(196,149,40,.2)', color: 'var(--gd)' }}>
              <span className="font-bold">Tip: </span>{assignedBlock.hint}
            </div>
          )}

          <textarea
            value={response}
            onChange={e => handleTextChange(e.target.value)}
            className="w-full p-4 rounded-xl text-sm fs leading-relaxed resize-none focus:outline-none transition-all"
            style={{ background: 'var(--elev)', border: '1px solid var(--bd)', color: 'var(--tx)', minHeight: '180px' }}
            onFocus={e => { e.target.style.borderColor = 'var(--ac)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,98,47,.1)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--bd)'; e.target.style.boxShadow = 'none' }}
            placeholder={`Write your ${assignedBlock.label.toLowerCase()} here...`}
          />

          <div className="flex items-center justify-between mt-2 text-[11px]" style={{ color: 'var(--fa)' }}>
            <span style={{ color: wordCount >= (assignedBlock.minWords || 0) ? 'var(--sg)' : 'var(--fa)' }}>
              {wordCount} words{assignedBlock.minWords ? ` / ${assignedBlock.minWords} min` : ''}
            </span>
            <span>{response.length} characters</span>
          </div>

          <button
            onClick={() => handleSubmit(false)}
            disabled={!response.trim()}
            className="btnP w-full mt-4 flex items-center justify-center gap-2 text-sm"
          >
            <Send className="w-4 h-4" />Submit Block
          </button>
        </div>
      )}

      {/* Submitted state */}
      {submitted && (
        <div className="eb-card eb-consolidated text-center py-8">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--sg)' }} />
          <h2 className="text-xl font-bold fs mb-2">Block Submitted!</h2>
          <p className="text-sm mb-1" style={{ color: 'var(--mu)' }}>
            Your <strong>{assignedBlock?.label}</strong> block has been submitted.
          </p>
          <p className="text-xs" style={{ color: 'var(--fa)' }}>
            Waiting for other teammates to finish writing...
          </p>
          <div className="mt-5 flex justify-center gap-2">
            {players.filter(p => p.uid !== sessionData?.teacherUid).map(p => (
              <div
                key={p.id}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: playerSubmissions[p.uid] ? 'var(--sg)' : 'var(--bd)' }}
                title={`${p.name}: ${playerSubmissions[p.uid] ? 'Submitted' : 'Writing...'}`}
              >
                {(p.name || '?')[0].toUpperCase()}
              </div>
            ))}
          </div>
          <p className="text-[10px] mt-3" style={{ color: 'var(--fa)' }}>
            {submittedCount}/{totalStudents} submitted
          </p>
        </div>
      )}

      {/* Timer expired, not submitted */}
      {timeLeft === 0 && !submitted && (
        <div className="mt-4 p-4 rounded-xl text-center" style={{ background: 'rgba(212,98,47,.08)', border: '1px solid rgba(212,98,47,.2)' }}>
          <AlertTriangle className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--ac)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--ac)' }}>Time's up!</p>
          <p className="text-xs" style={{ color: 'var(--mu)' }}>Your response was auto-submitted.</p>
        </div>
      )}

      {/* Exit confirmation modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50">
          <div className="modalBg" onClick={() => setShowExitConfirm(false)}>
            <div className="modalBox" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--ac)' }} />
                <h3 className="text-lg font-bold">Leave Game?</h3>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--mu)' }}>
                You have unsaved work. If you leave now, your response will be lost.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowExitConfirm(false)} className="btnG flex-1">Stay</button>
                <button onClick={confirmExit} className="btnP flex-1" style={{ background: '#c0392b' }}>Leave</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
