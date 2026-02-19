import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { BB_QUESTIONS } from '../../lib/constants'
import { ArrowLeft } from 'lucide-react'

export default function QuizGame() {
  const { user, userData, firebase } = useAuth()
  const [phase, setPhase] = useState('lobby')
  const [gameData, setGameData] = useState(null)
  const [players, setPlayers] = useState([])
  const [isHost, setIsHost] = useState(false)
  const [gameId, setGameId] = useState(null)
  const [myAnswer, setMyAnswer] = useState(null)
  const [timer, setTimer] = useState(15)
  const timerRef = useRef(null)
  const unsubGame = useRef(null)
  const unsubPlayers = useRef(null)

  useEffect(() => {
    const params = JSON.parse(sessionStorage.getItem('quizParams') || '{}')
    if (params.gameId) { setGameId(params.gameId); setIsHost(!!params.isHost) }
  }, [])

  useEffect(() => {
    if (!gameId || !firebase?.db) return
    let mounted = true
    const setup = async () => {
      const { doc, collection, onSnapshot } = await import('firebase/firestore')
      unsubGame.current = onSnapshot(doc(firebase.db, 'quizGames', gameId), snap => {
        if (!snap.exists() || !mounted) return
        const data = snap.data()
        setGameData(data)
        setPhase(data.status)
        if (data.status === 'question') setMyAnswer(null)
      })
      unsubPlayers.current = onSnapshot(collection(firebase.db, 'quizGames', gameId, 'players'), snap => {
        if (!mounted) return
        setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      })
    }
    setup()
    return () => { mounted = false; clearInterval(timerRef.current); unsubGame.current?.(); unsubPlayers.current?.() }
  }, [gameId, firebase])

  useEffect(() => {
    clearInterval(timerRef.current)
    if (phase !== 'question' || !gameData?.questionStartedAt) return
    const startMs = gameData.questionStartedAt.toMillis ? gameData.questionStartedAt.toMillis() : (gameData.questionStartedAt.seconds * 1000)
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, (gameData.timePerQ || 15) - (Date.now() - startMs) / 1000)
      setTimer(Math.ceil(remaining))
      if (remaining <= 0) { clearInterval(timerRef.current); if (isHost) setTimeout(() => doShowLeaderboard(), 1000) }
    }, 200)
    return () => clearInterval(timerRef.current)
  }, [phase, gameData, isHost])

  useEffect(() => {
    if (phase !== 'question' || !isHost || !players.length) return
    if (players.every(p => p.answered)) { clearInterval(timerRef.current); setTimeout(() => doShowLeaderboard(), 1500) }
  }, [players, phase, isHost])

  const startGame = async () => {
    if (!firebase?.db) return
    const { updateDoc, doc, serverTimestamp } = await import('firebase/firestore')
    for (const p of players) await updateDoc(doc(firebase.db, 'quizGames', gameId, 'players', p.id), { score: 0, streak: 0, answered: false, answer: null })
    await updateDoc(doc(firebase.db, 'quizGames', gameId), { status: 'question', currentQ: 0, questionStartedAt: serverTimestamp() })
  }

  const doAnswer = async (choice) => {
    if (!firebase?.db || !user || myAnswer !== null) return
    setMyAnswer(choice)
    const q = gameData.questions[gameData.currentQ]
    const startMs = gameData.questionStartedAt.toMillis ? gameData.questionStartedAt.toMillis() : (gameData.questionStartedAt.seconds * 1000)
    const answerTime = (Date.now() - startMs) / 1000
    const correct = choice === q.a
    const me = players.find(p => p.id === user.uid)
    const streak = correct ? (me?.streak || 0) + 1 : 0
    const mult = streak >= 10 ? 3 : streak >= 5 ? 2 : streak >= 3 ? 1.5 : 1
    const speedBonus = Math.round(Math.max(0, ((gameData.timePerQ || 15) - answerTime) / (gameData.timePerQ || 15) * 500))
    const pts = correct ? Math.round((1000 + speedBonus) * mult) : 0
    const { updateDoc, doc } = await import('firebase/firestore')
    await updateDoc(doc(firebase.db, 'quizGames', gameId, 'players', user.uid), { answered: true, answer: choice, score: (me?.score || 0) + pts, streak })
  }

  const doShowLeaderboard = async () => {
    if (!isHost || !firebase?.db) return
    const { updateDoc, doc } = await import('firebase/firestore')
    await updateDoc(doc(firebase.db, 'quizGames', gameId), { status: 'leaderboard' })
  }

  const nextQuestion = async () => {
    if (!isHost || !firebase?.db) return
    const { updateDoc, doc, serverTimestamp } = await import('firebase/firestore')
    for (const p of players) await updateDoc(doc(firebase.db, 'quizGames', gameId, 'players', p.id), { answered: false, answer: null })
    await updateDoc(doc(firebase.db, 'quizGames', gameId), { status: 'question', currentQ: gameData.currentQ + 1, questionStartedAt: serverTimestamp() })
  }

  const doFinish = async () => {
    if (!isHost || !firebase?.db) return
    const { updateDoc, doc } = await import('firebase/firestore')
    await updateDoc(doc(firebase.db, 'quizGames', gameId), { status: 'podium' })
  }

  const exit = () => { clearInterval(timerRef.current); unsubGame.current?.(); unsubPlayers.current?.(); window.location.hash = userData?.role === 'teacher' ? '#teacher-dash' : '#student-dash' }

  const sorted = [...players].sort((a, b) => b.score - a.score)
  const medals = ['🥇', '🥈', '🥉']
  const me = players.find(p => p.id === user?.uid)

  if (!gameId) return (
    <div className="qz-wrap flex items-center justify-center" style={{ minHeight: '100vh' }}>
      <div className="text-center p-8"><p className="text-sm" style={{ color: '#9a9385' }}>No active quiz game.</p><button onClick={exit} className="btnG text-xs mt-4" style={{ color: '#e8e6e1', borderColor: '#332f26' }}>Back</button></div>
    </div>
  )

  return (
    <div className="qz-wrap" style={{ minHeight: '100vh' }}>
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #332f26' }}>
        <button onClick={exit} className="text-sm flex items-center gap-1" style={{ color: '#9a9385' }}><ArrowLeft className="w-4 h-4" />Exit</button>
        {me && <span className="fm text-sm font-bold" style={{ color: '#e8e6e1' }}>{me.score?.toLocaleString() || 0}</span>}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {phase === 'lobby' && gameData && (
          <div className="text-center pageEnter">
            <span className="text-[10px] font-bold fm uppercase px-3 py-1 rounded" style={{ background: 'rgba(212,98,47,.15)', color: '#e8794a' }}>Live Quiz</span>
            <h1 className="text-4xl fm font-bold mt-4 mb-2" style={{ color: '#e8e6e1', letterSpacing: '6px' }}>{gameData.code}</h1>
            <p className="text-xs mb-6" style={{ color: '#9a9385' }}>{gameData.numQuestions} questions · {gameData.timePerQ}s each · {players.length} player{players.length !== 1 ? 's' : ''}</p>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {players.length ? players.map(p => <span key={p.id} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: '#242119', color: '#e8e6e1', border: '1px solid #332f26' }}>{p.name}</span>)
                : <p className="text-xs" style={{ color: '#655f52' }}>Waiting for players...</p>}
            </div>
            {isHost ? <button onClick={startGame} className="btnP text-sm px-8 py-3" disabled={players.length < 1}>{players.length < 1 ? 'Need at least 1 player' : 'Start Game!'}</button>
              : <p className="text-xs" style={{ color: '#9a9385' }}>Waiting for host to start...</p>}
          </div>
        )}

        {phase === 'question' && gameData?.questions?.[gameData.currentQ] && (() => {
          const q = gameData.questions[gameData.currentQ]
          const answered = me?.answered
          return (
            <div className="pageEnter">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs fm font-bold" style={{ color: '#9a9385' }}>Q{gameData.currentQ + 1}/{gameData.numQuestions}</span>
                <span className={`text-2xl fm font-bold ${timer <= 5 ? 'qz-timer urgent' : ''}`} style={{ color: timer <= 5 ? '#e74c3c' : '#e8e6e1' }}>{timer}</span>
              </div>
              <h2 className="text-lg font-semibold mb-6 fs" style={{ color: '#e8e6e1' }}>{q.q}</h2>
              <div className="grid grid-cols-1 gap-3">
                {q.c.map((c, i) => (
                  <button key={i} onClick={() => doAnswer(i)} disabled={answered} className="qz-choice"
                    style={{ opacity: answered && i !== q.a && i !== me?.answer ? 0.4 : 1, outline: answered && i === q.a ? '2px solid #2ecc71' : 'none' }}>
                    {String.fromCharCode(65 + i)}. {c}
                  </button>
                ))}
              </div>
              {answered && <div className="text-center mt-4">{me.answer === q.a ? <span className="text-sm font-bold" style={{ color: '#2ecc71' }}>Correct! 🔥 Streak: {me.streak}</span> : <span className="text-sm font-bold" style={{ color: '#e74c3c' }}>Wrong — answer was {String.fromCharCode(65 + q.a)}</span>}</div>}
            </div>
          )
        })()}

        {phase === 'leaderboard' && (
          <div className="text-center pageEnter">
            <h2 className="text-lg font-bold mb-4" style={{ color: '#e8e6e1' }}>Leaderboard</h2>
            <div className="space-y-2 mb-6">{sorted.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: '#242119', border: '1px solid #332f26' }}>
                <span className="text-lg w-6">{medals[i] || <span className="text-xs fm" style={{ color: '#655f52' }}>{i + 1}</span>}</span>
                <span className="flex-1 text-sm font-semibold text-left" style={{ color: '#e8e6e1' }}>{p.name}</span>
                <span className="fm text-sm font-bold" style={{ color: '#e8e6e1' }}>{p.score?.toLocaleString()}</span>
                {p.streak >= 3 && <span className="text-xs">🔥{p.streak}</span>}
              </div>
            ))}</div>
            {isHost ? (gameData.currentQ < gameData.numQuestions - 1 ? <button onClick={nextQuestion} className="btnP text-sm px-8 py-3">Next Question →</button> : <button onClick={doFinish} className="btnP text-sm px-8 py-3">Show Final Results!</button>) : <p className="text-xs" style={{ color: '#9a9385' }}>Host is advancing...</p>}
          </div>
        )}

        {phase === 'podium' && (
          <div className="text-center pageEnter">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#e8e6e1' }}>Final Results!</h2>
            <div className="flex items-end justify-center gap-4 mb-8">
              {(() => {
                const pod = sorted.length >= 3 ? [sorted[1], sorted[0], sorted[2]] : sorted.length === 2 ? [sorted[1], sorted[0]] : sorted.slice(0, 1)
                const order = sorted.length >= 3 ? [1, 0, 2] : sorted.length === 2 ? [1, 0] : [0]
                const h = ['h-36', 'h-44', 'h-28']
                return pod.map((p, i) => (
                  <div key={p.id} className={`flex flex-col items-center justify-center p-4 rounded-xl ${h[order[i]]}`} style={{ background: '#242119', border: '1px solid #332f26', minWidth: 100 }}>
                    <span className="text-3xl mb-1">{medals[order[i]]}</span>
                    <span className="text-sm font-bold mb-1" style={{ color: '#e8e6e1' }}>{p.name}</span>
                    <span className="fm text-xs" style={{ color: '#9a9385' }}>{p.score?.toLocaleString()}</span>
                  </div>
                ))
              })()}
            </div>
            <button onClick={exit} className="btnP text-sm px-8 py-3">Back to Dashboard</button>
          </div>
        )}
      </div>
    </div>
  )
}
