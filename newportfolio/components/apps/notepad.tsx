"use client"

import { useState } from "react"

export function Notepad() {
  const [content, setContent] = useState("Welcome to Notepad!\n\nStart typing here...")

  return (
    <div className="flex flex-col h-full">
      {/* Menu bar */}
      <div className="flex items-center gap-4 px-3 py-1 bg-[#151528] border-b border-white/10">
        {["File", "Edit", "Format", "View", "Help"].map((menu) => (
          <button key={menu} className="text-xs text-white/80 hover:text-white transition-colors">
            {menu}
          </button>
        ))}
      </div>

      {/* Text area */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 bg-[#0d0d1a] text-white/90 p-4 font-mono text-sm resize-none outline-none"
        placeholder="Start typing..."
      />

      {/* Status bar */}
      <div className="px-3 py-1 bg-[#151528] border-t border-white/10 flex justify-between">
        <span className="text-xs text-white/50">Ln 1, Col 1</span>
        <span className="text-xs text-white/50">UTF-8</span>
      </div>
    </div>
  )
}
