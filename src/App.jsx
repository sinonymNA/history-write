import { useState, useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { GameProvider } from './context/GameContext'
import { ThemeProvider } from './context/ThemeContext'
import Landing from './components/Landing'

export default function App() {
  const [appReady, setAppReady] = useState(false)

  useEffect(() => {
    // Initialize Tailwind and Lucide icons after mount
    import('tailwindcss/tailwind.css').catch(() => {})

    // Create root element for Tailwind config
    const script = document.createElement('script')
    script.innerHTML = `
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              ember: { 400: '#e8794a', 500: '#d4622f', 600: '#b34d1e' },
              sage: { 400: '#6b9b7a', 500: '#4d8060' },
              royal: { 400: '#7b8ac4', 500: '#5c6db3' },
              gold: { 400: '#d4a843', 500: '#c49528' }
            }
          }
        }
      }
    `
    document.head.appendChild(script)

    setAppReady(true)
  }, [])

  if (!appReady) return null

  return (
    <ThemeProvider>
      <AuthProvider>
        <GameProvider>
          <main id="app-root" className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--tx)]">
            <Landing />
          </main>
        </GameProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
