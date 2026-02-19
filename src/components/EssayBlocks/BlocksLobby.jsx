import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { doc, collection, onSnapshot, updateDoc, setDoc, getDoc } from 'firebase/firestore'
import { ArrowLeft, Users, Copy, Check, Puzzle, Play, Loader2 } from 'lucide-react'

export default function BlocksLobby() {
  const { firebase, user, userData } = useAuth()
  const [sessionCode, setSessionCode] = useState('')
  const [sessionData, setSessionData] = useState(null)
  const [players, setPlayers] = useState([])
  const [isReady, setIsReady] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const unsubRefs = useRef([])

  const isTeacher = userData?.role === 'teacher'

  // Load session code from sessionStorage or URL
  useEffect(() => {
    let code = ''
    try {
      code = sessionStorage.getItem('blocksSessionCode') || ''
    } catch {}
    if (!code) {
      setError('No session code found. Please join or create a session first.')
      setLoading(false)
      return
    }
    setSessionCode(code)
  }, [])

  // Subscribe to session and player data
  useEffect(() => {
    if (!sessionCode || !firebase?.db) return

    const sessionRef = doc(firebase.db, 'blocksSessions', sessionCode)
    const playersRef = collection(firebase.db, 'blocksSessions', sessionCode, 'players')

    // Listen to session doc
    const unsubSession = onSnapshot(sessionRef, (snap) => {
      if (snap.exists()) {
        setSessionData(snap.data())
        setLoading(false)

        // If game has started, navigate to play
        if (snap.data().status === 'playing') {
          window.location.hash = '#blocks-play'
        }
      } else {
        setError('Session not found. It may have expired.')
        setLoading(false)
      }
    }, (err) => {
      console.error('Session listener error:', err)
      setError('Could not connect to session.')
      setLoading(false)
    })

    // Listen to players collection
    const unsubPlayers = onSnapshot(playersRef, (snap) => {
      const playerList = []
      snap.forEach(d => playerList.push({ id: d.id, ...d.data() }))
      setPlayers(playerList.sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0)))
    })

    unsubRefs.current = [unsubSession, unsubPlayers]

    // Join session as player if student
    if (user && !isTeacher) {
      const playerRef = doc(firebase.db, 'blocksSessions', sessionCode, 'players', user.uid)
      setDoc(playerRef, {
        name: userData?.name || 'Student',
        uid: user.uid,
        ready: false,
        joinedAt: Date.now()
      }, { merge: true }).catch(console.error)
    }

    return () => {
      unsubRefs.current.forEach(fn => fn())
    }
  }, [sessionCode, firebase?.db, user, userData, isTeacher])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(sessionCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = sessionCode
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleToggleReady = async () => {
    if (!firebase?.db || !user) return
    const newReady = !isReady
    setIsReady(newReady)
    try {
      const playerRef = doc(firebase.db, 'blocksSessions', sessionCode, 'players', user.uid)
      await updateDoc(playerRef, { ready: newReady })
    } catch (err) {
      console.error('Failed to update ready status:', err)
      setIsReady(!newReady)
    }
  }

  const handleStartGame = async () => {
    if (!firebase?.db || !isTeacher) return
    try {
      const sessionRef = doc(firebase.db, 'blocksSessions', sessionCode)
      await updateDoc(sessionRef, {
        status: 'playing',
        startedAt: Date.now()
      })
    } catch (err) {
      console.error('Failed to start game:', err)
    }
  }

  const handleBack = () => {
    unsubRefs.current.forEach(fn => fn())
    window.location.hash = isTeacher ? '#teacher-dash' : '#student-dash'
  }

  const readyCount = players.filter(p => p.ready).length
  const canStart = players.length >= 2 && readyCount >= players.filter(p => p.uid !== user?.uid).length

  // Error state
  if (error) {
    return (
      <div className="eb-wrap pageEnter">
        <button onClick={handleBack} className="mb-5 text-sm flex items-center gap-1" style={{ color: 'var(--mu)' }}>
          <ArrowLeft className="w-4 h-4" />Back
        </button>
        <div className="hcard p-6 text-center">
          <p className="text-sm" style={{ color: 'var(--ac)' }}>{error}</p>
          <button onClick={handleBack} className="btnP text-sm mt-4">Return to Dashboard</button>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="eb-wrap pageEnter">
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: 'var(--ac)' }} />
          <p className="text-sm" style={{ color: 'var(--mu)' }}>Connecting to session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="eb-wrap pageEnter">
      {/* Back button */}
      <button onClick={handleBack} className="mb-5 text-sm flex items-center gap-1" style={{ color: 'var(--mu)' }}>
        <ArrowLeft className="w-4 h-4" />{isTeacher ? 'Back to Classes' : 'Back to Dashboard'}
      </button>

      {/* Decorative SVG */}
      <div className="relative mb-6">
        <svg className="absolute -top-4 -right-4 opacity-20" width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="50" stroke="var(--ac)" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="60" cy="60" r="30" stroke="var(--gd)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="20" cy="20" r="4" fill="var(--ac)" opacity="0.5" />
          <circle cx="100" cy="30" r="3" fill="var(--sg)" opacity="0.5" />
          <circle cx="90" cy="100" r="5" fill="var(--gd)" opacity="0.4" />
          <circle cx="30" cy="90" r="3" fill="var(--ry)" opacity="0.5" />
          <circle cx="60" cy="10" r="2" fill="var(--ac)" opacity="0.6" />
          <circle cx="10" cy="60" r="2.5" fill="var(--sg)" opacity="0.4" />
        </svg>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold mb-4" style={{ background: 'var(--acs)', color: 'var(--ac)' }}>
          <Puzzle className="w-3.5 h-3.5" />
          Multiplayer Essay Blocks
        </div>

        {/* Session code */}
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-2xl font-bold fs">{sessionData?.title || 'Essay Blocks Session'}</h1>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl fm text-lg font-bold tracking-widest" style={{ background: 'var(--elev)', border: '2px dashed var(--bd)', color: 'var(--ac)' }}>
            {sessionCode}
          </div>
          <button
            onClick={handleCopyCode}
            className="btnG text-xs py-2 px-3 flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--sg)' }} /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Prompt */}
        {sessionData?.prompt && (
          <div className="p-4 rounded-xl mb-5" style={{ background: 'var(--elev)', border: '1px solid var(--bd)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold fm uppercase px-2 py-1 rounded" style={{ background: 'var(--acs)', color: 'var(--ac)' }}>
                {(sessionData.essayType || 'leq').toUpperCase()}
              </span>
            </div>
            <p className="text-sm fs leading-relaxed" style={{ color: 'var(--mu)' }}>
              {sessionData.prompt}
            </p>
          </div>
        )}
      </div>

      {/* Player list */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4" style={{ color: 'var(--mu)' }} />
          <h3 className="text-sm font-bold">Players ({players.length})</h3>
        </div>

        <div className="space-y-2 stagger">
          {players.length === 0 ? (
            <div className="text-center py-8" style={{ border: '2px dashed var(--bd)', borderRadius: '16px' }}>
              <p className="text-sm" style={{ color: 'var(--mu)' }}>Waiting for players to join...</p>
              <p className="text-xs mt-1" style={{ color: 'var(--fa)' }}>Share the code above with your students.</p>
            </div>
          ) : (
            players.map(player => (
              <div key={player.id} className="hcard px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: player.ready ? 'var(--sg)' : 'var(--bd)' }}>
                    {(player.name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{player.name}</p>
                    <p className="text-[10px]" style={{ color: player.ready ? 'var(--sg)' : 'var(--fa)' }}>
                      {player.ready ? 'Ready' : 'Joining...'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: player.ready ? 'var(--sg)' : 'var(--bd)', boxShadow: player.ready ? '0 0 8px rgba(77,128,96,.4)' : 'none' }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ready count */}
      {players.length > 0 && (
        <div className="text-center text-xs mb-5" style={{ color: 'var(--fa)' }}>
          {readyCount}/{players.length} players ready
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        {isTeacher ? (
          <button
            onClick={handleStartGame}
            disabled={players.length < 2}
            className="btnP w-full flex items-center justify-center gap-2 text-sm pulse-cta"
          >
            <Play className="w-4 h-4" />
            {players.length < 2 ? 'Need at least 2 players' : 'Start Game'}
          </button>
        ) : (
          <>
            <button
              onClick={handleToggleReady}
              className={isReady ? 'btnG w-full text-sm' : 'btnP w-full text-sm'}
              style={isReady ? { borderColor: 'var(--sg)', color: 'var(--sg)' } : {}}
            >
              {isReady ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />Ready! Click to unready
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Play className="w-4 h-4" />I'm Ready
                </span>
              )}
            </button>
            <p className="text-center text-xs" style={{ color: 'var(--fa)' }}>
              Waiting for host to start the game...
            </p>
          </>
        )}
      </div>

      {/* Session info footer */}
      <div className="mt-8 text-center text-[10px]" style={{ color: 'var(--fa)' }}>
        <p>Session: {sessionCode} | {sessionData?.essayType?.toUpperCase() || 'LEQ'} | {sessionData?.timeLimit || 15} min</p>
      </div>
    </div>
  )
}
