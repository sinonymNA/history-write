import { useState, useEffect, useCallback } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { firebaseAuth, firebaseDb } from '../lib/firebase'

export function useFirebase() {
  const [currentUser, setCurrentUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        setCurrentUser(user)
        try {
          const userDocSnap = await getDoc(doc(firebaseDb, 'users', user.uid))
          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data())
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        }
      } else {
        setCurrentUser(null)
        setUserData(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  const signup = useCallback(async (name, email, password, role, studentId = null) => {
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password)

      // Create user profile document
      const userData = {
        name,
        email,
        role,
        createdAt: serverTimestamp(),
        gamification: role === 'student' ? {
          level: 1,
          xp: 0,
          xpToNextLevel: 100,
          currentPlants: [],
          harvestedSeeds: 0,
          skillPoints: 0,
          milestones: {}
        } : null
      }

      if (studentId?.trim()) {
        userData.studentId = studentId.trim()
      }

      await setDoc(doc(firebaseDb, 'users', cred.user.uid), userData)
      await updateProfile(cred.user, { displayName: name })

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await signOut(firebaseAuth)
      setCurrentUser(null)
      setUserData(null)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  return {
    currentUser,
    userData,
    loading,
    login,
    signup,
    logout,
    firebase: { auth: firebaseAuth, db: firebaseDb }
  }
}
