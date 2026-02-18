import { useState } from 'react'
import { useGame } from '../../context/GameContext'

export default function TimelineRace() {
  const { addXP } = useGame()
  const [completed, setCompleted] = useState(false)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold fs mb-6">Timeline Race</h1>
      <div className="hcard p-6">
        <p className="text-[var(--mu)]">Order historical events in correct chronological sequence.</p>
      </div>
    </div>
  )
}
