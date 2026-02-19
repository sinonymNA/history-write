import { useState, useEffect, useCallback, useRef } from 'react'
import { useGame } from '../../context/GameContext'
import { BB_QUESTIONS } from '../../lib/constants'
import { ArrowLeft, Zap, Trophy, Target, Clock, ChevronRight, RotateCcw } from 'lucide-react'

/* Shuffle helper */
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const TOTAL_QUESTIONS = 20
const TIME_PER_QUESTION = 15
const CHOICE_LABELS = ['A', 'B', 'C', 'D']
const CHOICE_COLORS = ['#3498db', '#e67e22', '#2ecc71', '#e74c3c']

export default function BlockBlast() {
  const { addXP } = useGame()

  /* Game phases: idle, playing, result */
  const [phase, setPhase] = useState('idle')
  const [questions, setQuestions] = useState([])
  const [qIndex, setQIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [timer, setTimer] = useState(TIME_PER_QUESTION)
  const [selected, setSelected] = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [answerLog, setAnswerLog] = useState([])
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  /* Build a set of 20 questions (with shuffle + repeat if needed) */
  const startGame = useCallback(() => {
    let pool = shuffle(BB_QUESTIONS)
    while (pool.length < TOTAL_QUESTIONS) {
      pool = pool.concat(shuffle(BB_QUESTIONS))
    }
    setQuestions(pool.slice(0, TOTAL_QUESTIONS))
    setQIndex(0)
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setCorrect(0)
    setSelected(null)
    setShowFeedback(false)
    setAnswerLog([])
    setTimer(TIME_PER_QUESTION)
    setPhase('playing')
    startTimeRef.current = Date.now()
  }, [])

  /* Streak multiplier */
  const getMultiplier = (s) => {
    if (s >= 10) return 3
    if (s >= 5) return 2
    if (s >= 3) return 1.5
    return 1
  }

  /* Timer countdown */
  useEffect(() => {
    if (phase !== 'playing' || showFeedback) return
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qIndex, showFeedback])

  /* Time runs out */
  const handleTimeout = () => {
    setSelected(-1)
    setShowFeedback(true)
    setStreak(0)
    setAnswerLog(prev => [...prev, { q: qIndex, correct: false, timed_out: true }])
  }

  /* Player picks an answer */
  const handleAnswer = (choiceIdx) => {
    if (showFeedback || selected !== null) return
    clearInterval(timerRef.current)

    const q = questions[qIndex]
    const isCorrect = choiceIdx === q.a
    const elapsed = TIME_PER_QUESTION - timer
    const speedBonus = Math.max(0, Math.round((TIME_PER_QUESTION - elapsed) * 5))

    setSelected(choiceIdx)
    setShowFeedback(true)

    if (isCorrect) {
      const newStreak = streak + 1
      const mult = getMultiplier(newStreak)
      const points = Math.round((100 + speedBonus) * mult)
      setScore(prev => prev + points)
      setStreak(newStreak)
      setBestStreak(prev => Math.max(prev, newStreak))
      setCorrect(prev => prev + 1)
      setAnswerLog(prev => [...prev, { q: qIndex, correct: true, points, speed: elapsed }])
    } else {
      setStreak(0)
      setAnswerLog(prev => [...prev, { q: qIndex, correct: false, speed: elapsed }])
    }
  }

  /* Advance to next question or results */
  const nextQuestion = () => {
    if (qIndex + 1 >= TOTAL_QUESTIONS) {
      addXP(Math.round(score / 10))
      setPhase('result')
    } else {
      setQIndex(prev => prev + 1)
      setSelected(null)
      setShowFeedback(false)
      setTimer(TIME_PER_QUESTION)
      startTimeRef.current = Date.now()
    }
  }

  /* Current question data */
  const currentQ = questions[qIndex] || {}
  const progressPct = phase === 'playing' ? ((qIndex + (showFeedback ? 1 : 0)) / TOTAL_QUESTIONS) * 100 : 0
  const timerPct = (timer / TIME_PER_QUESTION) * 100
  const mult = getMultiplier(streak)

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
            <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #e74c3c, #f39c12)', boxShadow: '0 8px 32px rgba(231,76,60,.3)' }}>
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#f1c40f' }}>Block Blast</h1>
            <p className="text-sm mb-1" style={{ color: 'var(--mu)' }}>20 AP World History questions</p>
            <p className="text-xs mb-6" style={{ color: 'var(--fa)' }}>Answer fast for bonus points. Build streaks for multipliers!</p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="hcard px-4 py-3 text-center" style={{ background: 'rgba(255,255,255,.05)' }}>
                <div className="text-lg font-bold" style={{ color: '#3498db' }}>15s</div>
                <div className="text-[10px]" style={{ color: 'var(--mu)' }}>Per Question</div>
              </div>
              <div className="hcard px-4 py-3 text-center" style={{ background: 'rgba(255,255,255,.05)' }}>
                <div className="text-lg font-bold" style={{ color: '#2ecc71' }}>3x</div>
                <div className="text-[10px]" style={{ color: 'var(--mu)' }}>Max Multiplier</div>
              </div>
              <div className="hcard px-4 py-3 text-center" style={{ background: 'rgba(255,255,255,.05)' }}>
                <div className="text-lg font-bold" style={{ color: '#e67e22' }}>Speed</div>
                <div className="text-[10px]" style={{ color: 'var(--mu)' }}>Bonus Points</div>
              </div>
            </div>

            <button onClick={startGame} className="btnP text-base px-8 py-3" style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)', fontSize: '16px' }}>
              <Zap className="w-4 h-4 inline mr-2" />Start Game
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ========== RESULTS SCREEN ========== */
  if (phase === 'result') {
    const accuracy = Math.round((correct / TOTAL_QUESTIONS) * 100)
    const grade = accuracy >= 90 ? 'S' : accuracy >= 80 ? 'A' : accuracy >= 70 ? 'B' : accuracy >= 60 ? 'C' : 'D'
    const gradeColor = accuracy >= 90 ? '#f1c40f' : accuracy >= 80 ? '#2ecc71' : accuracy >= 70 ? '#3498db' : accuracy >= 60 ? '#e67e22' : '#e74c3c'

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
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#f1c40f' }}>Game Over!</h2>
            <p className="text-sm" style={{ color: 'var(--mu)' }}>Here are your results</p>
          </div>

          {/* Grade display */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black" style={{ border: `4px solid ${gradeColor}`, color: gradeColor, background: 'rgba(0,0,0,.3)' }}>
              {grade}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="hcard p-4 text-center" style={{ background: 'rgba(255,255,255,.05)' }}>
              <div className="text-2xl font-bold" style={{ color: '#f1c40f' }}>{score}</div>
              <div className="text-[10px]" style={{ color: 'var(--mu)' }}>Total Score</div>
            </div>
            <div className="hcard p-4 text-center" style={{ background: 'rgba(255,255,255,.05)' }}>
              <div className="text-2xl font-bold" style={{ color: '#2ecc71' }}>{correct}/{TOTAL_QUESTIONS}</div>
              <div className="text-[10px]" style={{ color: 'var(--mu)' }}>Correct</div>
            </div>
            <div className="hcard p-4 text-center" style={{ background: 'rgba(255,255,255,.05)' }}>
              <div className="text-2xl font-bold" style={{ color: '#3498db' }}>{accuracy}%</div>
              <div className="text-[10px]" style={{ color: 'var(--mu)' }}>Accuracy</div>
            </div>
            <div className="hcard p-4 text-center" style={{ background: 'rgba(255,255,255,.05)' }}>
              <div className="text-2xl font-bold" style={{ color: '#e67e22' }}>{bestStreak}</div>
              <div className="text-[10px]" style={{ color: 'var(--mu)' }}>Best Streak</div>
            </div>
          </div>

          {/* Answer log */}
          <div className="hcard p-4 mb-6" style={{ background: 'rgba(255,255,255,.05)' }}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--fa)' }}>Answer Summary</h4>
            <div className="flex flex-wrap gap-1.5">
              {answerLog.map((entry, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: entry.correct ? 'rgba(46,204,113,.2)' : 'rgba(231,76,60,.2)',
                    color: entry.correct ? '#2ecc71' : '#e74c3c',
                    border: `1px solid ${entry.correct ? 'rgba(46,204,113,.3)' : 'rgba(231,76,60,.3)'}`
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={startGame} className="btnP flex-1 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}>
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

  /* ========== PLAYING SCREEN ========== */
  return (
    <div className="arcP min-h-screen flex flex-col">
      <div className="max-w-2xl mx-auto px-4 py-4 w-full flex-1 flex flex-col">

        {/* Top bar: back, score, streak */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => { clearInterval(timerRef.current); setPhase('idle') }}
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--mu)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Quit
          </button>
          <div className="flex items-center gap-3">
            {streak >= 3 && (
              <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(241,196,15,.15)', color: '#f1c40f' }}>
                <Zap className="w-3 h-3" /> {mult}x
              </div>
            )}
            <div className="text-sm font-bold" style={{ color: '#f1c40f' }}>
              {score} pts
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--fa)' }}>
            <span>Question {qIndex + 1} of {TOTAL_QUESTIONS}</span>
            <span>{currentQ.cat}</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.1)' }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #e74c3c, #f39c12)' }} />
          </div>
        </div>

        {/* Timer bar */}
        <div className="mb-4">
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${timerPct}%`,
                background: timer > 10 ? '#2ecc71' : timer > 5 ? '#f39c12' : '#e74c3c'
              }}
            />
          </div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Clock className="w-3 h-3" style={{ color: timer <= 5 ? '#e74c3c' : 'var(--mu)' }} />
            <span className="text-xs font-bold" style={{ color: timer <= 5 ? '#e74c3c' : 'var(--mu)' }}>{timer}s</span>
          </div>
        </div>

        {/* Streak indicator */}
        {streak > 0 && (
          <div className="flex items-center justify-center gap-1 mb-3">
            {Array.from({ length: Math.min(streak, 10) }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full" style={{ background: i < 3 ? '#f39c12' : i < 5 ? '#e67e22' : '#e74c3c' }} />
            ))}
            <span className="text-[10px] ml-1 font-bold" style={{ color: '#f39c12' }}>{streak} streak</span>
          </div>
        )}

        {/* Question */}
        <div className="hcard p-5 mb-4" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}>
          <p className="text-sm font-semibold leading-relaxed" style={{ color: '#f0f0f0' }}>{currentQ.q}</p>
        </div>

        {/* Answer choices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
          {(currentQ.c || []).map((choice, idx) => {
            const isCorrectAnswer = idx === currentQ.a
            const isSelected = selected === idx
            let btnBg = `${CHOICE_COLORS[idx]}22`
            let btnBorder = `${CHOICE_COLORS[idx]}44`
            let btnColor = CHOICE_COLORS[idx]

            if (showFeedback) {
              if (isCorrectAnswer) {
                btnBg = 'rgba(46,204,113,.25)'
                btnBorder = '#2ecc71'
                btnColor = '#2ecc71'
              } else if (isSelected && !isCorrectAnswer) {
                btnBg = 'rgba(231,76,60,.25)'
                btnBorder = '#e74c3c'
                btnColor = '#e74c3c'
              } else {
                btnBg = 'rgba(255,255,255,.02)'
                btnBorder = 'rgba(255,255,255,.06)'
                btnColor = 'rgba(255,255,255,.25)'
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={showFeedback}
                className="p-4 rounded-xl text-left transition-all duration-200 flex items-start gap-3"
                style={{
                  background: btnBg,
                  border: `2px solid ${btnBorder}`,
                  color: btnColor,
                  cursor: showFeedback ? 'default' : 'pointer',
                  opacity: showFeedback && !isCorrectAnswer && !isSelected ? 0.4 : 1
                }}
              >
                <span className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-black" style={{ background: `${CHOICE_COLORS[idx]}33`, color: btnColor }}>
                  {CHOICE_LABELS[idx]}
                </span>
                <span className="text-sm font-medium leading-snug pt-0.5">{choice}</span>
              </button>
            )
          })}
        </div>

        {/* Feedback + next */}
        {showFeedback && (
          <div className="mt-4">
            <div className="text-center mb-3">
              {selected === currentQ.a ? (
                <div className="text-sm font-bold" style={{ color: '#2ecc71' }}>
                  Correct! +{answerLog[answerLog.length - 1]?.points || 0} pts
                </div>
              ) : (
                <div className="text-sm font-bold" style={{ color: '#e74c3c' }}>
                  {selected === -1 ? "Time's up!" : 'Incorrect!'} The answer was {CHOICE_LABELS[currentQ.a]}
                </div>
              )}
            </div>
            <button
              onClick={nextQuestion}
              className="btnP w-full flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}
            >
              {qIndex + 1 >= TOTAL_QUESTIONS ? 'See Results' : 'Next Question'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
