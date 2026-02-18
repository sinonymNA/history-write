import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { LogOut, Menu } from 'lucide-react'
import { useState } from 'react'

export default function Navigation() {
  const { currentUser, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-[var(--bg)] border-b border-[var(--bd)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold fs">HistoryWrite</h1>
          </div>

          {/* Center - Navigation Links (desktop) */}
          <div className="hidden md:flex gap-6">
            <a href="#/" className="text-[var(--mu)] hover:text-[var(--tx)]">Dashboard</a>
            <a href="#/" className="text-[var(--mu)] hover:text-[var(--tx)]">Essay Blocks</a>
            <a href="#/" className="text-[var(--mu)] hover:text-[var(--tx)]">Games</a>
          </div>

          {/* Right - User Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[var(--bd)] transition-colors"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {currentUser && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-[var(--mu)]">{currentUser.displayName || currentUser.email}</span>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg hover:bg-[var(--bd)] transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-[var(--bd)]">
            <a href="#/" className="block py-2 text-[var(--mu)] hover:text-[var(--tx)]">Dashboard</a>
            <a href="#/" className="block py-2 text-[var(--mu)] hover:text-[var(--tx)]">Essay Blocks</a>
            <a href="#/" className="block py-2 text-[var(--mu)] hover:text-[var(--tx)]">Games</a>
            {currentUser && (
              <button onClick={logout} className="w-full text-left py-2 text-[var(--ac)]">Logout</button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
