"use client"

import { useState, useCallback } from "react"
import { useWindowStore } from "@/store/window-store"
import { apps } from "@/lib/apps"
import type { DesktopIconData } from "@/types/os"
import { cn } from "@/lib/utils"

interface DesktopIconProps {
  icon: DesktopIconData
}

const ICON_SIZE = 80
const GRID_GAP = 8
const GRID_PADDING = 12

export function DesktopIcon({ icon }: DesktopIconProps) {
  const { openWindow, setStartMenuOpen } = useWindowStore()
  const [isSelected, setIsSelected] = useState(false)

  const handleDoubleClick = useCallback(() => {
    const app = apps[icon.appId]
    if (app) {
      openWindow(app)
      setStartMenuOpen(false)
    }
  }, [icon.appId, openWindow, setStartMenuOpen])

  const handleClick = useCallback(() => {
    setIsSelected(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsSelected(false)
  }, [])

  const x = GRID_PADDING + icon.gridPosition.col * (ICON_SIZE + GRID_GAP)
  const y = GRID_PADDING + icon.gridPosition.row * (ICON_SIZE + GRID_GAP)

  return (
    <button
      className={cn(
        "absolute flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
        isSelected ? "bg-white/15" : "hover:bg-white/10",
      )}
      style={{
        top: y,
        left: x,
        width: ICON_SIZE,
        height: ICON_SIZE,
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onBlur={handleBlur}
    >
      <div className="flex h-10 w-10 items-center justify-center">
        <img src={icon.icon} alt={icon.title} className="h-9 w-9 object-contain drop-shadow-md" />
      </div>
      <span className="text-[11px] text-white text-center leading-tight line-clamp-2 drop-shadow-md font-normal">
        {icon.title}
      </span>
    </button>
  )
}
