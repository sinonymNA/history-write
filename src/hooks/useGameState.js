import { useState, useCallback } from 'react'

export function useGameState() {
  const [gameState, setGameState] = useState({
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    currentPlants: [],
    harvestedSeeds: 0,
    skillPoints: 0,
    essayProgress: {
      currentBlock: null,
      responses: {},
      submitted: false
    }
  })

  const addXP = useCallback((amount) => {
    setGameState(prev => {
      let newXp = prev.xp + amount
      let newLevel = prev.level
      let newXpToNext = prev.xpToNextLevel

      // Check for level up
      if (newXp >= newXpToNext) {
        newLevel += 1
        newXp = newXp - newXpToNext
        newXpToNext = Math.floor(newXpToNext * 1.2) // Increase XP requirement
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        xpToNextLevel: newXpToNext
      }
    })
  }, [])

  const plantSeed = useCallback((skillType) => {
    setGameState(prev => ({
      ...prev,
      currentPlants: [...prev.currentPlants, { id: Date.now(), type: skillType, status: 'seedling' }]
    }))
  }, [])

  const waterPlant = useCallback((plantId) => {
    setGameState(prev => ({
      ...prev,
      currentPlants: prev.currentPlants.map(p =>
        p.id === plantId
          ? { ...p, watered: (p.watered || 0) + 1 }
          : p
      )
    }))
  }, [])

  const harvestPlant = useCallback((plantId) => {
    setGameState(prev => {
      const plant = prev.currentPlants.find(p => p.id === plantId)
      const seedValue = Math.floor(Math.random() * 25) + 10

      return {
        ...prev,
        currentPlants: prev.currentPlants.filter(p => p.id !== plantId),
        harvestedSeeds: prev.harvestedSeeds + seedValue,
        skillPoints: prev.skillPoints + 1
      }
    })
  }, [])

  const updateGameState = useCallback((updates) => {
    setGameState(prev => ({ ...prev, ...updates }))
  }, [])

  const startEssayBlock = useCallback((blockData) => {
    setGameState(prev => ({
      ...prev,
      essayProgress: {
        currentBlock: blockData,
        responses: {},
        submitted: false
      }
    }))
  }, [])

  const saveBlockResponse = useCallback((partId, response) => {
    setGameState(prev => ({
      ...prev,
      essayProgress: {
        ...prev.essayProgress,
        responses: {
          ...prev.essayProgress.responses,
          [partId]: response
        }
      }
    }))
  }, [])

  const submitEssayBlock = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      essayProgress: {
        ...prev.essayProgress,
        submitted: true
      }
    }))
  }, [])

  return {
    gameState,
    addXP,
    plantSeed,
    waterPlant,
    harvestPlant,
    updateGameState,
    startEssayBlock,
    saveBlockResponse,
    submitEssayBlock
  }
}
