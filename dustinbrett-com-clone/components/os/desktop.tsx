"use client"

import { useWindowStore } from "@/store/window-store"
import { useSystemSounds } from "@/hooks/use-system-sounds"
import { desktopIcons } from "@/lib/apps"
import { DesktopIcon } from "./desktop-icon"
import { Window } from "./window"
import { Taskbar } from "./taskbar"
import { useEffect, useRef } from "react"

export function Desktop() {
  const { windows, setStartMenuOpen, openWindow } = useWindowStore()
  const { playOpen } = useSystemSounds()

  const prevWindowCountRef = useRef(windows.length)

  useEffect(() => {
    // Play sound when a new window is opened
    if (windows.length > prevWindowCountRef.current) {
      playOpen()
    }
    prevWindowCountRef.current = windows.length
  }, [windows.length, playOpen])

  return (
    <div className="relative h-screen w-screen overflow-hidden select-none" onClick={() => setStartMenuOpen(false)}>
      {/* Desktop wallpaper - Video background */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/back2.mp4" type="video/mp4" />
      </video>

      {/* Desktop icons */}
      <div className="absolute inset-0 pb-12">
        {desktopIcons.map((icon) => (
          <DesktopIcon key={icon.id} icon={icon} />
        ))}
      </div>

      {/* Windows */}
      {windows.map((window) => (
        <Window key={window.id} window={window} />
      ))}

      {/* Taskbar */}
      <Taskbar />
    </div>
  )
}
