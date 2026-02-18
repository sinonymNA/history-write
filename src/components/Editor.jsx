import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft } from 'lucide-react'

export default function Editor({ assignment }) {
  const { user } = useAuth()

  // Default assignment for demo mode
  const a = assignment || {
    id: 'demo',
    type: 'LEQ',
    prompt: 'Evaluate the extent to which the Columbian Exchange affected the economies of Europe and the Americas in the period 1450–1750.',
    title: 'Demo Essay',
    demo: true,
    structure: { sources: [] }
  }

  const [essayText, setEssayText] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [saved, setSaved] = useState(true)

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem(`draft_${a.id}`)
    if (draft) {
      setEssayText(draft)
      setWordCount(draft.trim().split(/\s+/).filter(Boolean).length)
    }
  }, [a.id])

  // Auto-save draft
  const saveDraft = useCallback((text) => {
    localStorage.setItem(`draft_${a.id}`, text)
    setSaved(true)
  }, [a.id])

  useEffect(() => {
    if (!essayText) return
    setSaved(false)
    const timer = setTimeout(() => saveDraft(essayText), 1000)
    return () => clearTimeout(timer)
  }, [essayText, saveDraft])

  const handleInput = (e) => {
    const text = e.target.value
    setEssayText(text)
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length)
  }

  const handleSubmit = () => {
    if (!essayText.trim()) return
    // Store submission for results page
    const submission = {
      essayText,
      assignmentId: a.id,
      submittedAt: new Date().toISOString()
    }
    sessionStorage.setItem('lastSubmission', JSON.stringify(submission))
    sessionStorage.setItem('lastAssignment', JSON.stringify(a))
    window.location.hash = '#results'
  }

  const handleBack = () => {
    if (a.demo && !user) {
      window.location.hash = '#home'
    } else {
      window.location.hash = '#student-dash'
    }
  }

  const renderSource = (s, i) => {
    const isUrl = /^https?:\/\//i.test(s.content)
    const isImage = s.type === 'image' || s.type === 'map' || (isUrl && s.type === 'chart')

    return (
      <div key={i} className="p-3 rounded-lg mb-2" style={{ background: 'var(--elev)', border: '1px solid var(--bd)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`doc-badge doc-badge-${s.type}`}>{s.type}</span>
          <span className="text-xs font-bold" style={{ color: 'var(--ac)' }}>Doc {i + 1}: {s.label || s.title || ''}</span>
        </div>
        {isImage ? (
          <img src={s.content} alt={s.label || `Document ${i + 1}`} className="doc-img-preview" />
        ) : (
          <p className="text-xs leading-relaxed mt-1" style={{ color: 'var(--mu)', whiteSpace: 'pre-wrap' }}>{s.content}</p>
        )}
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-56px)] flex pageEnter">
      {/* Left panel — Prompt & Documents */}
      <div className="w-full md:w-[45%] overflow-y-auto p-6 md:p-8 csc slideLeft" style={{ background: 'var(--card)', borderRight: '1px solid var(--bd)' }}>
        <button onClick={handleBack} className="mb-5 text-sm flex items-center gap-1" style={{ color: 'var(--mu)' }}>
          <ArrowLeft className="w-4 h-4" />Exit
        </button>
        <span className="text-[10px] font-bold fm uppercase px-2 py-1 rounded" style={{ background: 'var(--acs)', color: 'var(--ac)' }}>{a.type}</span>
        <h2 className="text-xl font-bold fs mt-3">Prompt</h2>
        <div className="mt-3 p-4 rounded-xl fs text-sm leading-relaxed" style={{ background: 'var(--elev)', border: '1px solid var(--bd)' }}>
          {a.prompt}
        </div>
        {a.structure?.sources?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-bold mb-2">Documents</h3>
            {a.structure.sources.map((s, i) => renderSource(s, i))}
          </div>
        )}
      </div>

      {/* Right panel — Essay writing area */}
      <div className="w-full md:w-[55%] flex flex-col relative slideRight" style={{ background: 'var(--card)' }}>
        <div className="absolute top-4 right-4 z-10">
          <button onClick={handleSubmit} className="btnP shadow-lg text-sm py-2 px-6">Submit</button>
        </div>
        <textarea
          value={essayText}
          onChange={handleInput}
          className="flex-1 p-6 md:p-10 text-base md:text-lg resize-none focus:outline-none fs leading-relaxed"
          style={{ background: 'transparent', color: 'var(--tx)' }}
          placeholder="Start writing your response…"
        />
        <div className="px-6 pb-3 flex justify-between text-[11px]" style={{ color: 'var(--fa)' }}>
          <span>{wordCount} words</span>
          <span>{saved ? 'Auto-saved' : 'Saving...'}</span>
        </div>
      </div>
    </div>
  )
}
