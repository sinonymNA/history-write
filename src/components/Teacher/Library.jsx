import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { ArrowLeft, BookOpen, Search, Copy, Filter, BookMarked } from 'lucide-react'

const LIBRARY_TEMPLATES = [
  {
    id: 'tpl-1',
    type: 'saq',
    title: 'Columbian Exchange SAQ',
    prompt: 'a) Identify ONE biological exchange that occurred as a result of the Columbian Exchange.\nb) Explain ONE economic effect of the Columbian Exchange on the Americas.\nc) Explain ONE way the Columbian Exchange affected population patterns in Afro-Eurasia.',
    difficulty: 'Easy',
    saqParts: 3,
    maxAttempts: 3
  },
  {
    id: 'tpl-2',
    type: 'leq',
    title: 'Maritime Empires LEQ',
    prompt: 'Evaluate the extent to which maritime empires in the period 1450-1750 transformed global trade networks.',
    difficulty: 'Medium',
    focusSkills: ['thesis', 'contextualization', 'evidence', 'reasoning'],
    maxAttempts: 2
  },
  {
    id: 'tpl-3',
    type: 'dbq',
    title: 'Imperialism in Africa DBQ',
    prompt: 'Using the documents provided and your knowledge of world history, evaluate the extent to which European imperialism in Africa was driven by economic motives versus ideological justifications in the period 1750-1900.',
    difficulty: 'Hard',
    documents: [
      { type: 'text', label: 'Document A', content: 'Excerpt from King Leopold II\'s letter to Belgian missionaries, 1883: "Your essential role is to facilitate the task of administrators and industrials..."' },
      { type: 'text', label: 'Document B', content: 'Rudyard Kipling, "The White Man\'s Burden," 1899: "Take up the White Man\'s burden / Send forth the best ye breed..."' },
      { type: 'map', label: 'Document C', content: 'Map of the Scramble for Africa showing colonial claims after the Berlin Conference (1884-1885).' }
    ],
    maxAttempts: 2
  },
  {
    id: 'tpl-4',
    type: 'saq',
    title: 'Mongol Empire SAQ',
    prompt: 'a) Identify ONE way the Mongol Empire facilitated trade across Eurasia.\nb) Explain ONE negative consequence of Mongol expansion.\nc) Explain how the Mongol Empire contributed to cultural exchange between East and West.',
    difficulty: 'Easy',
    saqParts: 3,
    maxAttempts: 3
  },
  {
    id: 'tpl-5',
    type: 'leq',
    title: 'Industrial Revolution LEQ',
    prompt: 'Evaluate the extent to which the Industrial Revolution (1750-1900) changed social structures in ONE of the following regions: Europe, East Asia, or Latin America.',
    difficulty: 'Medium',
    focusSkills: ['thesis', 'evidence', 'reasoning'],
    maxAttempts: 2
  },
  {
    id: 'tpl-6',
    type: 'dbq',
    title: 'Silk Road Cultural Exchange DBQ',
    prompt: 'Using the documents and your knowledge of world history, analyze the ways in which trade along the Silk Road facilitated cultural exchange and transformation in the period 600-1450 CE.',
    difficulty: 'Hard',
    documents: [
      { type: 'text', label: 'Document A', content: 'Ibn Battuta, Rihla (Travels), c. 1355: describing the shared Islamic customs and legal systems he encountered from Morocco to China.' },
      { type: 'image', label: 'Document B', content: 'Greco-Buddhist sculpture from Gandhara (2nd century CE) showing the Buddha rendered in Hellenistic artistic style.' },
      { type: 'text', label: 'Document C', content: 'Marco Polo, The Travels, c. 1300: "The city of Kinsay [Hangzhou] is the greatest city in the world..."' },
      { type: 'chart', label: 'Document D', content: 'Chart showing the spread of religions along Silk Road routes, 200 BCE - 1400 CE.' }
    ],
    maxAttempts: 2
  }
]

export default function Library() {
  const { user, firebase } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState(null)
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [cloning, setCloning] = useState(null)
  const [cloneSuccess, setCloneSuccess] = useState(null)
  const [stories, setStories] = useState([])

  // Load teacher's classes
  useEffect(() => {
    if (!firebase?.db || !user) {
      setLoadingClasses(false)
      return
    }

    const loadClasses = async () => {
      try {
        const q = query(
          collection(firebase.db, 'classes'),
          where('teacherId', '==', user.uid)
        )
        const snapshot = await getDocs(q)
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        setClasses(items)
        if (items.length > 0) setSelectedClassId(items[0].id)
      } catch (err) {
        console.error('Error loading classes:', err)
      } finally {
        setLoadingClasses(false)
      }
    }

    loadClasses()
  }, [firebase, user])

  // Load story lessons from Firestore (teacher-created)
  useEffect(() => {
    if (!firebase?.db || !user) return

    const loadStories = async () => {
      try {
        const q = query(
          collection(firebase.db, 'teacherLessons'),
          where('teacherId', '==', user.uid),
          where('templateType', '==', 'story')
        )
        const snapshot = await getDocs(q)
        setStories(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error('Error loading stories:', err)
      }
    }

    loadStories()
  }, [firebase, user])

  const handleCloneToClass = async (template) => {
    if (!selectedClassId || !firebase?.db || !user) return

    setCloning(template.id)
    try {
      const assignmentData = {
        title: template.title,
        type: template.type,
        prompt: template.prompt,
        maxAttempts: template.maxAttempts || 3,
        classId: selectedClassId,
        teacherId: user.uid,
        submissionCount: 0,
        clonedFromTemplate: template.id,
        createdAt: serverTimestamp()
      }

      if (template.type === 'saq' && template.saqParts) {
        assignmentData.saqParts = template.saqParts
      }
      if (template.type === 'leq' && template.focusSkills) {
        assignmentData.focusSkills = template.focusSkills
      }
      if (template.type === 'dbq' && template.documents) {
        assignmentData.documents = template.documents
      }

      await addDoc(collection(firebase.db, 'assignments'), assignmentData)
      setCloneSuccess(template.id)
      setTimeout(() => setCloneSuccess(null), 2500)
    } catch (err) {
      console.error('Error cloning template:', err)
    } finally {
      setCloning(null)
    }
  }

  const getTypeBadge = (type) => {
    const t = (type || 'saq').toLowerCase()
    const config = {
      saq: { label: 'SAQ', bg: 'rgba(77,128,96,.1)', color: 'var(--sg)' },
      leq: { label: 'LEQ', bg: 'rgba(92,109,179,.1)', color: 'var(--ry)' },
      dbq: { label: 'DBQ', bg: 'var(--acs)', color: 'var(--ac)' }
    }
    const c = config[t] || config.saq
    return (
      <span
        className="text-[10px] font-bold fm uppercase px-2 py-1 rounded"
        style={{ background: c.bg, color: c.color }}
      >
        {c.label}
      </span>
    )
  }

  const getDiffBadge = (difficulty) => {
    const d = (difficulty || 'Medium').toLowerCase()
    const icons = { easy: '🟢', medium: '🟡', hard: '🔴' }
    return <span className="text-[10px]">{icons[d] || '🟡'} {difficulty}</span>
  }

  // Filter templates
  const filteredTemplates = LIBRARY_TEMPLATES.filter(tpl => {
    const matchesType = filterType === 'all' || tpl.type === filterType
    const matchesSearch = !searchQuery ||
      tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pageEnter">
      {/* Back button */}
      <button
        onClick={() => window.location.hash = '#teacher-dash'}
        className="btnG text-sm py-2 px-4 flex items-center gap-2 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
          style={{ background: 'linear-gradient(135deg,var(--ry),var(--gd))' }}
        >
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold fs">Lesson Library</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--mu)' }}>
            Browse templates and clone them to your classes with one click.
          </p>
        </div>
      </div>

      {/* Class selector bar */}
      <div className="hcard p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <BookMarked className="w-4 h-4" style={{ color: 'var(--ac)' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--fa)' }}>
            Clone to Class
          </span>
        </div>
        {loadingClasses ? (
          <div className="skeleton" style={{ height: '36px', width: '200px', borderRadius: '10px' }} />
        ) : classes.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--mu)' }}>
            No classes found. Create a class first to clone templates.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {classes.map(cls => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className="text-xs font-semibold py-1.5 px-3 rounded-lg transition-all"
                style={{
                  background: selectedClassId === cls.id ? 'var(--ac)' : 'var(--elev)',
                  color: selectedClassId === cls.id ? '#fff' : 'var(--tx)',
                  border: `1px solid ${selectedClassId === cls.id ? 'var(--ac)' : 'var(--bd)'}`
                }}
              >
                {cls.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search / Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 hcard p-3 flex items-center gap-2" style={{ padding: '8px 14px' }}>
          <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--mu)' }} />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--tx)' }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" style={{ color: 'var(--mu)' }} />
          {['all', 'saq', 'leq', 'dbq'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className="text-xs font-semibold py-1.5 px-3 rounded-lg transition-all"
              style={{
                background: filterType === t ? 'var(--acs)' : 'transparent',
                color: filterType === t ? 'var(--ac)' : 'var(--mu)',
                border: `1px solid ${filterType === t ? 'var(--ac)' : 'var(--bd)'}`
              }}
            >
              {t === 'all' ? 'All' : t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Template cards */}
      <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--fa)' }}>
        AP World History Templates
      </h2>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12" style={{ border: '2px dashed var(--bd)', borderRadius: '16px' }}>
          <BookOpen className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--fa)' }} />
          <p className="text-sm" style={{ color: 'var(--mu)' }}>No templates match your search.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger mb-8">
          {filteredTemplates.map(tpl => (
            <div key={tpl.id} className="hcard p-5 flex flex-col justify-between">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  {getTypeBadge(tpl.type)}
                  {getDiffBadge(tpl.difficulty)}
                </div>
                <h3 className="font-bold text-sm mb-1">{tpl.title}</h3>
                <p className="text-xs line-clamp-3" style={{ color: 'var(--mu)' }}>
                  {tpl.prompt.substring(0, 120)}{tpl.prompt.length > 120 ? '...' : ''}
                </p>
              </div>
              <button
                onClick={() => handleCloneToClass(tpl)}
                disabled={!selectedClassId || cloning === tpl.id}
                className="btnP text-xs w-full flex items-center justify-center gap-2"
                style={cloneSuccess === tpl.id ? { background: 'var(--sg)' } : {}}
              >
                {cloneSuccess === tpl.id ? (
                  <>Cloned!</>
                ) : cloning === tpl.id ? (
                  <>Cloning...</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Clone to Class</>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Story lessons section */}
      {stories.length > 0 && (
        <>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3 mt-8" style={{ color: 'var(--fa)' }}>
            Your Story Lessons
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
            {stories.map(story => (
              <div key={story.id} className="hcard p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[10px] font-bold fm uppercase px-2 py-1 rounded"
                    style={{ background: 'rgba(196,149,40,.1)', color: 'var(--gd)' }}
                  >
                    STORY
                  </span>
                </div>
                <h3 className="font-bold text-sm mb-1">{story.title || 'Untitled Story'}</h3>
                <p className="text-xs line-clamp-2" style={{ color: 'var(--mu)' }}>
                  {story.content?.substring(0, 100) || 'No preview available'}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
