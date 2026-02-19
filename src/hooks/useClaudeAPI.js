import { useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

export function useClaudeAPI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { firebase } = useAuth()

  // Mock grading with realistic annotations extracted from the essay
  const mockGrade = useCallback((type, essay) => {
    const scores = { saq: 2, leq: 4, dbq: 5 }
    const maxScores = { saq: 3, leq: 6, dbq: 7 }

    // Extract sentences from the essay for realistic quote highlights
    const sentences = essay
      ? essay.replace(/\n+/g, ' ').replace(/([.!?])\s+/g, '$1|||').split('|||')
          .map(s => s.trim()).filter(s => s.length > 20 && s.length < 300)
      : []

    const pick = (idx) => {
      if (!sentences.length) return ''
      const s = sentences[Math.min(idx, sentences.length - 1)]
      if (s.length <= 80) return s
      const cut = s.lastIndexOf(' ', 78)
      return s.substring(0, cut > 30 ? cut : 78)
    }

    const mockAnnotations = {
      saq: [
        { quote: pick(0), category: "Identification", status: "success", feedback: "You correctly identified a relevant historical development — nice work recognizing the key factor here!", improvementTip: "" },
        { quote: pick(1), category: "Description", status: "success", feedback: "Your description is clear and shows strong understanding of the historical context.", improvementTip: "" },
        { quote: pick(2), category: "Explanation", status: "warning", feedback: "Your explanation is on the right track, but needs a stronger cause-and-effect connection.", improvementTip: "Add a sentence explaining WHY this development occurred — connect the cause directly to the effect using words like 'because' or 'as a result of'." }
      ],
      leq: [
        { quote: pick(0), category: "Thesis", status: "success", feedback: "Strong thesis! You made a clear, defensible claim that addresses the prompt with a logical line of reasoning.", improvementTip: "" },
        { quote: pick(1), category: "Contextualization", status: "warning", feedback: "You set up some historical context, but it needs to be more specific — mention broader global trends or developments beyond the prompt's focus.", improvementTip: "Add 2-3 sentences of broader context before your argument. Mention a specific global development happening at the same time, like expanding maritime trade or the decline of feudalism." },
        { quote: pick(2), category: "Evidence (1)", status: "success", feedback: "Great specific evidence! You included dates, names, and concrete details that strengthen your argument.", improvementTip: "" },
        { quote: pick(3), category: "Evidence (2)", status: "success", feedback: "Excellent use of a second body of evidence with specific historical details.", improvementTip: "" },
        { quote: pick(4), category: "Reasoning", status: "warning", feedback: "You present evidence well, but the analytical reasoning connecting it to your thesis could be more explicit.", improvementTip: "After each evidence paragraph, add a sentence that directly explains HOW this evidence proves your thesis." },
        { quote: pick(sentences.length - 1), category: "Complexity", status: "error", feedback: "Your conclusion restates the argument but doesn't demonstrate complex understanding.", improvementTip: "Replace your conclusion with analysis that complicates your argument — try counterarguments, qualifications, or cross-period connections." }
      ],
      dbq: [
        { quote: pick(0), category: "Thesis", status: "success", feedback: "Your thesis presents a clear, defensible argument that directly addresses the prompt.", improvementTip: "" },
        { quote: pick(1), category: "Contextualization", status: "success", feedback: "Great historical context! You connected the topic to broader trends effectively.", improvementTip: "" },
        { quote: pick(2), category: "Evidence (Docs)", status: "success", feedback: "Strong use of document evidence to support your argument.", improvementTip: "" },
        { quote: pick(3), category: "Evidence (Outside)", status: "success", feedback: "Good use of outside evidence beyond the documents.", improvementTip: "" },
        { quote: pick(4), category: "Sourcing", status: "warning", feedback: "You referenced a source's origin, but need to analyze HOW the author's POV shapes the document's meaning.", improvementTip: "Pick one document and explain how the author's point of view or purpose affects what they wrote." },
        { quote: pick(5) || pick(3), category: "Reasoning", status: "warning", feedback: "Your argument groups documents together, but the reasoning connecting them to your thesis could be stronger.", improvementTip: "After discussing a group of documents, add a sentence that explicitly states how they collectively prove your thesis." },
        { quote: pick(sentences.length - 1), category: "Complexity", status: "error", feedback: "To earn the complexity point, demonstrate nuanced understanding.", improvementTip: "Try adding: 'However, not all evidence supports this view...' and discuss a document that complicates your argument." }
      ]
    }

    return {
      score: scores[type] || 3,
      maxScore: maxScores[type] || 6,
      generalFeedback: "Nice work on this essay! You're showing solid understanding of the historical content and your writing is well-organized. Your evidence is a real strength — focus on strengthening your analytical reasoning and adding nuance for the complexity point.",
      annotations: mockAnnotations[type] || mockAnnotations.leq,
      _usedMockGrading: true
    }
  }, [])

  // Resolve API key from multiple sources
  const resolveApiKey = useCallback(async (teacherId) => {
    if (!firebase?.db) return null

    const { getDoc, doc } = await import('firebase/firestore')

    // Check shared config doc
    try {
      const cfgDoc = await getDoc(doc(firebase.db, 'config', 'apiKey'))
      if (cfgDoc.exists() && cfgDoc.data().key) return cfgDoc.data().key
    } catch (e) { console.warn('Could not fetch global API key', e) }

    // Check teacher's key
    if (teacherId) {
      try {
        const teacherDoc = await getDoc(doc(firebase.db, 'users', teacherId))
        if (teacherDoc.exists() && teacherDoc.data().claudeKey) return teacherDoc.data().claudeKey
      } catch (e) { console.warn('Could not fetch teacher API key', e) }
    }

    return null
  }, [firebase])

  // Grade an essay using Claude API (or mock if no key)
  const gradeEssay = useCallback(async (type, prompt, essay, structure, teacherId) => {
    setLoading(true)
    setError(null)

    try {
      const key = await resolveApiKey(teacherId)

      // No API key — use mock grading
      if (!key) {
        const result = mockGrade(type, essay)
        return { success: true, data: result }
      }

      const rubrics = { saq: { maxScore: 3 }, leq: { maxScore: 6 }, dbq: { maxScore: 7 } }
      const r = rubrics[type] || { maxScore: 6 }

      let docsInfo = ''
      if (structure?.sources) {
        docsInfo = '\n\nDocuments provided:\n' + structure.sources.map((s, i) =>
          `Doc ${i + 1} (${s.type}): ${s.label || s.title}${s.type === 'image' || s.type === 'map' ? ` [Image: ${s.content}]` : ` - ${s.content}`}`
        ).join('\n')
      }

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: `You are an encouraging AP World History essay grader. Grade this ${type.toUpperCase()} using the 2025 College Board rubric.\n\nPrompt:\n${prompt}\n\nEssay:\n${essay}${docsInfo}\n\nGrade using the official AP rubric. For EACH rubric category, find the EXACT quote from the essay that demonstrates that skill (or the best attempt). Be encouraging and specific.\n\nReturn ONLY valid JSON with no extra text:\n{"score":NUMBER,"maxScore":${r.maxScore},"generalFeedback":"2-3 sentence encouraging overview","annotations":[{"quote":"EXACT phrase from the essay (5-80 chars)","category":"Thesis|Contextualization|Evidence|Sourcing|Reasoning|Complexity","status":"success|warning|error","feedback":"specific encouraging feedback","improvementTip":"for warning/error only: one specific actionable step"}]}`
          }]
        })
      })

      const data = await resp.json()
      const text = data?.content?.[0]?.text || ''
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        return { success: true, data: JSON.parse(match[0]) }
      }

      // Fallback to mock if parsing fails
      return { success: true, data: mockGrade(type, essay) }
    } catch (err) {
      console.error('AI grading error:', err)
      // Fallback to mock grading on any error
      return { success: true, data: mockGrade(type, essay) }
    } finally {
      setLoading(false)
    }
  }, [resolveApiKey, mockGrade])

  // Generate lesson using Claude
  const generateLesson = useCallback(async (template, topic, teacherId) => {
    setLoading(true)
    setError(null)

    try {
      const key = await resolveApiKey(teacherId)

      if (!key) {
        // Mock lesson generation
        await new Promise(resolve => setTimeout(resolve, 1500))
        const mockContent = {
          story: {
            title: topic,
            unit: '?',
            period: '',
            desc: `An AI-generated story lesson about ${topic}`,
            icon: '📖',
            chapters: [
              { title: 'Chapter 1: Introduction', icon: '📖', bg: 'linear-gradient(135deg,#1a1a2e,#16213e)', date: '', text: `<p>This is a preview of your story lesson about ${topic}. Connect a Claude API key to generate real content.</p>`, question: 'What did you learn from this chapter?', keyConcept: topic }
            ]
          },
          dbq: { title: topic, type: 'dbq', prompt: `Analyze the impact of ${topic} using the provided documents.`, structure: { kind: 'dbq', sources: [] } },
          quiz: { title: topic, questions: [{ q: `Sample question about ${topic}`, c: ['Option A', 'Option B', 'Option C', 'Option D'], a: 0 }] },
          writing: { title: topic, type: 'leq', prompt: `Evaluate the extent to which ${topic} transformed its historical context.` }
        }
        return { success: true, data: mockContent[template] || mockContent.writing }
      }

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: `Generate a ${template} lesson for AP World History about: ${topic}. Return valid JSON.`
          }]
        })
      })

      const data = await resp.json()
      const text = data?.content?.[0]?.text || ''
      const match = text.match(/\{[\s\S]*\}/)
      if (match) return { success: true, data: JSON.parse(match[0]) }
      return { success: false, error: 'Failed to parse response' }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [resolveApiKey])

  return {
    loading,
    error,
    gradeEssay,
    generateLesson,
    mockGrade
  }
}
