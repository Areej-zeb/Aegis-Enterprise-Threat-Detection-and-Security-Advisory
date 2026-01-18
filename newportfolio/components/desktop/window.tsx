"use client"

import { useRef, useState, useCallback, useEffect, type MouseEvent } from "react"
import { useDesktop } from "@/contexts/desktop-context"
import type { Window as WindowType } from "@/types/desktop"
import { Minus, Square, X, Maximize2 } from "lucide-react"

interface WindowProps {
  window: WindowType
}

export function Window({ window }: WindowProps) {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
    activeWindowId,
  } = useDesktop()
  const windowRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })

  const isActive = activeWindowId === window.id

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".window-controls")) return
      focusWindow(window.id)
      if ((e.target as HTMLElement).closest(".window-titlebar")) {
        setIsDragging(true)
        setDragOffset({
          x: e.clientX - window.x,
          y: e.clientY - window.y,
        })
      }
    },
    [focusWindow, window.id, window.x, window.y],
  )

  const handleResizeStart = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      setIsResizing(true)
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: window.width,
        height: window.height,
      })
    },
    [window.width, window.height],
  )

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (isDragging && !window.isMaximized) {
        const newX = Math.max(0, e.clientX - dragOffset.x)
        const newY = Math.max(0, e.clientY - dragOffset.y)
        updateWindowPosition(window.id, newX, newY)
      }
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        const newWidth = Math.max(300, resizeStart.width + deltaX)
        const newHeight = Math.max(200, resizeStart.height + deltaY)
        updateWindowSize(window.id, newWidth, newHeight)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [
    isDragging,
    isResizing,
    dragOffset,
    resizeStart,
    window.id,
    window.isMaximized,
    updateWindowPosition,
    updateWindowSize,
  ])

  if (window.isMinimized) return null

  const windowStyle = window.isMaximized
    ? { top: 0, left: 0, width: "100%", height: "calc(100% - 48px)", zIndex: window.zIndex }
    : { top: window.y, left: window.x, width: window.width, height: window.height, zIndex: window.zIndex }

  return (
    <div
      ref={windowRef}
      className={`absolute flex flex-col shadow-2xl ${isActive ? "ring-1 ring-sky-500/50" : ""}`}
      style={windowStyle}
      onMouseDown={handleMouseDown}
    >
      {/* Title bar */}
      <div
        className={`window-titlebar flex h-8 items-center justify-between px-2 select-none cursor-move ${
          isActive ? "bg-[#1a1a2e]" : "bg-[#252540]"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{window.icon}</span>
          <span className="text-xs text-white/90 font-medium truncate max-w-[200px]">{window.title}</span>
        </div>
        <div className="window-controls flex items-center">
          <button
            onClick={() => minimizeWindow(window.id)}
            className="flex h-8 w-10 items-center justify-center text-white/70 hover:bg-white/10 transition-colors"
          >
            <Minus className="h-3 w-3" />
          </button>
          <button
            onClick={() => maximizeWindow(window.id)}
            className="flex h-8 w-10 items-center justify-center text-white/70 hover:bg-white/10 transition-colors"
          >
            {window.isMaximized ? <Square className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </button>
          <button
            onClick={() => closeWindow(window.id)}
            className="flex h-8 w-10 items-center justify-center text-white/70 hover:bg-red-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-[#0d0d1a]">{window.content}</div>

      {/* Resize handle */}
      {!window.isMaximized && (
        <div className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize" onMouseDown={handleResizeStart} />
      )}
    </div>
  )
}
