import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { firebase } = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!firebase) return

    setLoading(true)
    setError('')

    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      await signInWithEmailAndPassword(firebase.auth, email, password)
      window.location.hash = '#home'
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
        style={{ top: '10%', left: '8%', opacity: 0.06 }}
        width="160"
        height="160"
        viewBox="0 0 160 160"
        fill="none"
      >
        <circle cx="80" cy="80" r="70" stroke="var(--ac)" strokeWidth="1.5" strokeDasharray="10 8" />
        <path d="M50 110 L80 40 L110 110" stroke="var(--gd)" strokeWidth="1.5" fill="none" />
        <circle cx="80" cy="75" r="15" stroke="var(--ry)" strokeWidth="1" opacity="0.4" />
      </svg>

      <svg
        className="illus-hero float2 absolute"
        style={{ bottom: '15%', right: '10%', opacity: 0.05 }}
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
      >
        <rect x="10" y="10" width="100" height="100" rx="12" stroke="var(--sg)" strokeWidth="1.5" strokeDasharray="6 4" />
        <line x1="30" y1="40" x2="90" y2="40" stroke="var(--sg)" strokeWidth="1" opacity="0.4" />
        <line x1="30" y1="60" x2="75" y2="60" stroke="var(--sg)" strokeWidth="1" opacity="0.4" />
        <line x1="30" y1="80" x2="65" y2="80" stroke="var(--sg)" strokeWidth="1" opacity="0.4" />
      </svg>

      {/* Login card */}
      <div className="hcard w-full max-w-sm p-8 scaleIn relative z-10">
        <h2 className="text-2xl font-bold fs mb-6 text-[var(--tx)]">Welcome back</h2>

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="hinp"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="hinp mb-5"
          />

          {error && <div className="text-sm text-[var(--ac)]">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="btnP w-full"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[var(--mu)]">
          No account?{' '}
          <button
            onClick={() => window.location.hash = '#signup'}
            className="font-bold"
            style={{ color: 'var(--ac)' }}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  )
}
