// Firebase configuration will be initialized through AuthContext
// This file exports utility functions for Firebase operations

export const firebaseConfig = {
  // User will provide these via environment variables
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || '',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || ''
}

// Firestore collections structure:
// users/{uid} - User profiles and settings
// classes/{classId} - Teacher classes
// assignments/{assignmentId} - Essay assignments
// submissions/{submissionId} - Student essay submissions
// teacherLessons/{lessonId} - Saved lesson templates
// quizGames/{gameId} - Live quiz sessions
// config/apiKey - Shared Anthropic API key (optional)
