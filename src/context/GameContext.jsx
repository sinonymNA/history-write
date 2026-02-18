import { createContext, useContext, useState } from 'react'

const GameContext = createContext()

export function GameProvider({ children }) {
  const [gameState, setGameState] = useState({
    level: 1,
    xp: 0,
    gamification: {},
    essayState: {},
  })

  const updateGameState = (updates) => {
    setGameState((prev) => ({ ...prev, ...updates }))
  }

  const addXP = (amount) => {
    setGameState((prev) => ({ ...prev, xp: prev.xp + amount }))
  }

  const levelUp = () => {
    setGameState((prev) => ({ ...prev, level: prev.level + 1 }))
  }

  return (
    <GameContext.Provider value={{ gameState, updateGameState, addXP, levelUp }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within GameProvider')
  }
  return context
}
