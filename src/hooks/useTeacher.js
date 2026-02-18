import { useState, useCallback } from 'react'
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { firebaseDb } from '../lib/firebase'

export function useTeacher(userId) {
  const [classes, setClasses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const createClass = useCallback(async (className) => {
    if (!userId) return { success: false, error: 'User not authenticated' }

    setLoading(true)
    setError(null)

    try {
      const code = 'HIST-' + Math.floor(1000 + Math.random() * 9000)

      const newClass = {
        name: className,
        code,
        teacherId: userId,
        students: [],
        createdAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(firebaseDb, 'classes'), newClass)

      setClasses(prev => [...prev, { id: docRef.id, ...newClass }])
      return { success: true, classId: docRef.id }
    } catch (err) {
      const message = err.message || 'Failed to create class'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [userId])

  const createAssignment = useCallback(async (classId, assignmentData) => {
    if (!userId) return { success: false, error: 'User not authenticated' }

    setLoading(true)
    setError(null)

    try {
      const newAssignment = {
        classId,
        title: assignmentData.title,
        type: assignmentData.type, // 'saq', 'leq', 'dbq'
        prompt: assignmentData.prompt,
        maxAttempts: assignmentData.maxAttempts || 3,
        teacherId: userId,
        createdAt: serverTimestamp(),
        submissionsCount: 0,
        structure: assignmentData.structure || null
      }

      const docRef = await addDoc(collection(firebaseDb, 'assignments'), newAssignment)

      setAssignments(prev => [...prev, { id: docRef.id, ...newAssignment }])
      return { success: true, assignmentId: docRef.id }
    } catch (err) {
      const message = err.message || 'Failed to create assignment'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [userId])

  const loadClasses = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const q = query(collection(firebaseDb, 'classes'), where('teacherId', '==', userId))
      const snapshot = await getDocs(q)
      const classData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setClasses(classData)
      return classData
    } catch (err) {
      const message = err.message || 'Failed to load classes'
      setError(message)
      return []
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

  return {
    classes,
    assignments,
    loading,
    error,
    createClass,
    createAssignment,
    loadClasses,
    loadAssignments
  }
}
