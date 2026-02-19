import { useState, useEffect, useCallback, useRef } from 'react'
import { useGame } from '../../context/GameContext'
import { ArrowLeft, Clock, Trophy, ChevronRight, RotateCcw, ArrowUp, ArrowDown, Check } from 'lucide-react'

/* 15 AP World History timeline events */
const TIMELINE_EVENTS = [
  { name: 'Fall of Rome', year: 476, display: 'Fall of Rome 476 CE' },
  { name: 'Mongol Empire peaks', year: 1279, display: 'Mongol Empire peaks 1279' },
  { name: 'Columbus reaches Americas', year: 1492, display: 'Columbus reaches Americas 1492' },
  { name: 'French Revolution', year: 1789, display: 'French Revolution 1789' },
  { name: 'Fall of Constantinople', year: 1453, display: 'Fall of Constantinople 1453' },
  { name: 'Gutenberg Printing Press', year: 1440, display: 'Gutenberg Printing Press 1440' },
  { name: 'American Revolution', year: 1776, display: 'American Revolution 1776' },
  { name: 'Industrial Revolution begins', year: 1760, display: 'Industrial Revolution begins 1760' },
  { name: 'Berlin Conference', year: 1884, display: 'Berlin Conference 1884' },
  { name: 'Treaty of Westphalia', year: 1648, display: 'Treaty of Westphalia 1648' },
  { name: 'Haitian Revolution', year: 1791, display: 'Haitian Revolution 1791' },
  { name: 'Meiji Restoration', year: 1868, display: 'Meiji Restoration 1868' },
  { name: 'WWI begins', year: 1914, display: 'WWI begins 1914' },
  { name: 'Russian Revolution', year: 1917, display: 'Russian Revolution 1917' },
  { name: 'UN Founded', year: 1945, display: 'UN Founded 1945' }
]

const EVENTS_PER_ROUND = 5
const TOTAL_ROUNDS = 5
const TIME_PER_ROUND = 45

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickRoundEvents(usedSets) {
  /* Pick 5 random events, try not to repeat exact sets */
  let pool = shuffle(TIMELINE_EVENTS)
  const picked = pool.slice(0, EVENTS_PER_ROUND)
  return picked
}

function countCorrectPairs(order) {
  /* Count how many adjacent pairs are in the correct chronological order */
  let correct = 0
  for (let i = 0; i < order.length - 1; i++) {
    if (order[i].year <= order[i + 1].year) correct++
  }
  return correct
}

function isFullyCorrect(order) {
  for (let i = 0; i < order.length - 1; i++) {
    if (order[i].year > order[i + 1].year) return false
  }
  return true
}

export default function TimelineRace() {
  const { addXP } = useGame()

  /* Game phases: idle, playing, roundResult, gameResult */
  const [phase, setPhase] = useState('idle')
  const [round, setRound] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [roundScores, setRoundScores] = useState([])

  /* Round state */
  const [events, setEvents] = useState([])
  const [order, setOrder] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [timer, setTimer] = useState(TIME_PER_ROUND)
  const [submitted, setSubmitted] = useState(false)
  const [roundScore, setRoundScore] = useState(0)
  const [perfectRounds, setPerfectRounds] = useState(0)
  const timerRef = useRef(null)

  /* Start the game */
  const startGame = useCallback(() => {
    setRound(0)
    setTotalScore(0)
    setRoundScores([])
    setPerfectRounds(0)
    setPhase('playing')
    startRound(0)
  }, [])

  /* Start a round */
  const startRound = (roundNum) => {
    const picked = pickRoundEvents()
    setEvents(picked.sort((a, b) => a.year - b.year)) // store correct order
    setOrder(shuffle(picked)) // shuffled for player
    setSelectedIdx(null)
    setSubmitted(false)
    setTimer(TIME_PER_ROUND)
    setRoundScore(0)
  }

  /* Timer */
  useEffect(() => {
    if (phase !== 'playing' || submitted) return
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round, submitted])

  /* Click-to-select, click-to-place ordering */
  const handleItemClick = (idx) => {
    if (submitted) return
    if (selectedIdx === null) {
      /* Select this item */
      setSelectedIdx(idx)
    } else if (selectedIdx === idx) {
      /* Deselect */
      setSelectedIdx(null)
    } else {
      /* Swap the two items */
      setOrder(prev => {
        const next = [...prev]
        const temp = next[selectedIdx]
        next[selectedIdx] = next[idx]
        next[idx] = temp
        return next
      })
      setSelectedIdx(null)
    }
  }

  /* Move selected item up or down */
  const moveItem = (direction) => {
    if (selectedIdx === null || submitted) return
    const newIdx = selectedIdx + direction
    if (newIdx < 0 || newIdx >= order.length) return
    setOrder(prev => {
      const next = [...prev]
      const temp = next[selectedIdx]
      next[selectedIdx] = next[newIdx]
      next[newIdx] = temp
      return next
    })
    setSelectedIdx(newIdx)
  }

  /* Submit the round */
  const handleSubmit = (timedOut = false) => {
    clearInterval(timerRef.current)
    setSubmitted(true)

    const correctPairs = countCorrectPairs(order)
    const maxPairs = EVENTS_PER_ROUND - 1
    const perfect = isFullyCorrect(order)
    const accuracyPct = correctPairs / maxPairs

    /* Score: base points for correct pairs + time bonus */
    const elapsed = TIME_PER_ROUND - timer
    const timeBonus = perfect ? Math.max(0, Math.round((TIME_PER_ROUND - elapsed) * 3)) : 0
    const basePoints = Math.round(accuracyPct * 200)
    const perfectBonus = perfect ? 100 : 0
    const rScore = basePoints + timeBonus + perfectBonus

    setRoundScore(rScore)
    setTotalScore(prev => prev + rScore)
    setRoundScores(prev => [...prev, { round: round + 1, score: rScore, correct: correctPairs, total: maxPairs, perfect, timedOut }])
    if (perfect) setPerfectRounds(prev => prev + 1)

    setPhase('roundResult')
  }

  /* Next round or final results */
  const nextRound = () => {
    const nextRoundNum = round + 1
    if (nextRoundNum >= TOTAL_ROUNDS) {
      addXP(Math.round(totalScore / 15))
      setPhase('gameResult')
    } else {
      setRound(nextRoundNum)
      setPhase('playing')
      startRound(nextRoundNum)
    }
  }

  const timerPct = (timer / TIME_PER_ROUND) * 100

  /* ========== IDLE SCREEN ========== */
  if (phase === 'idle') {
    return (
      <div className="arcP min-h-screen flex flex-col">
        <div className="max-w-2xl mx-auto px-4 py-6 w-full flex-1 flex flex-col items-center justify-center pageEnter">
          <button
            onClick={() => window.location.hash = '#student-dash'}
            className="self-start flex items-center gap-1 text-xs mb-8"
            style={{ color: 'var(--mu)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3498db, #2ecc71)', boxShadow: '0 8px 32px rgba(52,152,219,.3)' }}>
              <Clock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#3498db' }}>Timeline Race</h1>
            <p className="text-sm mb-1" style={{ color: 'var(--mu)' }}>Put historical events in chronological order</p>
            <p className="text-xs mb-6" style={{ color: 'var(--fa)' }}>Tap to select, tap to swap. Order events from earliest to latest!</p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="hcard px-4 py-3 text-center" style={{ background: 'rgba(255,255,255,.05)' }}>
                <div className="text-lg font-bold" style={{ color: '#3498db' }}>{TOTAL_ROUNDS}</div>
                <div className="text-[10px]" style={{ color: 'var(--mu)' }}>Rounds</div>
              </div>
              <div className="hcard px-4 py-3 text-center" style={{ background: 'rgba(255,255,255,.05)' }}>
                <div className="text-lg font-bold" style={{ color: '#2ecc71' }}>{EVENTS_PER_ROUND}</div>
                <div className="text-[10px]" style={{ color: 'var(--mu)' }}>Events Each</div>
              </div>
              <div className="hcard px-4 py-3 text-center" style={{ background: 'rgba(255,255,255,.05)' }}>
                <div className="text-lg font-bold" style={{ color: '#e67e22' }}>{TIME_PER_ROUND}s</div>
                <div className="text-[10px]" style={{ color: 'var(--mu)' }}>Per Round</div>
              </div>
            </div>

            <button onClick={startGame} className="btnP text-base px-8 py-3" style={{ background: 'linear-gradient(135deg, #3498db, #2980b9)', fontSize: '16px' }}>
              <Clock className="w-4 h-4 inline mr-2" />Start Race
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ========== GAME RESULT ========== */
  if (phase === 'gameResult') {
    const avgAccuracy = roundScores.length > 0
      ? Math.round(roundScores.reduce((sum, r) => sum + (r.correct / r.total), 0) / roundScores.length * 100)
      : 0

    return (
      <div className="arcP min-h-screen flex flex-col">
        <div className="max-w-2xl mx-auto px-4 py-6 w-full pageEnter">
          <button
            onClick={() => window.location.hash = '#student-dash'}
            className="flex items-center gap-1 text-xs mb-6"
            style={{ color: 'var(--mu)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>

          <div className="text-center mb-6">
            <Trophy className="w-12 h-12 mx-auto mb-3" style={{ color: '#f1c40f' }} />
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#3498db' }}>Race Complete!</h2>
            <p className="text-sm" style={{ color: 'var(--mu)' }}>Here is how you did across {TOTAL_ROUNDS} rounds</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="hcard p-4 text-center" style={{ background: 'rgba(255,255,255,.05)' }}>
              <div className="text-2xl font-bold" style={{ color: '#f1c40f' }}>{totalScore}</div>
              <div className="text-[10px]" style={{ color: 'var(--mu)' }}>Total Score</div>
            </div>
            <div className="hcard p-4 text-center" style={{ background: 'rgba(255,255,255,.05)' }}>
              <div className="text-2xl font-bold" style={{ color: '#2ecc71' }}>{avgAccuracy}%</div>
              <div className="text-[10px]" style={{ color: 'var(--mu)' }}>Avg Accuracy</div>
            </div>
            <div className="hcard p-4 text-center" style={{ background: 'rgba(255,255,255,.05)' }}>
              <div className="text-2xl font-bold" style={{ color: '#e67e22' }}>{perfectRounds}</div>
              <div className="text-[10px]" style={{ color: 'var(--mu)' }}>Perfect Rounds</div>
            </div>
          </div>

          {/* Round breakdown */}
          <div className="hcard p-4 mb-6" style={{ background: 'rgba(255,255,255,.05)' }}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--fa)' }}>Round Breakdown</h4>
            <div className="space-y-2">
              {roundScores.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,.03)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: 'var(--mu)' }}>Round {r.round}</span>
                    {r.perfect && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(46,204,113,.2)', color: '#2ecc71' }}>Perfect</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: 'var(--mu)' }}>{r.correct}/{r.total} pairs</span>
                    <span className="text-xs font-bold" style={{ color: '#f1c40f' }}>{r.score} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={startGame} className="btnP flex-1 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #3498db, #2980b9)' }}>
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
            <button onClick={() => window.location.hash = '#student-dash'} className="btnG flex-1">
              Back to Arcade
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ========== ROUND RESULT ========== */
  if (phase === 'roundResult') {
    const correctOrder = [...events].sort((a, b) => a.year - b.year)
    const lastScore = roundScores[roundScores.length - 1]

    return (
      <div className="arcP min-h-screen flex flex-col">
        <div className="max-w-2xl mx-auto px-4 py-6 w-full pageEnter">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold" style={{ color: 'var(--fa)' }}>Round {round + 1} of {TOTAL_ROUNDS}</span>
            <span className="text-sm font-bold" style={{ color: '#f1c40f' }}>Total: {totalScore} pts</span>
          </div>

          <div className="text-center mb-4">
            <h3 className="text-xl font-bold mb-1" style={{ color: lastScore?.perfect ? '#2ecc71' : '#e67e22' }}>
              {lastScore?.perfect ? 'Perfect Order!' : `${lastScore?.correct}/${lastScore?.total} Pairs Correct`}
            </h3>
            <p className="text-sm font-bold" style={{ color: '#f1c40f' }}>+{roundScore} points</p>
          </div>

          {/* Show correct order */}
          <div className="hcard p-4 mb-4" style={{ background: 'rgba(255,255,255,.05)' }}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--fa)' }}>Correct Order</h4>
            <div className="space-y-2">
              {correctOrder.map((evt, i) => {
                /* Check if player had this in the right position */
                const playerCorrect = order[i]?.year === evt.year
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{
                      background: playerCorrect ? 'rgba(46,204,113,.1)' : 'rgba(231,76,60,.1)',
                      border: `1px solid ${playerCorrect ? 'rgba(46,204,113,.2)' : 'rgba(231,76,60,.2)'}`
                    }}
                  >
                    <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold" style={{ background: playerCorrect ? 'rgba(46,204,113,.2)' : 'rgba(231,76,60,.2)', color: playerCorrect ? '#2ecc71' : '#e74c3c' }}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium flex-1">{evt.display}</span>
                    {playerCorrect && <Check className="w-4 h-4" style={{ color: '#2ecc71' }} />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Your order vs correct order side by side */}
          {!lastScore?.perfect && (
            <div className="hcard p-4 mb-4" style={{ background: 'rgba(255,255,255,.05)' }}>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--fa)' }}>Your Order</h4>
              <div className="space-y-1">
                {order.map((evt, i) => {
                  const correctPos = correctOrder.findIndex(e => e.year === evt.year)
                  const isRight = correctPos === i
                  return (
                    <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded text-xs" style={{ color: isRight ? '#2ecc71' : '#e74c3c' }}>
                      <span className="font-bold w-5">{i + 1}.</span>
                      <span>{evt.display}</span>
                      {!isRight && <span style={{ color: 'var(--fa)' }}>(should be #{correctPos + 1})</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <button
            onClick={nextRound}
            className="btnP w-full flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #3498db, #2980b9)' }}
          >
            {round + 1 >= TOTAL_ROUNDS ? 'See Final Results' : `Round ${round + 2}`}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  /* ========== PLAYING SCREEN ========== */
  return (
    <div className="arcP min-h-screen flex flex-col">
      <div className="max-w-2xl mx-auto px-4 py-4 w-full flex-1 flex flex-col">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => { clearInterval(timerRef.current); setPhase('idle') }}
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--mu)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Quit
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--fa)' }}>Round {round + 1}/{TOTAL_ROUNDS}</span>
            <span className="text-sm font-bold" style={{ color: '#f1c40f' }}>{totalScore} pts</span>
          </div>
        </div>

        {/* Timer bar */}
        <div className="mb-4">
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${timerPct}%`,
                background: timer > 30 ? '#2ecc71' : timer > 15 ? '#f39c12' : '#e74c3c'
              }}
            />
          </div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Clock className="w-3 h-3" style={{ color: timer <= 10 ? '#e74c3c' : 'var(--mu)' }} />
            <span className="text-xs font-bold" style={{ color: timer <= 10 ? '#e74c3c' : 'var(--mu)' }}>{timer}s</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center mb-4">
          <h3 className="text-sm font-bold mb-1">Arrange earliest to latest</h3>
          <p className="text-[10px]" style={{ color: 'var(--mu)' }}>Tap an event to select it, then tap another to swap positions</p>
        </div>

        {/* Direction indicator */}
        <div className="flex items-center justify-between mb-2 px-2">
          <span className="text-[10px] font-bold uppercase" style={{ color: '#2ecc71' }}>Earliest</span>
          <div className="flex-1 mx-3 h-px" style={{ background: 'linear-gradient(90deg, #2ecc71, #e74c3c)' }} />
          <span className="text-[10px] font-bold uppercase" style={{ color: '#e74c3c' }}>Latest</span>
        </div>

        {/* Event list */}
        <div className="flex-1 space-y-2 mb-4">
          {order.map((evt, idx) => {
            const isSelected = selectedIdx === idx
            return (
              <button
                key={`${evt.year}-${idx}`}
                onClick={() => handleItemClick(idx)}
                className="w-full p-4 rounded-xl text-left transition-all duration-200 flex items-center gap-3"
                style={{
                  background: isSelected ? 'rgba(52,152,219,.2)' : 'rgba(255,255,255,.05)',
                  border: `2px solid ${isSelected ? '#3498db' : 'rgba(255,255,255,.08)'}`,
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected ? '0 4px 20px rgba(52,152,219,.2)' : 'none'
                }}
              >
                <span className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: isSelected ? 'rgba(52,152,219,.3)' : 'rgba(255,255,255,.08)', color: isSelected ? '#3498db' : 'var(--mu)' }}>
                  {idx + 1}
                </span>
                <span className="text-sm font-medium flex-1" style={{ color: isSelected ? '#3498db' : '#f0f0f0' }}>{evt.name}</span>
              </button>
            )
          })}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          {selectedIdx !== null && (
            <>
              <button
                onClick={() => moveItem(-1)}
                disabled={selectedIdx === 0}
                className="btnG flex-1 flex items-center justify-center gap-1 py-2"
                style={{ opacity: selectedIdx === 0 ? 0.3 : 1 }}
              >
                <ArrowUp className="w-4 h-4" /> Move Up
              </button>
              <button
                onClick={() => moveItem(1)}
                disabled={selectedIdx === order.length - 1}
                className="btnG flex-1 flex items-center justify-center gap-1 py-2"
                style={{ opacity: selectedIdx === order.length - 1 ? 0.3 : 1 }}
              >
                <ArrowDown className="w-4 h-4" /> Move Down
              </button>
            </>
          )}
          <button
            onClick={() => handleSubmit(false)}
            className="btnP flex-1 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #2ecc71, #27ae60)' }}
          >
            <Check className="w-4 h-4" /> Lock In
          </button>
        </div>
      </div>
    </div>
  )
}
