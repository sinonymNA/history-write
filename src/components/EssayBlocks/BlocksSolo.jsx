import { useState, useEffect, useCallback } from 'react'
import { useGame } from '../../context/GameContext'
import { BLOCK_TEMPLATES, ESSAY_BLOCKS_PROMPTS } from '../../lib/constants'
import { ArrowLeft, ChevronRight, Send, RotateCcw, Lightbulb, CheckCircle2, Puzzle } from 'lucide-react'

export default function BlocksSolo() {
  const { addXP } = useGame()

  // Load prompt data from sessionStorage or default to the first LEQ prompt
  const [promptData, setPromptData] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [currentBlock, setCurrentBlock] = useState(0)
  const [responses, setResponses] = useState({})
  const [consolidated, setConsolidated] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [wordCounts, setWordCounts] = useState({})

  useEffect(() => {
    let data = null
    try {
      const stored = sessionStorage.getItem('blocksPrompt')
      if (stored) data = JSON.parse(stored)
    } catch {}

    if (!data) {
      data = ESSAY_BLOCKS_PROMPTS.find(p => p.type === 'leq') || ESSAY_BLOCKS_PROMPTS[0]
    }
    setPromptData(data)

    // Generate blocks from template
    const type = data.type || 'leq'
    let generated = []
    if (type === 'saq') {
      generated = BLOCK_TEMPLATES.saq(data.prompt, data.parts || 3)
    } else if (type === 'dbq') {
      const sources = data.sources || data.structure?.sources || []
      generated = BLOCK_TEMPLATES.dbq(data.prompt, sources)
    } else {
      generated = BLOCK_TEMPLATES.leq(data.prompt)
    }
    setBlocks(generated)

    // Restore any saved progress
    try {
      const saved = sessionStorage.getItem('blocksResponses')
      if (saved) {
        const parsed = JSON.parse(saved)
        setResponses(parsed)
        // Calculate word counts for restored responses
        const counts = {}
        Object.entries(parsed).forEach(([key, val]) => {
          counts[key] = val.trim().split(/\s+/).filter(Boolean).length
        })
        setWordCounts(counts)
      }
    } catch {}
  }, [])

  // Auto-save responses
  const saveProgress = useCallback((newResponses) => {
    try {
      sessionStorage.setItem('blocksResponses', JSON.stringify(newResponses))
    } catch {}
  }, [])

  const handleTextChange = (blockId, text) => {
    const updated = { ...responses, [blockId]: text }
    setResponses(updated)
    setWordCounts(prev => ({
      ...prev,
      [blockId]: text.trim().split(/\s+/).filter(Boolean).length
    }))
    saveProgress(updated)
  }

  const handleNextBlock = () => {
    if (currentBlock < blocks.length - 1) {
      setCurrentBlock(prev => prev + 1)
      setShowHint(false)
    } else {
      setConsolidated(true)
    }
  }

  const handlePrevBlock = () => {
    if (consolidated) {
      setConsolidated(false)
    } else if (currentBlock > 0) {
      setCurrentBlock(prev => prev - 1)
      setShowHint(false)
    }
  }

  const handleSubmit = () => {
    // Build full essay text from all block responses
    const essayText = blocks
      .map(b => responses[b.id] || '')
      .filter(t => t.trim())
      .join('\n\n')

    const submission = {
      essayText,
      assignmentId: promptData?.id || 'blocks-solo',
      submittedAt: new Date().toISOString(),
      blockResponses: responses,
      grading: {
        score: 0,
        maxScore: 6,
        generalFeedback: 'Your essay has been submitted for review.',
        annotations: []
      }
    }
    sessionStorage.setItem('lastSubmission', JSON.stringify(submission))
    sessionStorage.setItem('lastAssignment', JSON.stringify({
      id: 'blocks-solo',
      type: (promptData?.type || 'leq').toUpperCase(),
      title: promptData?.title || 'Essay Blocks',
      prompt: promptData?.prompt || '',
      structure: { sources: [] }
    }))

    // Clear saved progress
    sessionStorage.removeItem('blocksResponses')

    addXP(25)
    window.location.hash = '#results'
  }

  const handleReset = () => {
    if (!window.confirm('Reset all blocks? This will clear your progress.')) return
    setResponses({})
    setWordCounts({})
    setCurrentBlock(0)
    setConsolidated(false)
    setShowHint(false)
    sessionStorage.removeItem('blocksResponses')
  }

  if (!promptData || blocks.length === 0) {
    return (
      <div className="eb-wrap pageEnter">
        <div className="text-center py-12">
          <div className="skeleton" style={{ width: '60%', height: 20, margin: '0 auto 12px' }} />
          <div className="skeleton" style={{ width: '80%', height: 14, margin: '0 auto' }} />
        </div>
      </div>
    )
  }

  const typeColor = promptData.type === 'saq' ? 'var(--sg)' : promptData.type === 'dbq' ? 'var(--ac)' : 'var(--ry)'
  const typeBg = promptData.type === 'saq' ? 'rgba(77,128,96,.1)' : promptData.type === 'dbq' ? 'var(--acs)' : 'rgba(92,109,179,.1)'
  const block = blocks[currentBlock]
  const currentResponse = block ? (responses[block.id] || '') : ''
  const currentWordCount = block ? (wordCounts[block.id] || 0) : 0
  const allBlocksDone = blocks.every(b => (responses[b.id] || '').trim().length > 0)

  // Consolidation view
  if (consolidated) {
    return (
      <div className="eb-wrap pageEnter">
        <button onClick={() => window.location.hash = '#student-dash'} className="mb-4 text-sm flex items-center gap-1" style={{ color: 'var(--mu)' }}>
          <ArrowLeft className="w-4 h-4" />Back to Dashboard
        </button>

        <div className="eb-consolidated">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg,var(--ac),var(--gd))' }}>
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold fs">Consolidation</h1>
              <p className="text-xs" style={{ color: 'var(--mu)' }}>Review your complete essay before submitting.</p>
            </div>
          </div>

          {/* Prompt reminder */}
          <div className="p-4 rounded-xl mb-5" style={{ background: 'var(--elev)', border: '1px solid var(--bd)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold fm uppercase px-2 py-1 rounded" style={{ background: typeBg, color: typeColor }}>{promptData.type.toUpperCase()}</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--mu)' }}>{promptData.title}</span>
            </div>
            <p className="text-sm fs leading-relaxed" style={{ color: 'var(--mu)' }}>{promptData.prompt}</p>
          </div>

          {/* Consolidated blocks */}
          <div className="eb-card mb-5">
            <div className="space-y-5">
              {blocks.map((b, i) => {
                const text = responses[b.id] || ''
                return (
                  <div key={b.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{b.emoji}</span>
                      <span className="eb-block-label">{b.label}</span>
                    </div>
                    <p className="text-sm fs leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
                      {text || <span style={{ color: 'var(--fa)', fontStyle: 'italic' }}>No response written</span>}
                    </p>
                    {i < blocks.length - 1 && (
                      <div className="mt-4" style={{ borderBottom: '1px solid var(--bd)' }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Word count summary */}
          <div className="flex items-center justify-between text-xs mb-5 px-1" style={{ color: 'var(--fa)' }}>
            <span>
              Total words: {Object.values(wordCounts).reduce((a, b) => a + b, 0)}
            </span>
            <span>
              {blocks.filter(b => (responses[b.id] || '').trim()).length}/{blocks.length} blocks completed
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={handlePrevBlock} className="btnG flex-1 flex items-center justify-center gap-2 text-sm">
              <ArrowLeft className="w-4 h-4" />Edit Blocks
            </button>
            <button onClick={handleSubmit} className="btnP flex-1 flex items-center justify-center gap-2 text-sm pulse-cta">
              <Send className="w-4 h-4" />Submit Essay
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Block writing view
  return (
    <div className="eb-wrap pageEnter">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => window.location.hash = '#student-dash'} className="text-sm flex items-center gap-1" style={{ color: 'var(--mu)' }}>
          <ArrowLeft className="w-4 h-4" />Back
        </button>
        <button onClick={handleReset} className="text-xs flex items-center gap-1" style={{ color: 'var(--fa)' }}>
          <RotateCcw className="w-3 h-3" />Reset
        </button>
      </div>

      {/* Prompt */}
      <div className="p-4 rounded-xl mb-5" style={{ background: 'var(--elev)', border: '1px solid var(--bd)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold fm uppercase px-2 py-1 rounded" style={{ background: typeBg, color: typeColor }}>{promptData.type.toUpperCase()}</span>
          <span className="text-xs font-semibold" style={{ color: 'var(--mu)' }}>{promptData.title}</span>
        </div>
        <p className="text-sm fs leading-relaxed">{promptData.prompt}</p>
      </div>

      {/* Progress bar */}
      <div className="eb-progress">
        {blocks.map((b, i) => (
          <button
            key={b.id}
            onClick={() => { setCurrentBlock(i); setConsolidated(false); setShowHint(false) }}
            className={`eb-pip ${i < currentBlock ? 'done' : ''} ${i === currentBlock ? 'active' : ''}`}
            title={b.label}
          />
        ))}
      </div>

      {/* Block label and counter */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="eb-block-label">
            Block {currentBlock + 1} of {blocks.length}
          </span>
        </div>
        {allBlocksDone && (
          <button
            onClick={() => setConsolidated(true)}
            className="text-[10px] font-bold uppercase px-2 py-1 rounded flex items-center gap-1"
            style={{ background: 'rgba(77,128,96,.1)', color: 'var(--sg)' }}
          >
            <CheckCircle2 className="w-3 h-3" />All done — Review
          </button>
        )}
      </div>

      {/* Current block card */}
      <div className="eb-card eb-block" key={block.id}>
        <span className="eb-emoji">{block.emoji}</span>
        <h2 className="text-xl font-bold fs mb-1">{block.label}</h2>
        <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--mu)' }}>{block.question}</p>

        {/* Hint toggle */}
        <button
          onClick={() => setShowHint(prev => !prev)}
          className="flex items-center gap-1.5 text-xs font-semibold mb-3 px-3 py-1.5 rounded-lg transition-all"
          style={{
            background: showHint ? 'rgba(196,149,40,.12)' : 'transparent',
            color: 'var(--gd)',
            border: '1px solid rgba(196,149,40,.2)'
          }}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          {showHint ? 'Hide Hint' : 'Show Hint'}
        </button>

        {showHint && (
          <div className="mb-4 p-3 rounded-xl text-xs leading-relaxed fadeIn" style={{ background: 'rgba(196,149,40,.08)', border: '1px solid rgba(196,149,40,.2)', color: 'var(--gd)' }}>
            <span className="font-bold">Tip: </span>{block.hint}
          </div>
        )}

        {/* Textarea */}
        <textarea
          value={currentResponse}
          onChange={e => handleTextChange(block.id, e.target.value)}
          className="w-full p-4 rounded-xl text-sm fs leading-relaxed resize-none focus:outline-none transition-all"
          style={{
            background: 'var(--elev)',
            border: '1px solid var(--bd)',
            color: 'var(--tx)',
            minHeight: '160px'
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--ac)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,98,47,.1)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--bd)'; e.target.style.boxShadow = 'none' }}
          placeholder={`Write your ${block.label.toLowerCase()} here...`}
        />

        {/* Word count and min words */}
        <div className="flex items-center justify-between mt-2 text-[11px]" style={{ color: 'var(--fa)' }}>
          <span style={{ color: currentWordCount >= (block.minWords || 0) ? 'var(--sg)' : 'var(--fa)' }}>
            {currentWordCount} words
            {block.minWords ? ` / ${block.minWords} min` : ''}
          </span>
          {currentWordCount >= (block.minWords || 0) && currentWordCount > 0 && (
            <span style={{ color: 'var(--sg)' }}>
              <CheckCircle2 className="w-3 h-3 inline mr-0.5" style={{ verticalAlign: 'text-bottom' }} />
              Minimum reached
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-5">
        {currentBlock > 0 && (
          <button onClick={handlePrevBlock} className="btnG flex-1 flex items-center justify-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" />Previous
          </button>
        )}
        <button
          onClick={handleNextBlock}
          disabled={!currentResponse.trim()}
          className="btnP flex-1 flex items-center justify-center gap-2 text-sm"
        >
          {currentBlock < blocks.length - 1 ? (
            <>Next Block<ChevronRight className="w-4 h-4" /></>
          ) : (
            <>Review Essay<Puzzle className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  )
}
