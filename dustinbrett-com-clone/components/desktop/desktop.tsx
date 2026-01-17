"use client"

import { useDesktop } from "@/contexts/desktop-context"
import { DesktopIcon } from "./desktop-icon"
import { Window } from "./window"
import { Taskbar } from "./taskbar"

export function Desktop() {
  const { windows, desktopIcons, setStartMenuOpen } = useDesktop()

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(135deg, #0f0f23 0%, #1a1a3e 25%, #0d1f3c 50%, #1a1a3e 75%, #0f0f23 100%)`,
      }}
      onClick={() => setStartMenuOpen(false)}
    >
      {/* Stars effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Desktop icons */}
      {desktopIcons.map((icon, index) => (
        <DesktopIcon key={icon.id} icon={icon} index={index} />
      ))}

      {/* Windows */}
      {windows.map((window) => (
        <Window key={window.id} window={window} />
      ))}

      {/* Taskbar */}
      <Taskbar />
    </div>
  )
}
