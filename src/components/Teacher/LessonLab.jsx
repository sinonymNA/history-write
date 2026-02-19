import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useClaudeAPI } from '../../hooks/useClaudeAPI'
import { ArrowLeft, Sparkles, BookOpen, Puzzle, Gamepad2, PenTool } from 'lucide-react'

const TEMPLATES = [
  { id: 'story', icon: '📖', title: 'Story Lesson', subtitle: 'Narrative chapters with comprehension checks', color: 'var(--ry)' },
  { id: 'dbq', icon: '🧩', title: 'Essay Blocks', subtitle: 'Guided essay with block structure', color: 'var(--sg)' },
  { id: 'quiz', icon: '🎮', title: 'Live Quiz', subtitle: 'Multiple-choice quiz questions', color: 'var(--gd)' },
  { id: 'writing', icon: '✍️', title: 'Writing Assignment', subtitle: 'Essay prompt with rubric', color: 'var(--ac)' }
]

export default function LessonLab() {
  const { user, firebase } = useAuth()
  const { generateLesson, loading: aiLoading } = useClaudeAPI()
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [topic, setTopic] = useState('')
  const [phase, setPhase] = useState('input')
  const [generated, setGenerated] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleGenerate = async () => {
    if (!topic.trim() || !selectedTemplate) return
    setPhase('generating')
    const result = await generateLesson(selectedTemplate, topic.trim(), user?.uid)
    if (result.success) { setGenerated(result.data); setPhase('preview') }
    else setPhase('input')
  }

  const handleSave = async () => {
    if (!firebase?.db || !generated || saving) return
    setSaving(true)
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore')
      await addDoc(collection(firebase.db, 'teacherLessons'), { ...generated, templateType: selectedTemplate, createdBy: user?.uid, createdAt: serverTimestamp(), topic: topic.trim() })
      window.location.hash = '#library'
    } catch (e) { console.error('Save error:', e); setSaving(false) }
  }

  const startOver = () => { setPhase('input'); setGenerated(null); setSelectedTemplate(null); setTopic('') }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pageEnter">
      <button onClick={() => window.location.hash = '#teacher-dash'} className="mb-5 text-sm flex items-center gap-1" style={{ color: 'var(--mu)' }}><ArrowLeft className="w-4 h-4" />Back</button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,var(--ry),var(--ac))' }}>
          <Sparkles className="w-5 h-5 text-white lab-icon" />
        </div>
        <div>
          <h1 className="text-2xl font-bold fs">Lesson Lab</h1>
          <p className="text-xs" style={{ color: 'var(--mu)' }}>AI-powered lesson generator</p>
        </div>
      </div>

      {phase === 'input' && (
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--fa)' }}>Choose a template</p>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map(t => (
                <div key={t.id} onClick={() => setSelectedTemplate(t.id)} className="hcard p-4 cursor-pointer"
                  style={{ borderColor: selectedTemplate === t.id ? t.color : 'var(--bd)', boxShadow: selectedTemplate === t.id ? `0 0 0 2px ${t.color}` : 'none' }}>
                  <span className="text-2xl mb-2 block">{t.icon}</span>
                  <h3 className="text-sm font-bold">{t.title}</h3>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--mu)' }}>{t.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--fa)' }}>Describe your lesson</p>
            <textarea value={topic} onChange={e => setTopic(e.target.value)} className="hinp text-sm" rows={4} placeholder="e.g., 'The Silk Road trade networks 1200-1450' or 'Unit 3: Land-based empires'" />
          </div>
          <button onClick={handleGenerate} disabled={!selectedTemplate || !topic.trim()} className="btnP w-full flex items-center justify-center gap-2 py-3">
            <Sparkles className="w-4 h-4" />Generate Lesson
          </button>
        </div>
      )}

      {phase === 'generating' && (
        <div className="hcard p-8 text-center">
          <div className="text-3xl mb-4"><Sparkles className="w-8 h-8 mx-auto lab-generating" style={{ color: 'var(--ac)' }} /></div>
          <h3 className="text-lg font-bold fs mb-2">Creating your lesson...</h3>
          <p className="text-sm" style={{ color: 'var(--mu)' }}>Building a {TEMPLATES.find(t => t.id === selectedTemplate)?.title.toLowerCase()} about {topic}</p>
          <div className="xpBar w-48 mx-auto mt-4"><div className="xpFill" style={{ width: '60%' }}></div></div>
        </div>
      )}

      {phase === 'preview' && generated && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <button onClick={startOver} className="btnG text-xs py-1.5 px-4">Start Over</button>
            <button onClick={handleSave} disabled={saving} className="btnP text-xs py-1.5 px-6">{saving ? 'Saving...' : 'Save to Library'}</button>
          </div>
          <div className="hcard p-6">
            <span className="text-[10px] font-bold fm uppercase px-2 py-1 rounded" style={{ background: 'var(--acs)', color: 'var(--ac)' }}>{selectedTemplate?.toUpperCase()} — Preview</span>
            <h2 className="text-xl font-bold fs mt-3 mb-2">{generated.title || topic}</h2>

            {selectedTemplate === 'story' && generated.chapters && (
              <div className="space-y-3 mt-4">{generated.chapters.map((ch, i) => (
                <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--elev)', border: '1px solid var(--bd)' }}>
                  <div className="flex items-center gap-2 mb-1"><span>{ch.icon || '📖'}</span><span className="text-sm font-bold">Ch {i + 1}: {ch.title}</span></div>
                  {ch.date && <p className="text-xs" style={{ color: 'var(--mu)' }}>{ch.date}</p>}
                  <div className="text-xs mt-2 fs leading-relaxed" dangerouslySetInnerHTML={{ __html: typeof ch.text === 'string' ? ch.text.substring(0, 200) + '...' : '' }} />
                  {ch.question && <p className="text-[10px] mt-2 font-semibold" style={{ color: 'var(--ry)' }}>Q: {ch.question}</p>}
                </div>
              ))}</div>
            )}

            {selectedTemplate === 'quiz' && generated.questions && (
              <div className="space-y-3 mt-4">{generated.questions.map((q, i) => (
                <div key={i} className="p-3 rounded-lg" style={{ background: 'var(--elev)', border: '1px solid var(--bd)' }}>
                  <p className="text-sm font-semibold mb-2">Q{i + 1}: {q.q}</p>
                  <div className="grid grid-cols-2 gap-1">{q.c?.map((c, ci) => (
                    <span key={ci} className="text-xs p-1.5 rounded" style={{ background: ci === q.a ? 'rgba(77,128,96,.15)' : 'transparent', color: ci === q.a ? 'var(--sg)' : 'var(--mu)' }}>{String.fromCharCode(65 + ci)}. {c}</span>
                  ))}</div>
                </div>
              ))}</div>
            )}

            {(selectedTemplate === 'writing' || selectedTemplate === 'dbq') && (
              <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--elev)', border: '1px solid var(--bd)' }}>
                <p className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--fa)' }}>Type: {generated.type?.toUpperCase() || 'LEQ'}</p>
                <p className="text-sm fs leading-relaxed mt-2">{generated.prompt}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
