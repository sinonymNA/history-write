import { useState, useCallback } from 'react'
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { firebaseDb } from '../lib/firebase'

export function useStudent(userId) {
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const joinClass = useCallback(async (classCode) => {
    if (!userId) return { success: false, error: 'User not authenticated' }

    setLoading(true)
    setError(null)

    try {
      // Query for class by code
      const q = query(collection(firebaseDb, 'classes'), where('code', '==', classCode))
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        return { success: false, error: 'Class code not found' }
      }

      const classDoc = snapshot.docs[0]
      const classId = classDoc.id
      const classData = classDoc.data()

      // Add student to class's students array
      if (!classData.students) classData.students = []
      classData.students.push(userId)

      await updateDoc(doc(firebaseDb, 'classes', classId), {
        students: classData.students
      })

      return { success: true, classId }
    } catch (err) {
      const message = err.message || 'Failed to join class'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [userId])

  const loadAssignments = useCallback(async (classId) => {
    setLoading(true)
    setError(null)

    try {
      const q = query(collection(firebaseDb, 'assignments'), where('classId', '==', classId))
      const snapshot = await getDocs(q)
      const assignmentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setAssignments(assignmentData)
      return assignmentData
    } catch (err) {
      const message = err.message || 'Failed to load assignments'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const submitEssay = useCallback(async (assignmentId, essayContent, essayType) => {
    if (!userId) return { success: false, error: 'User not authenticated' }

    setLoading(true)
    setError(null)

    try {
      const submission = {
        assignmentId,
        studentId: userId,
        essayContent,
        essayType,
        submittedAt: serverTimestamp(),
        status: 'submitted',
        score: null,
        feedback: null
      }

      const docRef = await addDoc(collection(firebaseDb, 'submissions'), submission)

      setSubmissions(prev => [...prev, { id: docRef.id, ...submission }])
      return { success: true, submissionId: docRef.id }
    } catch (err) {
      const message = err.message || 'Failed to submit essay'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [userId])

  const loadSubmissions = useCallback(async () => {
    if (!userId) return []

    setLoading(true)
    setError(null)

    try {
      const q = query(collection(firebaseDb, 'submissions'), where('studentId', '==', userId))
      const snapshot = await getDocs(q)
      const submissionData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setSubmissions(submissionData)
      return submissionData
    } catch (err) {
      const message = err.message || 'Failed to load submissions'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [userId])

  return {
    assignments,
    submissions,
    loading,
    error,
    joinClass,
    loadAssignments,
    submitEssay,
    loadSubmissions
  }
}
