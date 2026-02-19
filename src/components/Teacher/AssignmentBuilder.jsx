import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ArrowLeft, Eye, Plus, X, FileText, CheckSquare, Sparkles } from 'lucide-react'

const FOCUS_SKILLS = [
  { id: 'thesis', label: 'Thesis / Claim' },
  { id: 'contextualization', label: 'Contextualization' },
  { id: 'evidence', label: 'Evidence & Support' },
  { id: 'reasoning', label: 'Reasoning & Analysis' }
]

export default function AssignmentBuilder() {
  const { user, firebase } = useAuth()
  const [classData, setClassData] = useState(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [type, setType] = useState('saq')
  const [prompt, setPrompt] = useState('')
  const [maxAttempts, setMaxAttempts] = useState(3)

  // SAQ-specific
  const [saqParts, setSaqParts] = useState(3)

  // LEQ-specific
  const [leqSkills, setLeqSkills] = useState({ thesis: true, contextualization: true, evidence: true, reasoning: true })

  // DBQ-specific
  const [dbqDocs, setDbqDocs] = useState([])

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('hw_classData')
      if (stored) setClassData(JSON.parse(stored))
    } catch (e) {
      console.error('Failed to load class data:', e)
    }
  }, [])

  const handleBack = () => {
    if (classData) {
      window.location.hash = '#class-manager'
    } else {
      window.location.hash = '#teacher-dash'
    }
  }

  const toggleLeqSkill = (skillId) => {
    setLeqSkills(prev => ({ ...prev, [skillId]: !prev[skillId] }))
  }

  const addDbqDoc = () => {
    setDbqDocs(prev => [...prev, {
      id: Date.now(),
      type: 'text',
      label: `Document ${prev.length + 1}`,
      content: ''
    }])
  }

  const updateDbqDoc = (id, field, value) => {
    setDbqDocs(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d))
  }

  const removeDbqDoc = (id) => {
    setDbqDocs(prev => prev.filter(d => d.id !== id))
  }

  const handleSubmit = async () => {
    if (!title.trim() || !prompt.trim()) return
    if (!firebase?.db || !user) return

    setSaving(true)
    try {
      const assignmentData = {
        title: title.trim(),
        type,
        prompt: prompt.trim(),
        maxAttempts: Number(maxAttempts) || 3,
        classId: classData?.id || null,
        teacherId: user.uid,
        submissionCount: 0,
        createdAt: serverTimestamp()
      }

      if (type === 'saq') {
        assignmentData.saqParts = saqParts
      } else if (type === 'leq') {
        assignmentData.focusSkills = Object.entries(leqSkills)
          .filter(([, v]) => v)
          .map(([k]) => k)
      } else if (type === 'dbq') {
        assignmentData.documents = dbqDocs.map(d => ({
          type: d.type,
          label: d.label,
          content: d.content
        }))
      }

      await addDoc(collection(firebase.db, 'assignments'), assignmentData)
      handleBack()
    } catch (err) {
      console.error('Error saving assignment:', err)
    } finally {
      setSaving(false)
    }
  }

  const getTypeBadgeStyle = (t) => {
    const config = {
      saq: { bg: 'rgba(77,128,96,.1)', color: 'var(--sg)' },
      leq: { bg: 'rgba(92,109,179,.1)', color: 'var(--ry)' },
      dbq: { bg: 'var(--acs)', color: 'var(--ac)' }
    }
    return config[t] || config.saq
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pageEnter">
      {/* Back button */}
      <button onClick={handleBack} className="btnG text-sm py-2 px-4 flex items-center gap-2 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
          style={{ background: 'linear-gradient(135deg,var(--ac),var(--gd))' }}
        >
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold fs">Create Assignment</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--mu)' }}>
            {classData ? `For: ${classData.name}` : 'Build a new writing assignment'}
          </p>
        </div>
      </div>

      {/* Split layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-5">
          <div className="hcard p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--fa)' }}>
              Assignment Details
            </h2>

            {/* Title */}
            <label className="block mb-1 text-xs font-semibold" style={{ color: 'var(--mu)' }}>Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Maritime Empires LEQ"
              className="hinp mb-4"
            />

            {/* Type */}
            <label className="block mb-1 text-xs font-semibold" style={{ color: 'var(--mu)' }}>Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="hinp mb-4">
              <option value="saq">SAQ (Short Answer Question)</option>
              <option value="leq">LEQ (Long Essay Question)</option>
              <option value="dbq">DBQ (Document-Based Question)</option>
            </select>

            {/* Prompt */}
            <label className="block mb-1 text-xs font-semibold" style={{ color: 'var(--mu)' }}>Prompt</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Write the assignment prompt students will see..."
              className="hinp mb-4"
              rows={5}
              style={{ resize: 'vertical', minHeight: '100px' }}
            />

            {/* Max Attempts */}
            <label className="block mb-1 text-xs font-semibold" style={{ color: 'var(--mu)' }}>Max Attempts</label>
            <input
              type="number"
              value={maxAttempts}
              onChange={e => setMaxAttempts(e.target.value)}
              min={1}
              max={10}
              className="hinp mb-2"
              style={{ maxWidth: '120px' }}
            />
          </div>

          {/* Type-specific options */}
          {type === 'saq' && (
            <div className="hcard p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--fa)' }}>
                SAQ Options
              </h2>
              <label className="block mb-1 text-xs font-semibold" style={{ color: 'var(--mu)' }}>
                Number of Parts
              </label>
              <select
                value={saqParts}
                onChange={e => setSaqParts(Number(e.target.value))}
                className="hinp"
                style={{ maxWidth: '180px' }}
              >
                <option value={2}>2 Parts (a-b)</option>
                <option value={3}>3 Parts (a-c)</option>
                <option value={4}>4 Parts (a-d)</option>
              </select>
            </div>
          )}

          {type === 'leq' && (
            <div className="hcard p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--fa)' }}>
                LEQ Focus Skills
              </h2>
              <p className="text-xs mb-3" style={{ color: 'var(--mu)' }}>
                Select the skills students should focus on in their response.
              </p>
              <div className="space-y-2">
                {FOCUS_SKILLS.map(skill => (
                  <label
                    key={skill.id}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: leqSkills[skill.id] ? 'var(--acs)' : 'var(--elev)',
                      border: `1px solid ${leqSkills[skill.id] ? 'var(--ac)' : 'var(--bd)'}`
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={leqSkills[skill.id]}
                      onChange={() => toggleLeqSkill(skill.id)}
                      className="sr-only"
                    />
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                      style={{
                        background: leqSkills[skill.id] ? 'var(--ac)' : 'transparent',
                        border: leqSkills[skill.id] ? 'none' : '2px solid var(--bd)'
                      }}
                    >
                      {leqSkills[skill.id] && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-sm font-medium">{skill.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {type === 'dbq' && (
            <div className="hcard p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--fa)' }}>
                Document Sources
              </h2>
              <p className="text-xs mb-4" style={{ color: 'var(--mu)' }}>
                Add the primary source documents students will analyze.
              </p>

              {dbqDocs.length === 0 && (
                <div
                  className="text-center py-6 mb-4 rounded-xl"
                  style={{ border: '2px dashed var(--bd)' }}
                >
                  <p className="text-xs" style={{ color: 'var(--fa)' }}>No documents added yet</p>
                </div>
              )}

              <div className="space-y-3 mb-4">
                {dbqDocs.map((d, idx) => (
                  <div
                    key={d.id}
                    className="p-4 rounded-xl"
                    style={{ background: 'var(--elev)', border: '1px solid var(--bd)' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold fm" style={{ color: 'var(--ac)' }}>
                        DOC {idx + 1}
                      </span>
                      <button
                        onClick={() => removeDbqDoc(d.id)}
                        className="p-1 rounded hover:bg-[var(--bd)] transition-colors"
                      >
                        <X className="w-4 h-4" style={{ color: 'var(--mu)' }} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block mb-1 text-[10px] font-semibold uppercase" style={{ color: 'var(--fa)' }}>Type</label>
                        <select
                          value={d.type}
                          onChange={e => updateDbqDoc(d.id, 'type', e.target.value)}
                          className="hinp text-xs"
                        >
                          <option value="text">Text Source</option>
                          <option value="image">Image</option>
                          <option value="map">Map</option>
                          <option value="chart">Chart / Graph</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1 text-[10px] font-semibold uppercase" style={{ color: 'var(--fa)' }}>Label</label>
                        <input
                          value={d.label}
                          onChange={e => updateDbqDoc(d.id, 'label', e.target.value)}
                          placeholder="e.g. Document A"
                          className="hinp text-xs"
                        />
                      </div>
                    </div>

                    <label className="block mb-1 text-[10px] font-semibold uppercase" style={{ color: 'var(--fa)' }}>
                      {d.type === 'image' || d.type === 'map' ? 'Image URL or Description' : 'Content'}
                    </label>
                    <textarea
                      value={d.content}
                      onChange={e => updateDbqDoc(d.id, 'content', e.target.value)}
                      placeholder={d.type === 'text' ? 'Paste the primary source text here...' : 'Paste URL or describe the visual source...'}
                      className="hinp text-xs"
                      rows={3}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                ))}
              </div>

              <button onClick={addDbqDoc} className="btnG text-sm py-2 px-4 w-full flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Document
              </button>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={saving || !title.trim() || !prompt.trim()}
            className="btnP w-full py-3 text-base flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {saving ? 'Saving...' : 'Create Assignment'}
          </button>
        </div>

        {/* Right: Live Preview */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4" style={{ color: 'var(--ac)' }} />
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--fa)' }}>
              Live Preview
            </h2>
          </div>

          <div className="hcard p-6">
            {/* Preview header */}
            <div className="flex items-center gap-2 mb-3">
              {(() => {
                const s = getTypeBadgeStyle(type)
                return (
                  <span
                    className="text-[10px] font-bold fm uppercase px-2 py-1 rounded"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {type.toUpperCase()}
                  </span>
                )
              })()}
              {maxAttempts && (
                <span className="text-[10px] fm" style={{ color: 'var(--fa)' }}>
                  {maxAttempts} attempt{maxAttempts > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold fs mb-2">
              {title || 'Assignment Title'}
            </h3>

            <div
              className="text-sm mb-4 whitespace-pre-wrap"
              style={{ color: title || prompt ? 'var(--tx)' : 'var(--fa)' }}
            >
              {prompt || 'Your prompt will appear here as you type...'}
            </div>

            {/* Type-specific preview */}
            {type === 'saq' && (
              <div className="space-y-3 pt-4" style={{ borderTop: '1px solid var(--bd)' }}>
                <p className="text-xs font-semibold" style={{ color: 'var(--fa)' }}>
                  RESPONSE SECTIONS
                </p>
                {Array.from({ length: saqParts }, (_, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl"
                    style={{ background: 'var(--elev)', border: '1px solid var(--bd)' }}
                  >
                    <span className="text-xs font-bold" style={{ color: 'var(--sg)' }}>
                      Part {String.fromCharCode(65 + i)}
                    </span>
                    <div
                      className="mt-1 h-6 rounded"
                      style={{ background: 'var(--bd)', width: `${60 + i * 10}%` }}
                    />
                  </div>
                ))}
              </div>
            )}

            {type === 'leq' && (
              <div className="space-y-2 pt-4" style={{ borderTop: '1px solid var(--bd)' }}>
                <p className="text-xs font-semibold" style={{ color: 'var(--fa)' }}>
                  FOCUS SKILLS
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {FOCUS_SKILLS.filter(s => leqSkills[s.id]).map(s => (
                    <span
                      key={s.id}
                      className="text-[10px] font-semibold px-2 py-1 rounded"
                      style={{ background: 'rgba(92,109,179,.1)', color: 'var(--ry)' }}
                    >
                      {s.label}
                    </span>
                  ))}
                  {Object.values(leqSkills).every(v => !v) && (
                    <span className="text-[10px]" style={{ color: 'var(--fa)' }}>No skills selected</span>
                  )}
                </div>
                <div className="space-y-2 mt-3">
                  {['Contextualization', 'Thesis', 'Evidence #1', 'Evidence #2', 'Analysis', 'Complexity'].map((label, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg"
                      style={{ background: 'var(--elev)', border: '1px solid var(--bd)' }}
                    >
                      <span className="text-[10px] font-bold" style={{ color: 'var(--ry)' }}>{label}</span>
                      <div className="mt-1 h-4 rounded" style={{ background: 'var(--bd)', width: `${45 + i * 8}%` }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {type === 'dbq' && (
              <div className="space-y-2 pt-4" style={{ borderTop: '1px solid var(--bd)' }}>
                <p className="text-xs font-semibold" style={{ color: 'var(--fa)' }}>
                  DOCUMENTS ({dbqDocs.length})
                </p>
                {dbqDocs.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--fa)' }}>Add documents to see them in preview</p>
                ) : (
                  dbqDocs.map((d, i) => (
                    <div
                      key={d.id}
                      className="p-3 rounded-xl"
                      style={{ background: 'var(--elev)', border: '1px solid var(--bd)' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-bold fm uppercase px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--acs)', color: 'var(--ac)' }}
                        >
                          {d.type}
                        </span>
                        <span className="text-xs font-bold">{d.label || `Document ${i + 1}`}</span>
                      </div>
                      {d.content && (
                        <p className="text-[11px] mt-1 line-clamp-2" style={{ color: 'var(--mu)' }}>
                          {d.content.substring(0, 100)}{d.content.length > 100 ? '...' : ''}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
