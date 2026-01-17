"use client"

import { useDesktop } from "@/contexts/desktop-context"
import { StartMenu } from "./start-menu"
import { Clock } from "./clock"

export function Taskbar() {
  const { windows, focusWindow, startMenuOpen, setStartMenuOpen } = useDesktop()

  return (
    <>
      {startMenuOpen && <StartMenu />}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#1a1a2e]/95 backdrop-blur-md border-t border-white/10 flex items-center px-2 z-[9999]">
        {/* Start button */}
        <button
          onClick={() => setStartMenuOpen(!startMenuOpen)}
          className={`flex h-10 w-12 items-center justify-center rounded hover:bg-white/10 transition-colors ${
            startMenuOpen ? "bg-white/20" : ""
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-sky-400">
            <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
          </svg>
        </button>

        {/* Task buttons */}
        <div className="flex flex-1 items-center gap-1 px-2 overflow-x-auto">
          {windows.map((window) => (
            <button
              key={window.id}
              onClick={() => focusWindow(window.id)}
              className={`flex h-10 min-w-[140px] max-w-[200px] items-center gap-2 rounded px-3 transition-colors ${
                window.isMinimized
                  ? "bg-white/5 hover:bg-white/10"
                  : "bg-white/10 hover:bg-white/15 border-b-2 border-sky-400"
              }`}
            >
              <span className="text-sm">{window.icon}</span>
              <span className="truncate text-xs text-white/90">{window.title}</span>
            </button>
          ))}
        </div>

        {/* System tray */}
        <div className="flex items-center gap-2 px-2">
          <button className="p-2 hover:bg-white/10 rounded transition-colors">
            <span className="text-sm">🔊</span>
          </button>
          <button className="p-2 hover:bg-white/10 rounded transition-colors">
            <span className="text-sm">📶</span>
          </button>
          <Clock />
        </div>
      </div>
    </>
  )
}
