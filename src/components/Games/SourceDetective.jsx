import { useState } from 'react'

export default function SourceDetective() {
  const [currentQuestion, setCurrentQuestion] = useState(0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold fs mb-6">Source Detective</h1>
      <div className="hcard p-6">
        <p className="text-[var(--mu)]">Analyze primary sources and identify point of view (POV).</p>
      </div>
    </div>
  )
}
