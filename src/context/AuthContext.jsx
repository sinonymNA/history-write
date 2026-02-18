import { createContext, useContext, useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [firebase, setFirebase] = useState(null)

  useEffect(() => {
    // Initialize Firebase (config will be provided by user)
    try {
      const firebaseConfig = {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY || '',
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.REACT_APP_FIREBASE_APP_ID || ''
      }

      const app = initializeApp(firebaseConfig)
      const auth = getAuth(app)
      const db = getFirestore(app)

      setFirebase({ app, auth, db })

      // Listen for auth changes
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser)
        if (currentUser) {
          // Load user data from Firestore
          try {
            const userDocRef = db.collection('users').doc(currentUser.uid)
            userDocRef.onSnapshot((doc) => {
              if (doc.exists) {
                setUserData(doc.data())
              }
            })
          } catch (error) {
            console.error('Error loading user data:', error)
          }
        } else {
          setUserData(null)
        }
        setAuthLoading(false)
      })

      return unsubscribe
    } catch (error) {
      console.error('Firebase initialization error:', error)
      setAuthLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, userData, authLoading, firebase }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
