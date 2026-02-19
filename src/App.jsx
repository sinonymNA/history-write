import { useState, useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { GameProvider } from './context/GameContext'
import { ThemeProvider } from './context/ThemeContext'
import Navigation from './components/UI/Navigation'
import ErrorBoundary from './components/shared/ErrorBoundary'
import Loading from './components/shared/Loading'

// Import all view components
import Landing from './components/Landing'
import Login from './components/Login'
import Signup from './components/Signup'
import StudentDashboard from './components/StudentDashboard'
import TeacherDashboard from './components/TeacherDashboard'
import Editor from './components/Editor'
import Results from './components/Results'
import BlocksSolo from './components/EssayBlocks/BlocksSolo'
import BlocksLobby from './components/EssayBlocks/BlocksLobby'
import BlocksPlay from './components/EssayBlocks/BlocksPlay'
import BlocksReview from './components/EssayBlocks/BlocksReview'
import ClassManager from './components/Teacher/ClassManager'
import AssignmentBuilder from './components/Teacher/AssignmentBuilder'
import Library from './components/Teacher/Library'
import LessonLab from './components/Teacher/LessonLab'
import BlockBlast from './components/Games/BlockBlast'
import TimelineRace from './components/Games/TimelineRace'
import SourceDetective from './components/Games/SourceDetective'
import QuizGame from './components/Games/QuizGame'
import StoryLesson from './components/StoryLessons/StoryLesson'
import { useAuth } from './context/AuthContext'

// Router component that handles navigation
function Router({ currentRoute, routeParams }) {
  const { user, userData } = useAuth()

  // Redirect logic — allow demo and results without auth
  if (!user && !['home', 'login', 'signup', 'demo', 'results'].includes(currentRoute)) {
    return <Landing />
  }

  const routes = {
    'home': () => user ? (userData?.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />) : <Landing />,
    'login': () => <Login />,
    'signup': () => <Signup />,
    'demo': () => <Editor />,
    'teacher-dash': () => <TeacherDashboard />,
    'student-dash': () => <StudentDashboard />,
    'class-manager': () => <ClassManager />,
    'assignment-builder': () => <AssignmentBuilder />,
    'library': () => <Library />,
    'lesson-lab': () => <LessonLab />,
    'editor': () => <Editor />,
    'results': () => <Results />,
    'blocks-solo': () => <BlocksSolo />,
    'blocks-lobby': () => <BlocksLobby />,
    'blocks-play': () => <BlocksPlay />,
    'blocks-review': () => <BlocksReview />,
    'block-blast': () => <BlockBlast />,
    'timeline-race': () => <TimelineRace />,
    'source-detective': () => <SourceDetective />,
    'quiz-game': () => <QuizGame />,
    'story-lesson': () => <StoryLesson />,
    'class-detail': () => <ClassManager />
  }

  const ViewComponent = routes[currentRoute] || (() => <Landing />)
  return <ViewComponent />
}

export default function App() {
  const [appReady, setAppReady] = useState(false)
  const [currentRoute, setCurrentRoute] = useState('home')
  const [routeParams, setRouteParams] = useState({})

  useEffect(() => {
    setAppReady(true)
  }, [])

  // Hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'home'
      const [route, ...rest] = hash.split('/')
      setCurrentRoute(route)
      // Parse params if needed
      setRouteParams({})
    }

    window.addEventListener('hashchange', handleHashChange)
    handleHashChange() // Initial route

    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (!appReady) return <Loading fullPage message="Initializing..." />

  return (
    <ThemeProvider>
      <AuthProvider>
        <GameProvider>
          <ErrorBoundary>
            <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--tx)]">
              {!['login', 'signup', 'home'].includes(currentRoute) && <Navigation />}
              <main id="app-root" className="flex-1 overflow-auto">
                <Router currentRoute={currentRoute} routeParams={routeParams} />
              </main>
            </div>
          </ErrorBoundary>
        </GameProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
