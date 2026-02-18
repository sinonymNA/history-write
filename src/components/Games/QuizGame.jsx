import { useState, useEffect } from 'react'
import { useGame } from '../../context/GameContext'

export default function QuizGame() {
  const { gameState } = useGame()
  const [gameId, setGameId] = useState(null)
  const [players, setPlayers] = useState([])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold fs mb-6">Live Quiz</h1>
      <div className="hcard p-6">
        <div className="mb-4">
          {gameId ? (
            <div>
              <p className="text-[var(--mu)]">Game ID: <span className="font-mono text-[var(--ac)]">{gameId}</span></p>
              <p className="text-[var(--mu)] mt-2">Players: {players.length}</p>
            </div>
          ) : (
            <p className="text-[var(--mu)]">Real-time multiplayer quiz with live leaderboard.</p>
          )}
        </div>
        <button className="btnP">Start Quiz</button>
      </div>
    </div>
  )
}
