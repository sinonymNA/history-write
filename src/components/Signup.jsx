import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { BookOpen, GraduationCap } from 'lucide-react'

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    role: 'student'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { firebase } = useAuth()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!firebase) return

    setLoading(true)
    setError('')

    try {
      const { createUserWithEmailAndPassword } = await import('firebase/auth')
      const { doc, setDoc } = await import('firebase/firestore')

      const userCred = await createUserWithEmailAndPassword(
        firebase.auth,
        formData.email,
        formData.password
      )

      // Save user profile to Firestore
      await setDoc(doc(firebase.db, 'users', userCred.user.uid), {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        studentId: formData.studentId || null,
        gamification: { level: 1, xp: 0 },
        createdAt: new Date()
      })

      // Redirect handled by auth context
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pageEnter relative overflow-hidden bg-[var(--bg)]">
      {/* Decorative SVGs */}
      <svg
        className="illus-hero absolute"
        style={{ top: '12%', right: '8%', opacity: 0.06 }}
        width="140"
        height="140"
        viewBox="0 0 140 140"
        fill="none"
      >
        <circle cx="70" cy="70" r="60" stroke="var(--sg)" strokeWidth="1.5" strokeDasharray="8 6" />
        <path d="M50 95 L70 35 L90 95 Z" stroke="var(--ac)" strokeWidth="1.5" fill="none" />
      </svg>

      <svg
        className="illus-hero float3 absolute"
        style={{ bottom: '10%', left: '6%', opacity: 0.05 }}
        width="100"
        height="100"
        viewBox="0 0 100 100"
        fill="none"
      >
        <rect x="15" y="15" width="70" height="70" rx="10" stroke="var(--ry)" strokeWidth="1.5" strokeDasharray="5 5" />
        <circle cx="50" cy="50" r="18" stroke="var(--gd)" strokeWidth="1" opacity="0.4" />
      </svg>

      {/* Signup card */}
      <div className="hcard w-full max-w-sm p-8 scaleIn relative z-10">
        <h2 className="text-2xl font-bold fs mb-6 text-[var(--tx)]">Join HistoryWrite</h2>

        <form onSubmit={handleSignup} className="space-y-3">
          <input
            name="name"
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="hinp"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="hinp"
          />
          <input
            name="password"
            type="password"
            placeholder="Password (min 6)"
            value={formData.password}
            onChange={handleChange}
            minLength="6"
            required
            className="hinp"
          />
          <input
            name="studentId"
            type="text"
            placeholder="School Student ID (optional — for grade export)"
            value={formData.studentId}
            onChange={handleChange}
            className="hinp mb-4"
          />

          {/* Role selector */}
          <div className="mb-5">
            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block text-[var(--mu)]">
              I am a…
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={formData.role === 'student'}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div
                  className="p-3 rounded-xl text-center transition border"
                  style={{
                    borderColor: formData.role === 'student' ? 'var(--ac)' : 'var(--bd)',
                    background: formData.role === 'student' ? 'var(--acs)' : 'transparent'
                  }}
                >
                  <BookOpen className="w-6 h-6 mx-auto mb-1" style={{ color: 'var(--ac)' }} />
                  <span className="font-semibold text-xs">Student</span>
                </div>
              </label>

              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="teacher"
                  checked={formData.role === 'teacher'}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div
                  className="p-3 rounded-xl text-center transition border"
                  style={{
                    borderColor: formData.role === 'teacher' ? 'var(--ac)' : 'var(--bd)',
                    background: formData.role === 'teacher' ? 'var(--acs)' : 'transparent'
                  }}
                >
                  <GraduationCap className="w-6 h-6 mx-auto mb-1" style={{ color: 'var(--ac)' }} />
                  <span className="font-semibold text-xs">Teacher</span>
                </div>
              </label>
            </div>
          </div>

          {error && <div className="text-sm text-[var(--ac)]">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="btnP w-full"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[var(--mu)]">
          Have an account?{' '}
          <button
            onClick={() => window.location.hash = '#/login'}
            className="font-bold"
            style={{ color: 'var(--ac)' }}
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  )
}
