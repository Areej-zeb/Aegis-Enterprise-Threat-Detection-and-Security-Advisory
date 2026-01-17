"use client"

import { useState, useEffect } from "react"

export function Clock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <button className="flex flex-col items-end px-3 py-1 hover:bg-white/10 rounded transition-colors">
      <span className="text-xs text-white/90">
        {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
      <span className="text-xs text-white/60">{time.toLocaleDateString([], { month: "short", day: "numeric" })}</span>
    </button>
  )
}
