import { useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { X } from 'lucide-react'

const DEFAULT_MASTERY = {
  saq: { skills: { identify: 40, describe: 35, explain: 30 } },
  dbq: { skills: { contextualization: 25, thesis: 30, sourcing: 15, evidence: 20, complexity: 10 } },
  leq: { skills: { contextualization: 30, thesis: 35, evidence: 25, reasoning: 20 } }
}

const PRACTICE_BANK = {
  thesis: [
    { scenario: 'Write a thesis for: "Evaluate the extent to which the Columbian Exchange affected the economies of Europe and the Americas in the period 1450–1750."', hint: 'Use "because" followed by 2-3 specific supporting points. Take a clear stance on "extent."', checks: ['Makes a defensible claim', 'Addresses the prompt directly', 'Includes a line of reasoning with "because"'], keywords: ['columbian exchange', 'economy', 'trade', 'crops', 'silver', 'labor', 'plantation', 'mercantilism'] },
    { scenario: 'Write a thesis for: "Compare the causes of TWO revolutions in the period 1750–1900."', hint: 'Name both revolutions, state what caused them, and make a claim about similarity or difference.', checks: ['Names two specific revolutions', 'Identifies causes for both', 'Makes a comparative claim'], keywords: ['french', 'american', 'haitian', 'revolution', 'enlightenment', 'taxation', 'inequality', 'rights'] }
  ],
  contextualization: [
    { scenario: 'Write 2-3 sentences of historical context for an essay about the spread of Islam along Indian Ocean trade routes (1200-1450). Do NOT reference any documents — use only your outside knowledge.', hint: 'Think about what was happening in the broader world: political conditions, economic trends, or cultural developments BEFORE or DURING this period.', checks: ['Describes broader historical context', 'Relevant to the time period', 'Does not reference specific documents'], keywords: ['trade', 'monsoon', 'merchants', 'swahili', 'port cities', 'dar al-islam', 'abbasid', 'song dynasty'] }
  ],
  evidence: [
    { scenario: 'Provide ONE piece of specific historical evidence that supports this claim: "The Mongol Empire facilitated cultural exchange across Eurasia."', hint: 'Be SPECIFIC — include a name, date, place, or concrete detail. Avoid vague statements.', checks: ['Names a specific historical detail', 'Includes dates or names', 'Directly supports the claim'], keywords: ['pax mongolica', 'silk road', 'marco polo', 'ibn battuta', 'plague', 'gunpowder', 'paper', 'trade routes', 'yuan'] }
  ],
  sourcing: [
    { scenario: 'A Spanish conquistador writes a letter to King Charles V in 1521 describing the wealth of the Aztec capital. Analyze this source using HAPP (Historical situation, Audience, Purpose, Point of view).', hint: 'Think about WHY this person wrote this, WHO they were writing to, and how that shapes what they said.', checks: ['Identifies the historical situation', 'Analyzes audience or purpose', 'Explains how POV shapes the document'], keywords: ['conquistador', 'king', 'wealth', 'justify', 'conquest', 'perspective', 'bias', 'purpose', 'audience', 'report'] }
  ],
  reasoning: [
    { scenario: 'You have evidence that "the printing press spread rapidly across Europe after 1450." Explain HOW this evidence supports the argument that "technology drove cultural change in early modern Europe."', hint: 'Use connecting phrases like "this demonstrates that..." or "as a result..." to show cause and effect.', checks: ['Connects evidence to the argument', 'Explains HOW/WHY (not just WHAT)', 'Uses analytical reasoning language'], keywords: ['printing press', 'literacy', 'reformation', 'ideas', 'books', 'dissemination', 'culture', 'demonstrates', 'result'] }
  ],
  identify: [
    { scenario: 'Identify ONE specific historical development that resulted from increased maritime trade in the period 1450-1750.', hint: 'Name a specific event, system, or change — not a vague trend.', checks: ['Names ONE specific development', 'Within the correct time period', 'Historically accurate'], keywords: ['columbian exchange', 'triangular trade', 'plantation', 'silver trade', 'manila galleons', 'joint-stock', 'dutch east india'] }
  ],
  describe: [
    { scenario: 'Describe the encomienda system in Spanish colonies.', hint: 'Explain WHAT it was and HOW it worked in practice.', checks: ['Explains what the system was', 'Describes how it functioned', 'Includes specific details'], keywords: ['encomienda', 'labor', 'indigenous', 'spanish', 'land', 'tribute', 'colonial', 'forced'] }
  ],
  explain: [
    { scenario: 'Explain WHY the Black Death led to changes in European labor systems.', hint: 'Connect cause to effect — explain the mechanism, not just state the outcome.', checks: ['Identifies the cause (Black Death effects)', 'Explains the mechanism of change', 'Connects cause directly to effect'], keywords: ['plague', 'population', 'labor shortage', 'peasants', 'wages', 'feudal', 'bargaining', 'decline', 'serfdom'] }
  ],
  complexity: [
    { scenario: 'Your essay argues that "European imperialism was primarily driven by economic motives." Write 2-3 sentences that demonstrate complexity by complicating this argument.', hint: 'Start with "However..." or "While economic motives were central..." and introduce a counterargument, qualification, or cross-period connection.', checks: ['Acknowledges a counterargument or nuance', 'Goes beyond the main thesis', 'Shows sophisticated historical thinking'], keywords: ['however', 'although', 'while', 'not all', 'varied', 'cultural', 'religious', 'strategic', 'nationalist', 'civilizing mission'] }
  ]
}

const SKILL_DESCRIPTIONS = {
  thesis: 'Write a clear, defensible thesis with a line of reasoning.',
  contextualization: 'Set the broader historical context before your argument.',
  evidence: 'Provide specific historical evidence with names, dates, places.',
  sourcing: 'Analyze a source using HAPP (Historical situation, Audience, Purpose, POV).',
  reasoning: 'Connect your evidence to your thesis — explain HOW and WHY.',
  complexity: 'Show nuanced understanding — counterarguments, qualifications, cross-period connections.',
  identify: 'Name ONE specific historical development.',
  describe: 'Explain WHAT something was and HOW it worked.',
  explain: 'Explain WHY something happened — connect cause to effect.'
}

const PLOT_CONFIG = {
  saq: { label: 'SAQ Skills', icon: '📝', color: 'var(--ac)' },
  dbq: { label: 'DBQ Skills', icon: '📜', color: 'var(--ry)' },
  leq: { label: 'LEQ Skills', icon: '✍️', color: 'var(--sg)' }
}

function ProgressRing({ pct, size, color }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} className="progress-ring">
      <circle className="progress-ring-bg" cx={size / 2} cy={size / 2} r={r} strokeWidth="3" />
      <circle className="progress-ring-fill" cx={size / 2} cy={size / 2} r={r} strokeWidth="3" stroke={color} strokeDasharray={circ} strokeDashoffset={offset} />
    </svg>
  )
}

export default function SkillGarden({ mastery, onXPGain }) {
  const { userData } = useAuth()
  const m = mastery || userData?.gamification?.mastery || DEFAULT_MASTERY

  const [practiceOpen, setPracticeOpen] = useState(false)
  const [practiceCtx, setPracticeCtx] = useState(null)
  const [practiceResp, setPracticeResp] = useState('')
  const [practiceFb, setPracticeFb] = useState(null)
  const [practiceSubmitting, setPracticeSubmitting] = useState(false)

  const allSkills = []
  Object.entries(m).forEach(([type, data]) =>
    Object.entries(data.skills || {}).forEach(([name, val]) => allSkills.push({ type, name, val }))
  )
  const mastered = allSkills.filter(s => s.val >= 80).length
  const growing = allSkills.filter(s => s.val >= 40 && s.val < 80).length
  const seeds = allSkills.filter(s => s.val < 40).length
  const avgPct = allSkills.length ? Math.round(allSkills.reduce((a, s) => a + s.val, 0) / allSkills.length) : 0

  const getPlant = (val) => val >= 80 ? '🌳' : val >= 60 ? '🌻' : val >= 40 ? '🌿' : val >= 20 ? '🌱' : '🫘'

  const openPractice = (type, skill) => {
    const bank = PRACTICE_BANK[skill] || PRACTICE_BANK.thesis
    const drill = bank[Math.floor(Math.random() * bank.length)]
    setPracticeCtx({ type, skill, drill })
    setPracticeResp('')
    setPracticeFb(null)
    setPracticeOpen(true)
  }

  const submitPractice = useCallback(() => {
    if (!practiceResp.trim() || practiceResp.length < 15 || !practiceCtx) return
    setPracticeSubmitting(true)

    const { drill } = practiceCtx
    const lo = practiceResp.toLowerCase()
    const words = practiceResp.split(/\s+/).length
    const matchedKeywords = (drill.keywords || []).filter(k => lo.includes(k.toLowerCase()))
    const keywordScore = Math.min(matchedKeywords.length / Math.max(1, Math.min(drill.keywords?.length || 1, 5)), 1)

    const checkResults = (drill.checks || []).map(check => {
      const c = check.toLowerCase()
      if (c.includes('claim') || c.includes('defensible')) return words >= 15 && matchedKeywords.length >= 2
      if (c.includes('line of reasoning')) return /because|due to|as a result|in order to|led to/.test(lo)
      if (c.includes('addresses') || c.includes('relevant')) return matchedKeywords.length >= 1
      if (c.includes('specific') || c.includes('names') || c.includes('dates')) return /\d{3,4}/.test(practiceResp) || /[A-Z][a-z]{2,}(?:\s[A-Z][a-z]+)?/.test(practiceResp)
      if (c.includes('broader') || c.includes('before')) return words >= 20 && matchedKeywords.length >= 2
      if (c.includes('cause-effect') || c.includes('mechanism') || c.includes('explains')) return /because|led to|caused|resulted|therefore|this meant|enabled/.test(lo)
      if (c.includes('connects') || c.includes('how/why')) return /this demonstrates|this shows|therefore|which meant|as a result|because/.test(lo)
      if (c.includes('nuance') || c.includes('counter') || c.includes('beyond')) return /although|however|while|on the other hand|not all|varied/.test(lo)
      if (c.includes('happ') || c.includes('pov') || c.includes('audience') || c.includes('purpose')) return /point of view|purpose|audience|situation|pov|bias|perspective|motivation/.test(lo)
      return words >= 15 && matchedKeywords.length >= 1
    })

    const checksHit = checkResults.filter(Boolean).length
    const totalChecks = checkResults.length || 1
    const checkPct = checksHit / totalChecks

    let boost, quality
    if (checkPct >= 0.8 && keywordScore >= 0.4 && words >= 20) { boost = 14; quality = 'great' }
    else if (checkPct >= 0.5 && keywordScore >= 0.2 && words >= 15) { boost = 9; quality = 'good' }
    else { boost = 5; quality = 'try' }

    const xpGain = 25 + (boost * 2)
    const messages = {
      great: ["Excellent work! You nailed the key elements.", "That's AP-level writing right there!", "Outstanding — you clearly understand this skill!"],
      good: ["Good effort! You hit several key points.", "Solid work — a few tweaks and you'll master this!", "You're on the right track!"],
      try: ["Good start! Let's work on including more specifics.", "You're building the foundation — try adding dates, names, or key terms.", "Keep at it! Check the hint for ideas."]
    }

    setPracticeFb({
      quality, checksHit, totalChecks, boost, xpGain,
      checkResults,
      msg: messages[quality][Math.floor(Math.random() * messages[quality].length)]
    })
    setPracticeSubmitting(false)
    if (onXPGain) onXPGain(xpGain)
  }, [practiceResp, practiceCtx, onXPGain])

  return (
    <div>
      {/* Summary stats */}
      <div className="garden-summary">
        <div className="garden-stat"><div className="text-lg font-bold" style={{ color: 'var(--gd)' }}>{mastered}</div><div className="text-[10px]" style={{ color: 'var(--mu)' }}>🌳 Mastered</div></div>
        <div className="garden-stat"><div className="text-lg font-bold" style={{ color: 'var(--sg)' }}>{growing}</div><div className="text-[10px]" style={{ color: 'var(--mu)' }}>🌿 Growing</div></div>
        <div className="garden-stat"><div className="text-lg font-bold" style={{ color: 'var(--fa)' }}>{seeds}</div><div className="text-[10px]" style={{ color: 'var(--mu)' }}>🌱 Seedlings</div></div>
      </div>

      {/* Overall health */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: 'var(--acs)' }}>
        <div className="relative">
          <ProgressRing pct={avgPct} size={48} color="var(--ac)" />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{avgPct}%</span>
        </div>
        <div>
          <p className="text-xs font-semibold">Overall Garden Health</p>
          <p className="text-[10px]" style={{ color: 'var(--mu)' }}>Tap any plant to practice that skill!</p>
        </div>
      </div>

      {/* Skill plots by type */}
      <div className="space-y-4">
        {Object.entries(m).map(([type, data]) => {
          const cfg = PLOT_CONFIG[type]
          if (!cfg) return null
          const skills = data.skills || {}
          const entries = Object.entries(skills)
          const typePct = entries.length ? Math.round(entries.reduce((a, [, v]) => a + v, 0) / entries.length) : 0

          return (
            <div key={type} className="garden-plot">
              <div className="garden-type-header">
                <div className="relative">
                  <ProgressRing pct={typePct} size={44} color={cfg.color} />
                  <span className="absolute inset-0 flex items-center justify-center text-sm">{cfg.icon}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold">{cfg.label}</h4>
                  <p className="text-[10px]" style={{ color: 'var(--mu)' }}>{typePct}% mastered · {entries.filter(([, v]) => v >= 80).length}/{entries.length} golden</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(entries.length, 5)},1fr)`, gap: 8 }}>
                {entries.map(([name, val]) => {
                  const pctLvl = val >= 80 ? 'high' : val >= 40 ? 'mid' : 'low'
                  const state = val >= 80 ? 'skill-gold' : val >= 40 ? 'skill-grow' : 'skill-seed'
                  return (
                    <div key={name} className="plant-cell" data-pct={pctLvl} onClick={() => openPractice(type, name)}>
                      <div className={`plant-pot ${state}`} style={{ borderColor: 'var(--bd)' }}>
                        <span className={val >= 40 ? 'plant-sway' : ''}>{getPlant(val)}</span>
                      </div>
                      <span className="text-[10px] font-semibold capitalize" style={{ color: 'var(--mu)' }}>{name}</span>
                      <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: 'var(--bd)' }}>
                        <div style={{ width: `${val}%`, height: '100%', background: cfg.color, borderRadius: 4, transition: 'width .6s' }} />
                      </div>
                      <span className="text-[9px] font-bold" style={{ color: val >= 80 ? 'var(--gd)' : val >= 40 ? 'var(--sg)' : 'var(--fa)' }}>{val}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Practice Modal */}
      {practiceOpen && practiceCtx && (
        <div className="modalBg" onClick={() => setPracticeOpen(false)}>
          <div className="modalBox modalLg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold fs">Practice: {practiceCtx.skill[0].toUpperCase() + practiceCtx.skill.slice(1)}</h2>
              <button onClick={() => setPracticeOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--mu)' }}><X className="w-4 h-4" /></button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold fm uppercase px-2 py-1 rounded" style={{ background: 'var(--acs)', color: 'var(--ac)' }}>{practiceCtx.type.toUpperCase()}</span>
              <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--mu)' }}>→ {practiceCtx.skill}</span>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--mu)' }}>{SKILL_DESCRIPTIONS[practiceCtx.skill] || ''}</p>

            <div className="drill-scenario">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--ac)' }}>Your Task</p>
              <p className="text-sm fs leading-relaxed" style={{ whiteSpace: 'pre-line' }}>{practiceCtx.drill.scenario}</p>
            </div>

            <div className="drill-hint mt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--gd)' }}>Hint</p>
              <p style={{ color: 'var(--mu)' }}>{practiceCtx.drill.hint}</p>
            </div>

            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--mu)' }}>Checklist</p>
              <div className="drill-checklist">
                {practiceCtx.drill.checks.map((c, i) => (
                  <span key={i} className={`drill-check ${practiceFb?.checkResults?.[i] ? 'met' : ''}`}>{c}</span>
                ))}
              </div>
            </div>

            <textarea
              value={practiceResp}
              onChange={e => setPracticeResp(e.target.value)}
              className="hinp mt-3 text-sm"
              rows={4}
              placeholder="Type your response here..."
            />

            {practiceFb && (
              <div className={`drill-feedback drill-feedback-${practiceFb.quality} mt-3`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl">{practiceFb.quality === 'great' ? '🌟' : practiceFb.quality === 'good' ? '👍' : '💪'}</span>
                  <div>
                    <p className="text-sm font-semibold mb-1">{practiceFb.checksHit}/{practiceFb.totalChecks} checklist items · +{practiceFb.boost}% · +{practiceFb.xpGain} XP</p>
                    <p className="text-xs mb-2" style={{ color: 'var(--mu)' }}>{practiceFb.msg}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={submitPractice}
              disabled={practiceSubmitting || practiceResp.length < 15}
              className="btnP text-xs w-full mt-3"
            >
              {practiceFb ? 'Try Again' : 'Submit Response'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
