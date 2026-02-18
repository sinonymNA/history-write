import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { user } = useAuth()

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[var(--bg)] to-[var(--elev)]">
      <div className="text-center">
        <div className="mb-8 flex justify-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-[var(--ac)]">
            <span className="text-white text-2xl">✍️</span>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-[var(--sg)]">
            <span className="text-white text-2xl">📚</span>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-[var(--ry)]">
            <span className="text-white text-2xl">🎮</span>
          </div>
        </div>

        <h1 className="text-6xl font-bold fs mb-4 text-[var(--tx)]">
          Write history.
          <br />
          <span style={{ color: 'var(--ac)' }}>Make history.</span>
        </h1>

        <p className="text-xl mb-10 fs text-[var(--mu)] max-w-md mx-auto">
          AI-powered essay grading, skill gardens, and arcade games for AP World History writing mastery.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {!user ? (
            <>
              <button className="btnP text-base py-3 px-8 shadow-lg pulse-cta">
                Get Started Free
              </button>
              <button className="btnG text-base py-3 px-8">
                Log In
              </button>
            </>
          ) : (
            <div className="text-[var(--mu)]">
              <p>Welcome back, {user.email}!</p>
              <button className="btnP text-base py-3 px-8 mt-4">
                Go to Dashboard
              </button>
            </div>
          )}
        </div>

        <p className="mt-4 text-sm font-medium underline underline-offset-4 text-[var(--ac)] cursor-pointer hover:opacity-80">
          Try a demo essay with instant AI feedback →
        </p>
      </div>
    </div>
  )
}
