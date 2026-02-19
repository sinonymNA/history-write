import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { ArrowLeft, Copy, Users, Plus, Download, Trash2, FileText, CheckCircle } from 'lucide-react'

export default function ClassManager() {
  const { user, firebase } = useAuth()
  const [classData, setClassData] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  // Load class data from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('hw_classData')
      if (stored) {
        setClassData(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to load class data:', e)
    }
  }, [])

  // Load assignments from Firestore in real-time
  useEffect(() => {
    if (!firebase?.db || !classData?.id) {
      setLoading(false)
      return
    }

    const q = query(
      collection(firebase.db, 'assignments'),
      where('classId', '==', classData.id)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setAssignments(items)
      setLoading(false)
    }, (err) => {
      console.error('Error loading assignments:', err)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [firebase, classData])

  const copyClassCode = () => {
    if (!classData?.code) return
    navigator.clipboard.writeText(classData.code).then(() => {
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    })
  }

  const handleDeleteClass = async () => {
    if (!firebase?.db || !classData?.id) return
    try {
      await deleteDoc(doc(firebase.db, 'classes', classData.id))
      sessionStorage.removeItem('hw_classData')
      window.location.hash = '#teacher-dash'
    } catch (err) {
      console.error('Error deleting class:', err)
    }
  }

  const handleExportGradebook = () => {
    if (!classData || assignments.length === 0) return
    const headers = ['Assignment', 'Type', 'Submissions']
    const rows = assignments.map(a => [
      a.title || 'Untitled',
      (a.type || 'saq').toUpperCase(),
      a.submissionCount || 0
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${classData.name || 'class'}-gradebook.csv`
    link.click()
    URL.revokeObjectURL(url)
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

  if (!classData) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 pageEnter">
        <button
          onClick={() => window.location.hash = '#teacher-dash'}
          className="btnG text-sm py-2 px-4 flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="hcard p-8 text-center">
          <p style={{ color: 'var(--mu)' }}>No class selected. Return to dashboard to pick a class.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pageEnter">
      {/* Back button */}
      <button
        onClick={() => window.location.hash = '#teacher-dash'}
        className="btnG text-sm py-2 px-4 flex items-center gap-2 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Class header */}
      <div className="hcard p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold fs">{classData.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5" style={{ color: 'var(--mu)' }}>
                <Users className="w-4 h-4" />
                <span className="text-sm">{classData.studentCount || classData.students?.length || 0} students</span>
              </div>
            </div>
          </div>

          {/* Class code */}
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all"
            style={{ background: 'var(--acs)', border: '1px dashed var(--ac)' }}
            onClick={copyClassCode}
            title="Click to copy class code"
          >
            <span className="text-xs font-semibold" style={{ color: 'var(--mu)' }}>Class Code:</span>
            <span className="text-lg font-bold fm tracking-widest" style={{ color: 'var(--ac)' }}>
              {classData.code || '------'}
            </span>
            {codeCopied ? (
              <CheckCircle className="w-4 h-4" style={{ color: 'var(--sg)' }} />
            ) : (
              <Copy className="w-4 h-4" style={{ color: 'var(--ac)' }} />
            )}
          </div>
        </div>

        {/* Button row */}
        <div className="flex flex-wrap gap-2 mt-5 pt-5" style={{ borderTop: '1px solid var(--bd)' }}>
          <button
            onClick={() => {
              sessionStorage.setItem('hw_classData', JSON.stringify(classData))
              window.location.hash = '#assignment-builder'
            }}
            className="btnP text-sm py-2 px-4 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Assignment
          </button>
          <button
            onClick={handleExportGradebook}
            className="btnG text-sm py-2 px-4 flex items-center gap-2"
            disabled={assignments.length === 0}
          >
            <Download className="w-4 h-4" /> Export Gradebook
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="btnG text-sm py-2 px-4 flex items-center gap-2 ml-auto"
            style={{ borderColor: '#c0392b', color: '#c0392b' }}
          >
            <Trash2 className="w-4 h-4" /> Delete Class
          </button>
        </div>
      </div>

      {/* Assignments list */}
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-5 h-5" style={{ color: 'var(--ac)' }} />
        <h2 className="text-lg font-bold fs">Assignments</h2>
        <span className="text-xs px-2 py-0.5 rounded-full fm" style={{ background: 'var(--acs)', color: 'var(--ac)' }}>
          {assignments.length}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: '88px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12" style={{ border: '2px dashed var(--bd)', borderRadius: '16px' }}>
          <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--fa)' }} />
          <p className="text-sm mb-1" style={{ color: 'var(--mu)' }}>No assignments yet</p>
          <p className="text-xs" style={{ color: 'var(--fa)' }}>
            Click "New Assignment" to create your first one.
          </p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {assignments.map(a => (
            <div
              key={a.id}
              className="hcard p-5 cursor-pointer"
              onClick={() => {
                sessionStorage.setItem('hw_assignmentData', JSON.stringify(a))
                window.location.hash = '#assignment-detail'
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {getTypeBadge(a.type)}
                    <h3 className="font-bold text-sm truncate">{a.title || 'Untitled Assignment'}</h3>
                  </div>
                  <p className="text-xs line-clamp-2" style={{ color: 'var(--mu)' }}>
                    {a.prompt ? (a.prompt.substring(0, 140) + (a.prompt.length > 140 ? '...' : '')) : 'No prompt provided'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                    style={{ background: 'var(--elev)', color: 'var(--mu)' }}
                  >
                    <FileText className="w-3 h-3" />
                    {a.submissionCount || 0} submitted
                  </div>
                  {a.maxAttempts && (
                    <span className="text-[10px]" style={{ color: 'var(--fa)' }}>
                      Max {a.maxAttempts} attempts
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50">
          <div className="modalBg" onClick={() => setConfirmDelete(false)}>
            <div className="modalBox" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
              <div className="text-center mb-4">
                <div
                  className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ background: 'rgba(192,57,43,.1)' }}
                >
                  <Trash2 className="w-7 h-7" style={{ color: '#c0392b' }} />
                </div>
                <h3 className="text-lg font-bold">Delete Class</h3>
                <p className="text-sm mt-2" style={{ color: 'var(--mu)' }}>
                  Are you sure you want to delete <strong>"{classData.name}"</strong>? This action cannot be undone.
                  All assignments and student data will be permanently removed.
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="btnG flex-1">Cancel</button>
                <button
                  onClick={handleDeleteClass}
                  className="btnP flex-1"
                  style={{ background: '#c0392b' }}
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
