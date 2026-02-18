import { useState } from 'react'
import { useGame } from '../../context/GameContext'

export default function BlockBlast() {
  const { gameState, addXP } = useGame()
  const [score, setScore] = useState(0)

  const handleAnswer = (correct) => {
    if (correct) {
      const newScore = score + 10
      setScore(newScore)
      addXP(10)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold fs mb-6">Block Blast</h1>
      <div className="hcard p-6">
        <div className="mb-4">
          <p className="text-[var(--mu)]">Current Score: <span className="font-bold text-[var(--ac)]">{score}</span></p>
        </div>
        <p className="text-[var(--mu)]">Quiz arcade game - 20 AP history MCQs coming soon.</p>
      </div>
    </div>
  )
}
