import { useState, useCallback } from 'react'

const DEFAULT_MASTERY = {
  saq: { skills: { identify: 40, describe: 35, explain: 30 } },
  dbq: { skills: { contextualization: 25, thesis: 30, sourcing: 15, evidence: 20, complexity: 10 } },
  leq: { skills: { contextualization: 30, thesis: 35, evidence: 25, reasoning: 20 } }
}

export function useGameState() {
  const [gameState, setGameState] = useState({
    level: 1,
    xp: 0,
    mastery: DEFAULT_MASTERY,
    essayProgress: {
      currentBlock: null,
      responses: {},
      submitted: false
    }
  })

  const getDefaultStats = useCallback(() => ({
    level: 1,
    xp: 0,
    mastery: DEFAULT_MASTERY
  }), [])

  const addXP = useCallback((amount) => {
    setGameState(prev => {
      const newXp = prev.xp + amount
      const newLevel = Math.floor(newXp / 200) + 1
      const leveledUp = newLevel > prev.level
      return { ...prev, xp: newXp, level: newLevel, _leveledUp: leveledUp }
    })
  }, [])

  const checkLevelUp = useCallback((stats) => {
    if (!stats) return stats
    const newLevel = Math.floor(stats.xp / 200) + 1
    if (newLevel > stats.level) {
      stats.level = newLevel
      return { leveledUp: true, newLevel }
    }
    return { leveledUp: false }
  }, [])

  const updateSkillsFromGrading = useCallback((type, grading) => {
    setGameState(prev => {
      if (!grading?.annotations || !prev.mastery[type]) return prev
      const skills = { ...prev.mastery[type].skills }
      grading.annotations.forEach(a => {
        const cat = a.category?.toLowerCase()
        if (skills[cat] !== undefined) {
          skills[cat] = Math.min(100, skills[cat] + (a.status === 'success' ? 8 : a.status === 'warning' ? 3 : 1))
        }
      })
      return {
        ...prev,
        mastery: { ...prev.mastery, [type]: { skills } }
      }
    })
  }, [])

  const getSkillGardenData = useCallback((mastery) => {
    const m = mastery || DEFAULT_MASTERY
    const allSkills = []
    Object.entries(m).forEach(([type, data]) =>
      Object.entries(data.skills || {}).forEach(([name, val]) =>
        allSkills.push({ type, name, val })
      )
    )
    const mastered = allSkills.filter(s => s.val >= 80).length
    const growing = allSkills.filter(s => s.val >= 40 && s.val < 80).length
    const seeds = allSkills.filter(s => s.val < 40).length
    const avgPct = allSkills.length ? Math.round(allSkills.reduce((a, s) => a + s.val, 0) / allSkills.length) : 0
    return { allSkills, mastered, growing, seeds, avgPct }
  }, [])

  const getPlantEmoji = useCallback((val) => {
    if (val >= 80) return '🌳'
    if (val >= 60) return '🌻'
    if (val >= 40) return '🌿'
    if (val >= 20) return '🌱'
    return '🫘'
  }, [])

  const updateGameState = useCallback((updates) => {
    setGameState(prev => ({ ...prev, ...updates }))
  }, [])

  const startEssayBlock = useCallback((blockData) => {
    setGameState(prev => ({
      ...prev,
      essayProgress: { currentBlock: blockData, responses: {}, submitted: false }
    }))
  }, [])

  const saveBlockResponse = useCallback((partId, response) => {
    setGameState(prev => ({
      ...prev,
      essayProgress: {
        ...prev.essayProgress,
        responses: { ...prev.essayProgress.responses, [partId]: response }
      }
    }))
  }, [])

  const submitEssayBlock = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      essayProgress: { ...prev.essayProgress, submitted: true }
    }))
  }, [])

  return {
    gameState,
    getDefaultStats,
    addXP,
    checkLevelUp,
    updateSkillsFromGrading,
    getSkillGardenData,
    getPlantEmoji,
    updateGameState,
    startEssayBlock,
    saveBlockResponse,
    submitEssayBlock
  }
}
