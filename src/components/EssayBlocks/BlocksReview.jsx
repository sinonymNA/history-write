import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ArrowLeft, ThumbsUp } from 'lucide-react'

export default function BlocksReview() {
  const { user, userData, firebase } = useAuth()
  const [sessionId, setSessionId] = useState(null)
  const [sessionData, setSessionData] = useState(null)
  const [groups, setGroups] = useState([])
  const [voted, setVoted] = useState(false)
  const [results, setResults] = useState(null)
  const [phase, setPhase] = useState('review')

  useEffect(() => {
    const params = JSON.parse(sessionStorage.getItem('blocksParams') || '{}')
    if (params.sessionId) setSessionId(params.sessionId)
  }, [])

  useEffect(() => {
    if (!sessionId || !firebase?.db) return
    let mounted = true
    const setup = async () => {
      const { doc, onSnapshot } = await import('firebase/firestore')
      return onSnapshot(doc(firebase.db, 'blockSessions', sessionId), snap => {
        if (!snap.exists() || !mounted) return
        const data = snap.data()
        setSessionData(data)
        if (data.status === 'results') { setPhase('results'); setResults(data.results || null) }
        if (data.groups) setGroups(data.groups)
      })
    }
    let unsub
    setup().then(u => { unsub = u })
    return () => { mounted = false; unsub?.() }
  }, [sessionId, firebase])

  const handleVote = async (groupIdx) => {
    if (voted || !firebase?.db || !sessionId) return
    setVoted(true)
    try {
      const { updateDoc, doc, arrayUnion } = await import('firebase/firestore')
      await updateDoc(doc(firebase.db, 'blockSessions', sessionId), { [`votes.group${groupIdx}`]: arrayUnion(user?.uid) })
    } catch (e) { console.error('Vote error:', e) }
  }

  const handleFinish = async () => {
    if (!firebase?.db || !sessionId) return
    try {
      const { updateDoc, doc } = await import('firebase/firestore')
      const voteCounts = groups.map((_, i) => sessionData?.votes?.[`group${i}`]?.length || 0)
      const winnerIdx = voteCounts.indexOf(Math.max(...voteCounts))
      await updateDoc(doc(firebase.db, 'blockSessions', sessionId), { status: 'results', results: { winnerIdx, voteCounts } })
    } catch (e) { console.error('Finish error:', e) }
  }

  const exit = () => { window.location.hash = userData?.role === 'teacher' ? '#teacher-dash' : '#student-dash' }
  const isTeacher = userData?.role === 'teacher'

  return (
    <div className="eb-wrap pageEnter" style={{ maxWidth: 800 }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={exit} className="text-sm flex items-center gap-1" style={{ color: 'var(--mu)' }}><ArrowLeft className="w-4 h-4" />Back</button>
        <span className="eb-block-label">Review Phase</span>
      </div>

      <h1 className="text-2xl font-bold fs mb-2">Grade the Essays!</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--mu)' }}>Read each group's essay and vote for the best one.</p>

      {phase === 'review' && (
        <>
          <div className="space-y-6 stagger">
            {groups.map((group, idx) => (
              <div key={idx} className="hcard p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold" style={{ color: 'var(--ac)' }}>Group {idx + 1}</h3>
                  {!voted && !isTeacher && (
                    <button onClick={() => handleVote(idx)} className="btnG text-xs py-1.5 px-4 flex items-center gap-1"><ThumbsUp className="w-3 h-3" />Vote</button>
                  )}
                  {voted && sessionData?.votes?.[`group${idx}`]?.includes(user?.uid) && (
                    <span className="text-xs font-semibold" style={{ color: 'var(--sg)' }}>Your vote</span>
                  )}
                </div>
                <div className="space-y-3">
                  {group.blocks?.map((block, bi) => (
                    <div key={bi} className="p-3 rounded-lg" style={{ background: 'var(--elev)', border: '1px solid var(--bd)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{block.emoji}</span>
                        <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--ac)' }}>{block.label}</span>
                        {block.authorName && <span className="text-[10px]" style={{ color: 'var(--fa)' }}>— {block.authorName}</span>}
                      </div>
                      <p className="text-sm fs leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{block.text}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs" style={{ color: 'var(--fa)' }}>{sessionData?.votes?.[`group${idx}`]?.length || 0} vote{(sessionData?.votes?.[`group${idx}`]?.length || 0) !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>

          {groups.length === 0 && <div className="hcard p-6 text-center"><p className="text-sm" style={{ color: 'var(--mu)' }}>Waiting for group essays...</p></div>}

          {isTeacher && groups.length > 0 && <div className="mt-6 text-center"><button onClick={handleFinish} className="btnP text-sm px-8 py-3">Finish & Show Results</button></div>}
        </>
      )}

      {phase === 'results' && results && (
        <div className="text-center pageEnter">
          <div className="hcard p-8 mb-6">
            <span className="text-4xl">🏆</span>
            <h2 className="text-xl font-bold fs mt-3">Group {results.winnerIdx + 1} Wins!</h2>
            <p className="text-sm mt-2" style={{ color: 'var(--mu)' }}>With {results.voteCounts?.[results.winnerIdx] || 0} votes</p>
          </div>
          <div className="space-y-2 mb-6">
            {results.voteCounts?.map((count, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--elev)', border: '1px solid var(--bd)' }}>
                <span className="text-sm font-bold" style={{ color: i === results.winnerIdx ? 'var(--ac)' : 'var(--mu)' }}>Group {i + 1}</span>
                <div className="flex-1 xpBar"><div className="xpFill" style={{ width: `${Math.max(5, (count / Math.max(1, groups.length)) * 100)}%` }}></div></div>
                <span className="text-xs fm font-bold" style={{ color: 'var(--mu)' }}>{count}</span>
              </div>
            ))}
          </div>
          <button onClick={exit} className="btnP text-sm px-8 py-3">Back to Dashboard</button>
        </div>
      )}
    </div>
  )
}
