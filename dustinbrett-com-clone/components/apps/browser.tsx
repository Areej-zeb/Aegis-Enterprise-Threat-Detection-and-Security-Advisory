"use client"

import type React from "react"

import { useState } from "react"
import { ArrowLeft, ArrowRight, RotateCw, Home, Search, Star } from "lucide-react"

export function Browser() {
  const [url, setUrl] = useState("https://daedalos.dev")
  const [inputUrl, setInputUrl] = useState("https://daedalos.dev")

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault()
    setUrl(inputUrl)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-[#151528] border-b border-white/10">
        <button className="p-1.5 rounded hover:bg-white/10 transition-colors">
          <ArrowLeft className="h-4 w-4 text-white/70" />
        </button>
        <button className="p-1.5 rounded hover:bg-white/10 transition-colors">
          <ArrowRight className="h-4 w-4 text-white/70" />
        </button>
        <button className="p-1.5 rounded hover:bg-white/10 transition-colors">
          <RotateCw className="h-4 w-4 text-white/70" />
        </button>
        <button className="p-1.5 rounded hover:bg-white/10 transition-colors">
          <Home className="h-4 w-4 text-white/70" />
        </button>

        <form onSubmit={handleNavigate} className="flex-1 flex items-center">
          <div className="flex-1 flex items-center gap-2 bg-[#0d0d1a] rounded-full px-4 py-1.5">
            <Search className="h-4 w-4 text-white/40" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white/90 outline-none"
              placeholder="Search or enter URL"
            />
          </div>
        </form>

        <button className="p-1.5 rounded hover:bg-white/10 transition-colors">
          <Star className="h-4 w-4 text-white/70" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 bg-[#0d0d1a] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🌐</div>
          <h1 className="text-2xl font-bold text-white mb-2">daedalOS Browser</h1>
          <p className="text-white/60 mb-4">Navigating to: {url}</p>
          <p className="text-sm text-white/40">
            This is a simulated browser. External sites cannot be loaded in this preview.
          </p>
        </div>
      </div>
    </div>
  )
}
