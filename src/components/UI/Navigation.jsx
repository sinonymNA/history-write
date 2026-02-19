import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { LogOut, Settings, Moon, Sun, Feather, Menu, X } from 'lucide-react'

export default function Navigation() {
  const { user, userData, firebase } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [keySaved, setKeySaved] = useState(false)

  const handleLogout = async () => {
    if (!firebase?.auth) return
    try {
      const { signOut } = await import('firebase/auth')
      await signOut(firebase.auth)
      window.location.hash = '#home'
    } catch (e) { console.error('Logout error:', e) }
  }

  const goHome = () => { window.location.hash = userData?.role === 'teacher' ? '#teacher-dash' : '#student-dash' }

  const saveApiKey = async () => {
    if (!apiKey.trim() || !firebase?.db || !user) return
    try {
      const { updateDoc, doc } = await import('firebase/firestore')
      await updateDoc(doc(firebase.db, 'users', user.uid), { claudeKey: apiKey.trim() })
      setKeySaved(true)
      setTimeout(() => setKeySaved(false), 2000)
    } catch (e) { console.error('Save key error:', e) }
  }

  const initial = userData?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'

  return (
    <>
      <nav className="navg sticky top-0 z-50 h-14 flex items-center px-4 md:px-6">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
          <button onClick={goHome} className="flex items-center gap-2">
            <Feather className="w-5 h-5" style={{ color: 'var(--ac)' }} />
            <span className="text-base font-bold fs">HistoryWrite</span>
          </button>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--mu)' }} title={theme === 'light' ? 'Dark mode' : 'Light mode'}>
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {user && <button onClick={() => setShowSettings(!showSettings)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--mu)' }} title="Settings"><Settings className="w-4 h-4" /></button>}

            {user && (
              <div className="hidden sm:flex items-center gap-2 ml-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--ac)' }}>{initial}</div>
                <span className="text-xs font-medium hidden md:inline" style={{ color: 'var(--mu)' }}>{userData?.name || user.email}</span>
              </div>
            )}

            {user && <button onClick={handleLogout} className="w-8 h-8 rounded-lg items-center justify-center hidden sm:flex" style={{ color: 'var(--mu)' }} title="Logout"><LogOut className="w-4 h-4" /></button>}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="w-8 h-8 rounded-lg flex items-center justify-center sm:hidden" style={{ color: 'var(--mu)' }}>
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="sm:hidden fixed top-14 left-0 right-0 z-40 p-4" style={{ background: 'var(--card)', borderBottom: '1px solid var(--bd)' }}>
          {user && (
            <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: '1px solid var(--bd)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--ac)' }}>{initial}</div>
              <div><p className="text-sm font-semibold">{userData?.name || 'User'}</p><p className="text-[10px]" style={{ color: 'var(--mu)' }}>{user.email}</p></div>
            </div>
          )}
          <button onClick={() => { setShowSettings(true); setMobileOpen(false) }} className="w-full text-left py-2 text-sm flex items-center gap-2" style={{ color: 'var(--mu)' }}><Settings className="w-4 h-4" />Settings</button>
          {user && <button onClick={handleLogout} className="w-full text-left py-2 text-sm flex items-center gap-2" style={{ color: 'var(--ac)' }}><LogOut className="w-4 h-4" />Logout</button>}
        </div>
      )}

      {showSettings && (
        <div className="modalBg" onClick={() => setShowSettings(false)}>
          <div className="modalBox" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold fs">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--mu)' }}><X className="w-4 h-4" /></button>
            </div>

            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--fa)' }}>Theme</p>
              <div className="flex gap-2">
                <button onClick={() => { if (theme !== 'light') toggleTheme() }} className="btnG text-xs py-1.5 px-4" style={theme === 'light' ? { borderColor: 'var(--ac)', color: 'var(--ac)', background: 'var(--acs)' } : {}}><Sun className="w-3 h-3 inline mr-1" />Light</button>
                <button onClick={() => { if (theme !== 'dark') toggleTheme() }} className="btnG text-xs py-1.5 px-4" style={theme === 'dark' ? { borderColor: 'var(--ac)', color: 'var(--ac)', background: 'var(--acs)' } : {}}><Moon className="w-3 h-3 inline mr-1" />Dark</button>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--fa)' }}>Claude API Key</p>
              <p className="text-[10px] mb-2" style={{ color: 'var(--mu)' }}>For AI essay grading and lesson generation. Get yours at console.anthropic.com</p>
              <div className="flex gap-2">
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-..." className="hinp flex-1 text-xs" />
                <button onClick={saveApiKey} disabled={!apiKey.trim()} className="btnP text-xs py-2 px-4">{keySaved ? 'Saved!' : 'Save'}</button>
              </div>
            </div>

            {user && (
              <div className="pt-4" style={{ borderTop: '1px solid var(--bd)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--fa)' }}>Account</p>
                <p className="text-xs"><span style={{ color: 'var(--mu)' }}>Name:</span> {userData?.name || '—'}</p>
                <p className="text-xs"><span style={{ color: 'var(--mu)' }}>Email:</span> {user.email}</p>
                <p className="text-xs"><span style={{ color: 'var(--mu)' }}>Role:</span> {userData?.role || '—'}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
