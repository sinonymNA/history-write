import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useGame } from '../../context/GameContext'
import { STORY_LESSONS } from '../../lib/constants'
import { ChevronLeft, ChevronRight, CheckCircle, BookOpen, Award, ArrowLeft, Send, RefreshCw } from 'lucide-react'

const XP_PER_CHAPTER = 25

function extractKeywords(keyConcept) {
  if (!keyConcept) return []
  return keyConcept
    .split(/[,.]/)
    .map(s => s.trim().toLowerCase())
    .flatMap(phrase => phrase.split(/\s+/))
    .filter(w => w.length > 4)
    .filter((w, i, arr) => arr.indexOf(w) === i)
}

function checkAnswer(answer, keyConcept) {
  if (!answer || !keyConcept) return false
  const keywords = extractKeywords(keyConcept)
  const lower = answer.toLowerCase()
  const matched = keywords.filter(kw => lower.includes(kw))
  return matched.length >= 2
}

export default function StoryLesson({ storyId: propStoryId }) {
  const { user, userData } = useAuth()
  const { addXP } = useGame()

  const storyId = propStoryId || sessionStorage.getItem('currentStoryId') || ''
  const story = STORY_LESSONS[storyId]

  const userId = user?.uid || 'anon'
  const isTeacher = userData?.role === 'teacher'
  const storageKey = `story_${storyId}_${userId}`

  // Load saved progress from localStorage
  const loadProgress = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved)
    } catch (e) { /* ignore */ }
    return {}
  }, [storageKey])

  const [completedChapters, setCompletedChapters] = useState(() => loadProgress())
  const [currentIdx, setCurrentIdx] = useState(() => {
    if (!story) return 0
    const saved = loadProgress()
    const firstIncomplete = story.chapters.findIndex((_, i) => !saved[i])
    return firstIncomplete === -1 ? story.chapters.length - 1 : firstIncomplete
  })
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null) // null | 'pass' | 'fail'
  const [showHint, setShowHint] = useState(false)
  const [allDone, setAllDone] = useState(false)
  const [xpAwarded, setXpAwarded] = useState(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_xp`)
      if (saved) return JSON.parse(saved)
    } catch (e) { /* ignore */ }
    return {}
  })

  const advanceTimer = useRef(null)
  const textareaRef = useRef(null)

  // Persist progress
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(completedChapters))
  }, [completedChapters, storageKey])

  // Persist XP tracking
  useEffect(() => {
    localStorage.setItem(`${storageKey}_xp`, JSON.stringify(xpAwarded))
  }, [xpAwarded, storageKey])

  // Check if all chapters complete
  useEffect(() => {
    if (!story) return
    const done = story.chapters.every((_, i) => completedChapters[i])
    setAllDone(done)
  }, [completedChapters, story])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
    }
  }, [])

  // Reset feedback state when changing chapters
  useEffect(() => {
    setAnswer('')
    setFeedback(null)
    setShowHint(false)
  }, [currentIdx])

  if (!story) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center pageEnter">
        <div className="hcard p-8">
          <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--mu)' }} />
          <h2 className="text-xl font-bold fs mb-2">Story Not Found</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--mu)' }}>
            Could not find story data for "{storyId}".
          </p>
          <button
            className="btnP text-sm"
            onClick={() => window.location.hash = isTeacher ? '#library' : '#student-dash'}
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const chapters = story.chapters
  const chapter = chapters[currentIdx]
  const totalChapters = chapters.length
  const isCurrentComplete = !!completedChapters[currentIdx]

  const handleBack = () => {
    window.location.hash = isTeacher ? '#library' : '#student-dash'
  }

  const goToPrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1)
    }
  }

  const goToNext = () => {
    if (currentIdx < totalChapters - 1 && isCurrentComplete) {
      setCurrentIdx(currentIdx + 1)
    }
  }

  const markComplete = (idx) => {
    setCompletedChapters(prev => {
      const next = { ...prev, [idx]: true }
      return next
    })
    // Award XP if not already awarded for this chapter
    if (!xpAwarded[idx]) {
      addXP(XP_PER_CHAPTER)
      setXpAwarded(prev => ({ ...prev, [idx]: true }))
    }
  }

  const handleCheckAnswer = () => {
    if (!answer.trim()) return

    const passed = checkAnswer(answer, chapter.keyConcept)

    if (passed) {
      setFeedback('pass')
      markComplete(currentIdx)
      // Auto-advance after 1.2s
      if (currentIdx < totalChapters - 1) {
        advanceTimer.current = setTimeout(() => {
          setCurrentIdx(prev => prev + 1)
        }, 1200)
      }
    } else {
      setFeedback('fail')
      setShowHint(true)
    }
  }

  const handleRetry = () => {
    setFeedback(null)
    setAnswer('')
    if (textareaRef.current) textareaRef.current.focus()
  }

  const handlePipClick = (idx) => {
    // Allow navigating to completed chapters or the current one
    if (completedChapters[idx] || idx === currentIdx) {
      setCurrentIdx(idx)
    }
    // Also allow going to the next incomplete if previous is complete
    if (idx > 0 && completedChapters[idx - 1]) {
      setCurrentIdx(idx)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pageEnter" style={{ minHeight: 'calc(100vh - 56px)' }}>

      {/* Top bar: back button + unit badge */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleBack}
          className="btnG text-xs py-2 px-3 flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div
          className="text-[10px] font-bold fm uppercase px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--acs)', color: 'var(--ac)' }}
        >
          Unit {story.unit} &middot; {story.period}
        </div>
      </div>

      {/* Progress pips */}
      <div className="flex gap-1.5 mb-5" role="progressbar" aria-valuenow={currentIdx + 1} aria-valuemax={totalChapters}>
        {chapters.map((_, i) => (
          <button
            key={i}
            onClick={() => handlePipClick(i)}
            className="story-pip"
            title={`Chapter ${i + 1}${completedChapters[i] ? ' (complete)' : i === currentIdx ? ' (current)' : ''}`}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              border: 'none',
              cursor: completedChapters[i] || i === currentIdx || (i > 0 && completedChapters[i - 1]) ? 'pointer' : 'default',
              background: completedChapters[i]
                ? 'var(--sg)'
                : i === currentIdx
                  ? 'var(--ac)'
                  : 'var(--bd)',
              boxShadow: i === currentIdx ? '0 0 8px rgba(212,98,47,.3)' : 'none',
              transition: 'all .4s cubic-bezier(.16,1,.3,1)',
            }}
          />
        ))}
      </div>

      {/* All done banner */}
      {allDone && (
        <div
          className="mb-5 p-4 rounded-2xl text-center story-unlock"
          style={{
            background: 'linear-gradient(135deg, rgba(77,128,96,.12), rgba(196,149,40,.12))',
            border: '1px solid var(--sg)',
          }}
        >
          <div className="text-3xl mb-2">
            <Award className="w-8 h-8 mx-auto" style={{ color: 'var(--gd)' }} />
          </div>
          <h3 className="text-lg font-bold fs" style={{ color: 'var(--sg)' }}>Story Complete!</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--mu)' }}>
            You earned {totalChapters * XP_PER_CHAPTER} XP for finishing "{story.title}"
          </p>
        </div>
      )}

      {/* Scene header */}
      <div
        className="story-scene mb-6 story-unlock"
        style={{ background: chapter.bg || 'linear-gradient(135deg, #1a1a2e, #16213e)' }}
      >
        {chapter.icon && (
          <div className="story-icon text-4xl mb-2" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,.3))' }}>
            {chapter.icon}
          </div>
        )}
        <div
          className="story-chnum text-[10px] font-bold fm uppercase tracking-widest mb-1"
          style={{ color: 'rgba(255,255,255,.5)' }}
        >
          Chapter {currentIdx + 1}
        </div>
        <h2
          className="story-chtitle text-2xl md:text-3xl font-bold fs"
          style={{ color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,.4)' }}
        >
          {chapter.title}
        </h2>
        {chapter.date && (
          <div
            className="story-date text-xs fm mt-2"
            style={{ color: 'rgba(255,255,255,.6)' }}
          >
            {chapter.date}
          </div>
        )}
      </div>

      {/* Story body */}
      {chapter.text && (
        <div
          className="story-body mb-6 px-2"
          dangerouslySetInnerHTML={{ __html: chapter.text }}
        />
      )}

      {/* Optional chapter image */}
      {chapter.img && (
        <div className="story-img mb-6 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--bd)' }}>
          <img
            src={chapter.img}
            alt={chapter.title}
            className="w-full"
            style={{ display: 'block', maxHeight: 360, objectFit: 'cover' }}
            loading="lazy"
          />
        </div>
      )}

      {/* Optional blockquote */}
      {chapter.quote && (
        <blockquote
          className="story-quote mb-6 px-6 py-5 rounded-2xl fs"
          style={{
            background: 'var(--elev)',
            borderLeft: '4px solid var(--gd)',
            fontStyle: 'italic',
            fontSize: 16,
            lineHeight: 1.7,
            color: 'var(--tx)',
          }}
        >
          <p className="mb-2">"{chapter.quote.text}"</p>
          {chapter.quote.attr && (
            <footer className="text-xs fm" style={{ color: 'var(--mu)', fontStyle: 'normal' }}>
              {chapter.quote.attr}
            </footer>
          )}
        </blockquote>
      )}

      {/* Comprehension check */}
      {chapter.question && !isCurrentComplete && (
        <div
          className="mb-6 rounded-2xl overflow-hidden story-unlock"
          style={{ background: 'var(--card)', border: '1px solid var(--bd)' }}
        >
          {/* Narrator header */}
          <div className="story-narrator flex items-start gap-3 p-5" style={{ borderBottom: '1px solid var(--bd)' }}>
            <div
              className="story-narrator-avi w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'var(--acs)' }}
            >
              &#x1F9D1;&#x200D;&#x1F3EB;
            </div>
            <div className="story-narrator-bubble flex-1">
              <p className="text-xs font-bold mb-1" style={{ color: 'var(--ac)' }}>Before you continue...</p>
              <p className="text-sm" style={{ color: 'var(--tx)' }}>{chapter.question}</p>
            </div>
          </div>

          {/* Answer area */}
          <div className="p-5">
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="hinp mb-3"
              rows={4}
              style={{ resize: 'vertical', fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 15, lineHeight: 1.7 }}
              disabled={feedback === 'pass'}
            />

            {/* Feedback: pass */}
            {feedback === 'pass' && (
              <div
                className="story-check flex items-center gap-3 p-4 rounded-xl mb-3 scaleIn"
                style={{ background: 'rgba(77,128,96,.1)', border: '1px solid var(--sg)' }}
              >
                <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--sg)' }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--sg)' }}>Great understanding!</p>
                  <p className="text-xs" style={{ color: 'var(--mu)' }}>
                    Chapter complete &mdash; +{XP_PER_CHAPTER} XP{currentIdx < totalChapters - 1 ? '. Moving to next chapter...' : '!'}
                  </p>
                </div>
              </div>
            )}

            {/* Feedback: fail */}
            {feedback === 'fail' && (
              <div
                className="story-check p-4 rounded-xl mb-3 scaleIn"
                style={{ background: 'rgba(212,98,47,.06)', border: '1px solid var(--bd2)' }}
              >
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--ac)' }}>Not quite &mdash; try again!</p>
                {showHint && chapter.keyConcept && (
                  <div className="mt-2">
                    <p className="text-xs mb-1" style={{ color: 'var(--mu)' }}>
                      Hint: Make sure your answer touches on these key concepts:
                    </p>
                    <p className="text-xs fm" style={{ color: 'var(--gd)' }}>
                      {chapter.keyConcept}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              {feedback === 'fail' ? (
                <button onClick={handleRetry} className="btnG text-xs py-2 px-4 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Again
                </button>
              ) : feedback !== 'pass' ? (
                <button
                  onClick={handleCheckAnswer}
                  className="btnP text-xs py-2 px-4 flex items-center gap-1.5"
                  disabled={!answer.trim()}
                >
                  <Send className="w-3.5 h-3.5" />
                  Check My Understanding
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Already completed indicator */}
      {chapter.question && isCurrentComplete && (
        <div
          className="mb-6 flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(77,128,96,.06)', border: '1px solid rgba(77,128,96,.2)' }}
        >
          <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--sg)' }} />
          <p className="text-sm" style={{ color: 'var(--sg)' }}>Chapter complete</p>
        </div>
      )}

      {/* Navigation footer */}
      <div className="flex items-center justify-between mt-2 mb-8">
        <button
          onClick={goToPrev}
          className="btnG text-xs py-2 px-4 flex items-center gap-1.5"
          disabled={currentIdx === 0}
          style={currentIdx === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Previous
        </button>

        <span className="text-xs fm" style={{ color: 'var(--mu)' }}>
          {currentIdx + 1} / {totalChapters}
        </span>

        <button
          onClick={goToNext}
          className="btnP text-xs py-2 px-4 flex items-center gap-1.5"
          disabled={currentIdx === totalChapters - 1 || !isCurrentComplete}
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
