import { useEffect, useState, useRef } from 'react'
import { ArrowLeft, FileText, Info } from 'lucide-react'

export default function Results() {
  const [submission, setSubmission] = useState(null)
  const [assignment, setAssignment] = useState(null)
  const confettiFired = useRef(false)

  useEffect(() => {
    try {
      const sub = JSON.parse(sessionStorage.getItem('lastSubmission'))
      const a = JSON.parse(sessionStorage.getItem('lastAssignment'))
      if (sub) setSubmission(sub)
      if (a) setAssignment(a)

      // Fire confetti on first load
      if (!confettiFired.current && sub?.grading) {
        confettiFired.current = true
        import('canvas-confetti').then(({ default: confetti }) => {
          setTimeout(() => confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#d4622f', '#c49528', '#4d8060'] }), 400)
        }).catch(() => {})
      }
    } catch {}
  }, [])

  const handleBack = () => {
    if (assignment?.demo) {
      window.location.hash = '#home'
    } else {
      window.location.hash = '#student-dash'
    }
  }

  // No submission data — show placeholder
  if (!submission || !submission.grading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 pageEnter">
        <button onClick={() => window.location.hash = '#home'} className="mb-5 text-sm flex items-center gap-1" style={{ color: 'var(--mu)' }}>
          <ArrowLeft className="w-4 h-4" />Back
        </button>
        <div className="hcard p-6 text-center">
          <p className="text-sm" style={{ color: 'var(--mu)' }}>No grading results to display.</p>
          <p className="text-xs mt-1" style={{ color: 'var(--fa)' }}>Submit an essay to see your feedback here.</p>
        </div>
      </div>
    )
  }

  const grading = submission.grading
  const annotations = grading.annotations || []
  const pct = Math.round((grading.score / grading.maxScore) * 100)
  const grade = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Proficient' : pct >= 40 ? 'Developing' : 'Needs Work'
  const encourageMsg = pct >= 80 ? "Outstanding work! You're demonstrating real mastery of AP World History writing skills."
    : pct >= 60 ? "Great progress! Your historical thinking is getting stronger with every essay."
    : pct >= 40 ? "You're building a solid foundation — keep practicing and you'll see big gains!"
    : "Every great historian started somewhere. Keep writing, and watch your skills grow!"
  const encourageIcon = pct >= 80 ? '🏆' : pct >= 60 ? '⭐' : pct >= 40 ? '📈' : '💪'

  // Build annotated essay HTML
  const buildAnnotatedHtml = () => {
    let html = submission.essayText.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    annotations.forEach((ann, idx) => {
      if (ann.quote) {
        const escaped = ann.quote.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        const cls = ann.status === 'success' ? 'hl-success' : ann.status === 'warning' ? 'hl-warning' : 'hl-error'
        const num = idx + 1
        html = html.replace(escaped, `<span class="${cls} hl-inline" data-ann="${num}"><span class="hl-num">${num}</span>${escaped}</span>`)
      }
    })
    return html
  }

  const handleHighlightClick = (e) => {
    const annEl = e.target.closest('[data-ann]')
    if (annEl) {
      const num = annEl.getAttribute('data-ann')
      const card = document.getElementById(`ann-${num}`)
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' })
        card.classList.add('ann-flash')
        setTimeout(() => card.classList.remove('ann-flash'), 800)
      }
    }
  }

  const handleCardClick = (num) => {
    const el = document.querySelector(`[data-ann="${num}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const hasImprovements = annotations.some(ann => ann.status !== 'success')
  const improvementTips = annotations.filter(ann => ann.status !== 'success' && ann.improvementTip)

  return (
    <div className="h-[calc(100vh-56px)] flex pageEnter">
      {/* Left panel — Annotated essay */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 csc">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={handleBack} className="text-sm flex items-center gap-1" style={{ color: 'var(--mu)' }}>
            <ArrowLeft className="w-4 h-4" />Back
          </button>
          {assignment?.demo && (
            <button onClick={() => window.location.hash = '#demo'} className="btnP text-xs py-1.5 px-4">Try Again</button>
          )}
        </div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,var(--ac),var(--gd))' }}>
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold fs">Grading Report</h1>
            <p className="text-xs" style={{ color: 'var(--mu)' }}>{assignment?.title || 'Essay'}</p>
          </div>
        </div>

        {submission._usedMockGrading && (
          <div className="mb-4 p-3 rounded-xl text-xs flex items-start gap-2" style={{ background: 'rgba(196,149,40,.08)', border: '1px solid rgba(196,149,40,.2)' }}>
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--gd)' }} />
            <div>
              <span className="font-bold" style={{ color: 'var(--gd)' }}>Demo Feedback</span>
              <span style={{ color: 'var(--mu)' }}> — No Claude API key is set, so this is sample feedback. Add your API key in Settings for real AI grading.</span>
            </div>
          </div>
        )}

        <div
          className="hcard p-6 md:p-8 fs text-base md:text-lg leading-relaxed"
          style={{ whiteSpace: 'pre-wrap' }}
          dangerouslySetInnerHTML={{ __html: buildAnnotatedHtml() }}
          onClick={handleHighlightClick}
        />

        <div className="mt-4 p-4 rounded-xl text-xs" style={{ background: 'var(--elev)', border: '1px solid var(--bd)', color: 'var(--mu)' }}>
          <div className="hl-legend">
            <span className="hl-legend-item"><span className="hl-legend-swatch" style={{ background: 'rgba(77,128,96,.15)', borderBottom: '2px solid var(--sg)' }}></span> Strong — point earned</span>
            <span className="hl-legend-item"><span className="hl-legend-swatch" style={{ background: 'rgba(196,149,40,.15)', borderBottom: '2px solid var(--gd)' }}></span> Close — almost there</span>
            <span className="hl-legend-item"><span className="hl-legend-swatch" style={{ background: 'rgba(212,98,47,.15)', borderBottom: '2px solid var(--ac)' }}></span> Needs work — room to grow</span>
          </div>
          <p className="mt-2" style={{ color: 'var(--fa)' }}>Click a numbered highlight to jump to its feedback.</p>
        </div>
      </div>

      {/* Right panel — Score & Feedback sidebar */}
      <div className="w-80 md:w-96 overflow-y-auto p-6 csc" style={{ background: 'var(--card)', borderLeft: '1px solid var(--bd)' }}>
        <div className="text-center mb-5">
          <div className="text-5xl font-bold fs score-reveal" style={{ color: 'var(--ac)' }}>
            {grading.score}<span className="text-xl" style={{ color: 'var(--fa)' }}>/{grading.maxScore}</span>
          </div>
          <div className="text-xs font-semibold mt-1 fadeIn" style={{ color: 'var(--mu)' }}>{grade}</div>
          <div className="xpBar w-full mt-3"><div className="xpFill" style={{ width: `${pct}%` }}></div></div>
        </div>

        <div className="enc-banner mb-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{encourageIcon}</span>
            <div>
              <p className="text-sm font-semibold mb-1">{grade}!</p>
              <p className="text-xs" style={{ color: 'var(--mu)' }}>{encourageMsg}</p>
            </div>
          </div>
        </div>

        {grading.generalFeedback && (
          <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--mu)' }}>{grading.generalFeedback}</p>
        )}

        <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--fa)' }}>Detailed Feedback</h4>
        <div className="space-y-3 stagger">
          {annotations.map((ann, idx) => {
            const num = idx + 1
            const dot = ann.status === 'success' ? 'var(--sg)' : ann.status === 'warning' ? 'var(--gd)' : 'var(--ac)'
            const statusCls = 'ann-card-' + ann.status
            const statusLabel = ann.status === 'success' ? 'Point Earned' : ann.status === 'warning' ? 'Almost There' : 'Needs Work'

            return (
              <div key={num} id={`ann-${num}`} className={`ann-card ${statusCls}`} onClick={() => handleCardClick(num)} style={{ cursor: 'pointer' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: dot }}>{num}</span>
                    <span className="text-[11px] font-bold uppercase" style={{ color: dot }}>{ann.category}</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                    background: ann.status === 'success' ? 'rgba(77,128,96,.12)' : ann.status === 'warning' ? 'rgba(196,149,40,.12)' : 'rgba(212,98,47,.12)',
                    color: dot
                  }}>{statusLabel}</span>
                </div>
                {ann.quote && (
                  <p className="text-[11px] italic mb-1.5 pl-2" style={{ color: 'var(--fa)', borderLeft: '2px solid var(--bd)' }}>
                    "{ann.quote.length > 80 ? ann.quote.substring(0, 80) + '…' : ann.quote}"
                  </p>
                )}
                <p className="text-xs" style={{ color: 'var(--mu)' }}>{ann.feedback}</p>
                {ann.status === 'success' && (
                  <p className="text-[10px] mt-2 font-medium" style={{ color: 'var(--sg)' }}>✓ Great job on this!</p>
                )}
                {ann.improvementTip && ann.status !== 'success' && (
                  <div className={`tip-box ${ann.status === 'error' ? 'tip-box-error' : ''}`} style={{ marginTop: '8px' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: dot }}>💡 Try this</p>
                    <p className="text-xs" style={{ color: 'var(--mu)' }}>{ann.improvementTip}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {hasImprovements ? (
          <div className="mt-6 p-4 rounded-xl" style={{ background: 'var(--acs)' }}>
            <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--ac)' }}>🎯 Next Steps</h4>
            <ul className="text-xs space-y-1.5" style={{ color: 'var(--mu)' }}>
              {improvementTips.length > 0
                ? improvementTips.map((ann, i) => (
                    <li key={i} className="flex items-start gap-1.5"><span style={{ color: 'var(--ac)' }}>→</span> {ann.improvementTip}</li>
                  ))
                : <li className="flex items-start gap-1.5"><span style={{ color: 'var(--ac)' }}>→</span> Review the highlighted sections and revise for your next attempt.</li>
              }
            </ul>
            <p className="text-[10px] mt-3 font-medium" style={{ color: 'var(--ac)' }}>Focus on one area at a time — you've got this!</p>
          </div>
        ) : (
          <div className="mt-6 p-4 rounded-xl text-center" style={{ background: 'rgba(77,128,96,.08)', border: '1px solid rgba(77,128,96,.2)' }}>
            <span className="text-2xl">🌟</span>
            <p className="text-xs font-semibold mt-1" style={{ color: 'var(--sg)' }}>Amazing work across the board!</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--mu)' }}>Keep this up and you'll ace the AP exam.</p>
          </div>
        )}
      </div>
    </div>
  )
}
