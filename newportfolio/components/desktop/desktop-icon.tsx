"use client"

import { useState, useCallback } from "react"
import { useDesktop } from "@/contexts/desktop-context"
import type { DesktopIcon as DesktopIconType } from "@/types/desktop"
import { FileExplorer } from "@/components/apps/file-explorer"
import { Notepad } from "@/components/apps/notepad"
import { Terminal } from "@/components/apps/terminal"
import { Browser } from "@/components/apps/browser"
import { Settings } from "@/components/apps/settings"

interface DesktopIconProps {
  icon: DesktopIconType
  index: number
}

export function DesktopIcon({ icon, index }: DesktopIconProps) {
  const [isSelected, setIsSelected] = useState(false)
  const { openWindow } = useDesktop()

  const handleDoubleClick = useCallback(() => {
    let content = null
    let width = 800
    let height = 500

    switch (icon.id) {
      case "my-pc":
      case "documents":
      case "pictures":
        content = <FileExplorer path={icon.id === "my-pc" ? "/" : `/${icon.title}`} />
        break
      case "notepad":
        content = <Notepad />
        width = 600
        height = 400
        break
      case "terminal":
        content = <Terminal />
        width = 700
        height = 450
        break
      case "browser":
        content = <Browser />
        width = 900
        height = 600
        break
      case "settings":
        content = <Settings />
        width = 700
        height = 500
        break
      case "recycle-bin":
        content = <FileExplorer path="/Recycle Bin" />
        break
      default:
        content = <div className="p-4 text-white/70">App not found</div>
    }

    const row = Math.floor(index / 2)
    const col = index % 2

    openWindow({
      title: icon.title,
      icon: icon.icon,
      content,
      x: 100 + col * 50,
      y: 50 + row * 30,
      width,
      height,
      isMinimized: false,
      isMaximized: false,
    })
  }, [icon, openWindow, index])

  const row = Math.floor(index / 2)
  const col = index % 2

  return (
    <div
      className={`absolute flex w-20 flex-col items-center gap-1 rounded p-2 cursor-pointer select-none transition-colors ${
        isSelected ? "bg-sky-500/30" : "hover:bg-white/10"
      }`}
      style={{ top: 16 + row * 90, left: 16 + col * 90 }}
      onClick={() => setIsSelected(true)}
      onDoubleClick={handleDoubleClick}
      onBlur={() => setIsSelected(false)}
    >
      <div className="flex h-12 w-12 items-center justify-center text-4xl drop-shadow-lg">{icon.icon}</div>
      <span className="text-center text-xs text-white drop-shadow-md line-clamp-2">{icon.title}</span>
    </div>
  )
}
