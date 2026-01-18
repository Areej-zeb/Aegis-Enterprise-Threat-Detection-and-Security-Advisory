"use client"

import { useState } from "react"
import { useWindowStore } from "@/store/window-store"

interface NotepadProps {
  windowId: string
}

export function Notepad({ windowId }: NotepadProps) {
  const [content, setContent] = useState("")
  const windows = useWindowStore((s) => s.windows)
  const window = windows.find((w) => w.id === windowId)

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      {/* Menu bar */}
      <div className="flex items-center gap-1 px-2 py-0.5 bg-[#2d2d2d] border-b border-[#3d3d3d] text-xs">
        <button className="px-2 py-1 hover:bg-white/10 rounded text-white/80">File</button>
        <button className="px-2 py-1 hover:bg-white/10 rounded text-white/80">Edit</button>
        <button className="px-2 py-1 hover:bg-white/10 rounded text-white/80">View</button>
      </div>

      {/* Text area */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 w-full p-3 bg-[#1e1e1e] text-white/90 text-sm font-mono resize-none focus:outline-none"
        placeholder="Start typing..."
        spellCheck={false}
      />

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#2d2d2d] border-t border-[#3d3d3d] text-xs text-white/50">
        <span>Ln 1, Col 1</span>
        <span>UTF-8</span>
      </div>
    </div>
  )
}
