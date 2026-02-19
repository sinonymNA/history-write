import { useState, useCallback } from 'react'
import { useGame } from '../../context/GameContext'
import { ArrowLeft, Search, BookOpen, Trophy, ChevronRight, RotateCcw, CheckCircle, XCircle } from 'lucide-react'

/* 6 primary source cases for POV analysis */
const SOURCE_CASES = [
  {
    text: '"The natives are so naive and generous with their possessions that no one who has not witnessed them would believe it. When you ask for something they have, they never say no. To the contrary, they offer to share with anyone."',
    author: 'Christopher Columbus',
    date: '1493',
    context: 'Letter to King Ferdinand and Queen Isabella of Spain after his first voyage to the Americas.',
    correctPOV: 'Columbus portrays the indigenous people as naive and generous to justify further colonization and to impress his royal sponsors, framing the encounter to encourage continued funding.',
    options: [
      'Columbus portrays the indigenous people as naive and generous to justify further colonization and to impress his royal sponsors, framing the encounter to encourage continued funding.',
      'Columbus is providing a neutral anthropological observation of indigenous culture with no ulterior motive.',
      'Columbus is warning the Spanish monarchs that the natives are dangerous and must be subdued by force.',
      'Columbus is expressing his personal religious conversion after encountering indigenous spiritual practices.'
    ],
    correctIndex: 0
  },
  {
    text: '"The condition of the working man is absolutely intolerable. He is compelled to work in poorly ventilated rooms from early morning until late at night, his wages are barely enough to keep body and soul together."',
    author: 'Friedrich Engels',
    date: '1845',
    context: 'From "The Condition of the Working Class in England," written after Engels visited Manchester factory districts.',
    correctPOV: 'Engels, a socialist thinker, emphasizes the worst conditions to build a case against industrial capitalism and advocate for workers\' revolution.',
    options: [
      'Engels is celebrating the efficiency of the factory system and encouraging more workers to seek factory employment.',
      'Engels, a socialist thinker, emphasizes the worst conditions to build a case against industrial capitalism and advocate for workers\' revolution.',
      'Engels is writing as a factory owner defending his labor practices to Parliament.',
      'Engels is providing a neutral government report on factory conditions with no political agenda.'
    ],
    correctIndex: 1
  },
  {
    text: '"We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness."',
    author: 'Thomas Jefferson',
    date: '1776',
    context: 'From the Declaration of Independence, drafted to justify American independence from Britain to a global audience.',
    correctPOV: 'Jefferson invokes universal natural rights to legitimize colonial rebellion, though as a slaveholder, his definition of "all men" was limited by the social norms of his era.',
    options: [
      'Jefferson is proposing the immediate abolition of slavery throughout the American colonies.',
      'Jefferson is writing a personal diary entry reflecting on his philosophical beliefs with no political purpose.',
      'Jefferson invokes universal natural rights to legitimize colonial rebellion, though as a slaveholder, his definition of "all men" was limited by the social norms of his era.',
      'Jefferson is defending the British monarchy and arguing that the colonies should remain loyal to King George III.'
    ],
    correctIndex: 2
  },
  {
    text: '"We, men and women of Africa, conscious of the injustices of colonialism, hereby affirm that the lands of Africa belong to the peoples of Africa. We demand the immediate and unconditional end of colonial rule."',
    author: 'Kwame Nkrumah',
    date: '1958',
    context: 'Speech at the All-African Peoples\' Conference in Accra, Ghana, attended by independence movement leaders from across Africa.',
    correctPOV: 'Nkrumah, as leader of the first sub-Saharan African nation to gain independence, uses Pan-African rhetoric to rally diverse independence movements under a unified anti-colonial cause.',
    options: [
      'Nkrumah is requesting gradual reform within the existing colonial system rather than demanding independence.',
      'Nkrumah is speaking on behalf of European colonial powers to justify their continued presence in Africa.',
      'Nkrumah is writing a scholarly historical analysis of colonialism with no political intent.',
      'Nkrumah, as leader of the first sub-Saharan African nation to gain independence, uses Pan-African rhetoric to rally diverse independence movements under a unified anti-colonial cause.'
    ],
    correctIndex: 3
  },
  {
    text: '"The Great Wall stretches for thousands of li, yet it could not keep out the barbarians. The strength of a nation lies not in its walls but in the virtue of its people."',
    author: 'Sima Qian',
    date: 'c. 94 BCE',
    context: 'From "Records of the Grand Historian," the foundational Chinese historical text, written during the Han Dynasty.',
    correctPOV: 'Sima Qian, writing as the imperial court historian, uses the Great Wall as a metaphor to critique reliance on military force alone, subtly advising the Han emperor to invest in virtuous governance.',
    options: [
      'Sima Qian is advocating for the construction of even larger defensive walls along all Chinese borders.',
      'Sima Qian, writing as the imperial court historian, uses the Great Wall as a metaphor to critique reliance on military force alone, subtly advising the Han emperor to invest in virtuous governance.',
      'Sima Qian is a foreign traveler providing an outsider perspective on Chinese military weakness.',
      'Sima Qian is writing propaganda to encourage the Mongol invasion of China.'
    ],
    correctIndex: 1
  },
  {
    text: '"I have walked across the face of the earth and found that Muslims everywhere follow the same law and the same customs. A traveler in our lands finds brothers wherever he goes."',
    author: 'Ibn Battuta',
    date: 'c. 1355',
    context: 'From the Rihla (travel account), dictated to a scholar in Morocco after 30 years of travel across the Dar al-Islam.',
    correctPOV: 'Ibn Battuta, a devout Muslim legal scholar, emphasizes Islamic unity across regions to celebrate the global reach of Islamic civilization, though he tends to downplay local variations and conflicts.',
    options: [
      'Ibn Battuta is writing a military intelligence report on the weaknesses of Islamic kingdoms for a foreign power.',
      'Ibn Battuta is arguing that Islamic civilization is in decline and needs reform.',
      'Ibn Battuta is providing an unbiased and complete account of every culture he encountered, including non-Muslim societies.',
      'Ibn Battuta, a devout Muslim legal scholar, emphasizes Islamic unity across regions to celebrate the global reach of Islamic civilization, though he tends to downplay local variations and conflicts.'
    ],
    correctIndex: 3
  }
]

const TOTAL_CASES = SOURCE_CASES.length

export default function SourceDetective() {
  const { addXP } = useGame()

  /* Game phases: idle, playing, result */
  const [phase, setPhase] = useState('idle')
  const [caseIdx, setCaseIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [selected, setSelected] = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [answerLog, setAnswerLog] = useState([])

  const startGame = useCallback(() => {
    setCaseIdx(0)
    setScore(0)
    setCorrect(0)
    setSelected(null)
    setShowFeedback(false)
    setAnswerLog([])
    setPhase('playing')
  }, [])

  const currentCase = SOURCE_CASES[caseIdx] || SOURCE_CASES[0]

  const handleAnswer = (optIdx) => {
    if (showFeedback || selected !== null) return
    setSelected(optIdx)
    setShowFeedback(true)

    const isCorrect = optIdx === currentCase.correctIndex
    if (isCorrect) {
      const pts = 150
      setScore(prev => prev + pts)
      setCorrect(prev => prev + 1)
      setAnswerLog(prev => [...prev, { case: caseIdx, correct: true, points: pts }])
    } else {
      setAnswerLog(prev => [...prev, { case: caseIdx, correct: false, points: 0 }])
    }
  }

  const nextCase = () => {
    if (caseIdx + 1 >= TOTAL_CASES) {
      addXP(Math.round(score / 10))
      setPhase('result')
    } else {
      setCaseIdx(prev => prev + 1)
      setSelected(null)
      setShowFeedback(false)
    }
  }

  const progressPct = ((caseIdx + (showFeedback ? 1 : 0)) / TOTAL_CASES) * 100

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
            <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #9b59b6, #3498db)', boxShadow: '0 8px 32px rgba(155,89,182,.3)' }}>
              <Search className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#9b59b6' }}>Source Detective</h1>
            <p className="text-sm mb-1" style={{ color: 'var(--mu)' }}>Analyze primary sources like a historian</p>
            <p className="text-xs mb-6" style={{ color: 'var(--fa)' }}>Read each source carefully, then identify the correct point of view interpretation.</p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="hcard px-4 py-3 text-center" style={{ background: 'rgba(255,255,255,.05)' }}>
                <div className="text-lg font-bold" style={{ color: '#9b59b6' }}>{TOTAL_CASES}</div>
                <div className="text-[10px]" style={{ color: 'var(--mu)' }}>Sources</div>
              </div>
              <div className="hcard px-4 py-3 text-center" style={{ background: 'rgba(255,255,255,.05)' }}>
                <div className="text-lg font-bold" style={{ color: '#3498db' }}>POV</div>
                <div className="text-[10px]" style={{ color: 'var(--mu)' }}>Analysis</div>
              </div>
              <div className="hcard px-4 py-3 text-center" style={{ background: 'rgba(255,255,255,.05)' }}>
                <div className="text-lg font-bold" style={{ color: '#2ecc71' }}>150</div>
                <div className="text-[10px]" style={{ color: 'var(--mu)' }}>Pts Each</div>
              </div>
            </div>

            <button onClick={startGame} className="btnP text-base px-8 py-3" style={{ background: 'linear-gradient(135deg, #9b59b6, #8e44ad)', fontSize: '16px' }}>
              <Search className="w-4 h-4 inline mr-2" />Start Investigating
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ========== RESULT SCREEN ========== */
  if (phase === 'result') {
    const accuracy = Math.round((correct / TOTAL_CASES) * 100)
    const grade = accuracy >= 90 ? 'S' : accuracy >= 80 ? 'A' : accuracy >= 65 ? 'B' : accuracy >= 50 ? 'C' : 'D'
    const gradeColor = accuracy >= 90 ? '#f1c40f' : accuracy >= 80 ? '#2ecc71' : accuracy >= 65 ? '#3498db' : accuracy >= 50 ? '#e67e22' : '#e74c3c'

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
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#9b59b6' }}>Investigation Complete!</h2>
            <p className="text-sm" style={{ color: 'var(--mu)' }}>Your source analysis results</p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black" style={{ border: `4px solid ${gradeColor}`, color: gradeColor, background: 'rgba(0,0,0,.3)' }}>
              {grade}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="hcard p-4 text-center" style={{ background: 'rgba(255,255,255,.05)' }}>
              <div className="text-2xl font-bold" style={{ color: '#f1c40f' }}>{score}</div>
              <div className="text-[10px]" style={{ color: 'var(--mu)' }}>Total Score</div>
            </div>
            <div className="hcard p-4 text-center" style={{ background: 'rgba(255,255,255,.05)' }}>
              <div className="text-2xl font-bold" style={{ color: '#2ecc71' }}>{correct}/{TOTAL_CASES}</div>
              <div className="text-[10px]" style={{ color: 'var(--mu)' }}>Correct</div>
            </div>
            <div className="hcard p-4 text-center" style={{ background: 'rgba(255,255,255,.05)' }}>
              <div className="text-2xl font-bold" style={{ color: '#3498db' }}>{accuracy}%</div>
              <div className="text-[10px]" style={{ color: 'var(--mu)' }}>Accuracy</div>
            </div>
          </div>

          {/* Case-by-case summary */}
          <div className="hcard p-4 mb-6" style={{ background: 'rgba(255,255,255,.05)' }}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--fa)' }}>Case Summary</h4>
            <div className="space-y-2">
              {answerLog.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,.03)' }}>
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: entry.correct ? 'rgba(46,204,113,.2)' : 'rgba(231,76,60,.2)' }}>
                    {entry.correct
                      ? <CheckCircle className="w-3.5 h-3.5" style={{ color: '#2ecc71' }} />
                      : <XCircle className="w-3.5 h-3.5" style={{ color: '#e74c3c' }} />
                    }
                  </div>
                  <span className="text-xs flex-1" style={{ color: 'var(--mu)' }}>{SOURCE_CASES[i].author} ({SOURCE_CASES[i].date})</span>
                  <span className="text-xs font-bold" style={{ color: entry.correct ? '#2ecc71' : '#e74c3c' }}>
                    {entry.correct ? '+150' : '0'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={startGame} className="btnP flex-1 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #9b59b6, #8e44ad)' }}>
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

        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setPhase('idle')}
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--mu)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Quit
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--fa)' }}>Case {caseIdx + 1}/{TOTAL_CASES}</span>
            <span className="text-sm font-bold" style={{ color: '#f1c40f' }}>{score} pts</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.1)' }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #9b59b6, #3498db)' }} />
          </div>
        </div>

        {/* Source card */}
        <div className="hcard p-5 mb-4" style={{ background: 'rgba(155,89,182,.08)', border: '1px solid rgba(155,89,182,.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4" style={{ color: '#9b59b6' }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9b59b6' }}>Primary Source</span>
          </div>

          {/* Source text */}
          <blockquote className="text-sm leading-relaxed mb-4 pl-3" style={{ borderLeft: '3px solid rgba(155,89,182,.4)', color: '#f0f0f0', fontStyle: 'italic' }}>
            {currentCase.text}
          </blockquote>

          {/* Source metadata */}
          <div className="space-y-1">
            <div className="flex gap-2 text-xs">
              <span className="font-bold" style={{ color: 'var(--fa)' }}>Author:</span>
              <span style={{ color: 'var(--mu)' }}>{currentCase.author}</span>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="font-bold" style={{ color: 'var(--fa)' }}>Date:</span>
              <span style={{ color: 'var(--mu)' }}>{currentCase.date}</span>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="font-bold" style={{ color: 'var(--fa)' }}>Context:</span>
              <span style={{ color: 'var(--mu)' }}>{currentCase.context}</span>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="mb-3">
          <h3 className="text-sm font-bold mb-1">What is the author's point of view?</h3>
          <p className="text-[10px]" style={{ color: 'var(--mu)' }}>Select the best interpretation of how the author's identity and purpose shape this source.</p>
        </div>

        {/* Answer options */}
        <div className="space-y-3 flex-1">
          {currentCase.options.map((opt, idx) => {
            const isCorrectOpt = idx === currentCase.correctIndex
            const isSelected = selected === idx

            let optBg = 'rgba(255,255,255,.05)'
            let optBorder = 'rgba(255,255,255,.08)'
            let optColor = '#f0f0f0'

            if (showFeedback) {
              if (isCorrectOpt) {
                optBg = 'rgba(46,204,113,.15)'
                optBorder = '#2ecc71'
                optColor = '#2ecc71'
              } else if (isSelected && !isCorrectOpt) {
                optBg = 'rgba(231,76,60,.15)'
                optBorder = '#e74c3c'
                optColor = '#e74c3c'
              } else {
                optBg = 'rgba(255,255,255,.02)'
                optBorder = 'rgba(255,255,255,.04)'
                optColor = 'rgba(255,255,255,.3)'
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={showFeedback}
                className="w-full p-4 rounded-xl text-left transition-all duration-200"
                style={{
                  background: optBg,
                  border: `2px solid ${optBorder}`,
                  color: optColor,
                  cursor: showFeedback ? 'default' : 'pointer',
                  opacity: showFeedback && !isCorrectOpt && !isSelected ? 0.35 : 1
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5" style={{ background: showFeedback && isCorrectOpt ? 'rgba(46,204,113,.25)' : 'rgba(255,255,255,.08)', color: showFeedback && isCorrectOpt ? '#2ecc71' : 'var(--mu)' }}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-xs leading-relaxed">{opt}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div className="mt-4">
            <div className="hcard p-4 mb-3" style={{ background: selected === currentCase.correctIndex ? 'rgba(46,204,113,.1)' : 'rgba(231,76,60,.1)', border: `1px solid ${selected === currentCase.correctIndex ? 'rgba(46,204,113,.2)' : 'rgba(231,76,60,.2)'}` }}>
              <div className="flex items-center gap-2 mb-2">
                {selected === currentCase.correctIndex
                  ? <CheckCircle className="w-4 h-4" style={{ color: '#2ecc71' }} />
                  : <XCircle className="w-4 h-4" style={{ color: '#e74c3c' }} />
                }
                <span className="text-sm font-bold" style={{ color: selected === currentCase.correctIndex ? '#2ecc71' : '#e74c3c' }}>
                  {selected === currentCase.correctIndex ? 'Correct! +150 pts' : 'Not quite!'}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--mu)' }}>
                {currentCase.correctPOV}
              </p>
            </div>
            <button
              onClick={nextCase}
              className="btnP w-full flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #9b59b6, #8e44ad)' }}
            >
              {caseIdx + 1 >= TOTAL_CASES ? 'See Results' : 'Next Source'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
