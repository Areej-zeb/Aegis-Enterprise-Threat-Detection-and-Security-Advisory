"use client"

import { useRef, useState, useCallback, useEffect, type MouseEvent } from "react"
import { useWindowStore } from "@/store/window-store"
import { useSettingsStore } from "@/store/settings-store"
import { useSystemSounds } from "@/hooks/use-system-sounds"
import type { WindowState } from "@/types/os"
import { Minus, Square, X, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { apps } from "@/lib/apps"
import { AppRenderer } from "@/apps/app-renderer"

interface WindowProps {
  window: WindowState
}

const TASKBAR_HEIGHT = 48
const SNAP_THRESHOLD = 20

export function Window({ window }: WindowProps) {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
    snapWindow,
    activeWindowId,
  } = useWindowStore()

  const { animationsEnabled } = useSettingsStore()
  const { playClose, playMinimize, playMaximize } = useSystemSounds()

  const windowRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeEdge, setResizeEdge] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, winX: 0, winY: 0 })
  const [previewSnap, setPreviewSnap] = useState<"left" | "right" | "top" | null>(null)

  const [isOpening, setIsOpening] = useState(true)
  const [isMinimizing, setIsMinimizing] = useState(false)
  const [minimizeTarget, setMinimizeTarget] = useState<{ x: number; y: number } | null>(null)

  const isActive = activeWindowId === window.id

  useEffect(() => {
    if (animationsEnabled) {
      const timer = setTimeout(() => setIsOpening(false), 200)
      return () => clearTimeout(timer)
    } else {
      setIsOpening(false)
    }
  }, [animationsEnabled])

  const handleMinimize = useCallback(() => {
    playMinimize()

    if (animationsEnabled) {
      // Find taskbar button position for minimize animation target
      const taskbarButton = document.querySelector(`[data-window-id="${window.id}"]`)
      if (taskbarButton) {
        const rect = taskbarButton.getBoundingClientRect()
        setMinimizeTarget({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      } else {
        // Fallback to center of taskbar
        setMinimizeTarget({ x: globalThis.innerWidth / 2, y: globalThis.innerHeight - 24 })
      }
      setIsMinimizing(true)

      setTimeout(() => {
        minimizeWindow(window.id)
        setIsMinimizing(false)
        setMinimizeTarget(null)
      }, 200)
    } else {
      minimizeWindow(window.id)
    }
  }, [animationsEnabled, minimizeWindow, playMinimize, window.id])

  const handleClose = useCallback(() => {
    playClose()
    closeWindow(window.id)
  }, [closeWindow, playClose, window.id])

  const handleMaximizeToggle = useCallback(() => {
    playMaximize()
    if (window.isMaximized) {
      restoreWindow(window.id)
    } else {
      maximizeWindow(window.id)
    }
  }, [maximizeWindow, playMaximize, restoreWindow, window.id, window.isMaximized])

  const handleTitleBarMouseDown = useCallback(
    (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".window-controls")) return
      e.preventDefault()
      focusWindow(window.id)

      if (window.isMaximized) {
        const windowWidth = apps[window.appId]?.defaultWidth ?? 800
        restoreWindow(window.id)
        setDragOffset({ x: windowWidth / 2, y: 15 })
      } else {
        setDragOffset({ x: e.clientX - window.x, y: e.clientY - window.y })
      }
      setIsDragging(true)
    },
    [focusWindow, restoreWindow, window],
  )

  const handleResizeStart = useCallback(
    (e: MouseEvent, edge: string) => {
      e.preventDefault()
      e.stopPropagation()
      focusWindow(window.id)
      setIsResizing(true)
      setResizeEdge(edge)
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: window.width,
        height: window.height,
        winX: window.x,
        winY: window.y,
      })
    },
    [focusWindow, window],
  )

  const handleDoubleClick = useCallback(() => {
    handleMaximizeToggle()
  }, [handleMaximizeToggle])

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x
        const newY = Math.max(0, e.clientY - dragOffset.y)
        const screenWidth = globalThis.innerWidth
        const screenHeight = globalThis.innerHeight - TASKBAR_HEIGHT

        if (e.clientX <= SNAP_THRESHOLD) {
          setPreviewSnap("left")
        } else if (e.clientX >= screenWidth - SNAP_THRESHOLD) {
          setPreviewSnap("right")
        } else if (e.clientY <= SNAP_THRESHOLD) {
          setPreviewSnap("top")
        } else {
          setPreviewSnap(null)
          updateWindowPosition(window.id, Math.max(0, newX), Math.min(newY, screenHeight - 40))
        }
      }

      if (isResizing && resizeEdge) {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y

        let newWidth = resizeStart.width
        let newHeight = resizeStart.height
        let newX = resizeStart.winX
        let newY = resizeStart.winY

        if (resizeEdge.includes("e")) newWidth = Math.max(window.minWidth, resizeStart.width + deltaX)
        if (resizeEdge.includes("w")) {
          newWidth = Math.max(window.minWidth, resizeStart.width - deltaX)
          newX = resizeStart.winX + (resizeStart.width - newWidth)
        }
        if (resizeEdge.includes("s")) newHeight = Math.max(window.minHeight, resizeStart.height + deltaY)
        if (resizeEdge.includes("n")) {
          newHeight = Math.max(window.minHeight, resizeStart.height - deltaY)
          newY = resizeStart.winY + (resizeStart.height - newHeight)
        }

        updateWindowSize(window.id, newWidth, newHeight)
        if (resizeEdge.includes("w") || resizeEdge.includes("n")) {
          updateWindowPosition(window.id, newX, newY)
        }
      }
    }

    const handleMouseUp = () => {
      if (isDragging && previewSnap) {
        snapWindow(window.id, previewSnap)
      }
      setIsDragging(false)
      setIsResizing(false)
      setResizeEdge(null)
      setPreviewSnap(null)
    }

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = "none"
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = ""
    }
  }, [
    isDragging,
    isResizing,
    dragOffset,
    resizeStart,
    resizeEdge,
    window,
    previewSnap,
    updateWindowPosition,
    updateWindowSize,
    snapWindow,
  ])

  if (window.isMinimized && !isMinimizing) return null

  const getWindowStyle = () => {
    if (isMinimizing && minimizeTarget) {
      const windowCenterX = window.x + window.width / 2
      const windowCenterY = window.y + window.height / 2
      const translateX = minimizeTarget.x - windowCenterX
      const translateY = minimizeTarget.y - windowCenterY

      return {
        top: window.y,
        left: window.x,
        width: window.width,
        height: window.height,
        zIndex: window.zIndex,
        transform: `translate(${translateX}px, ${translateY}px) scale(0.1)`,
        opacity: 0,
        transition: "transform 200ms ease-in, opacity 200ms ease-in",
      }
    }

    if (window.isMaximized) {
      return {
        top: 0,
        left: 0,
        width: "100%",
        height: `calc(100vh - ${TASKBAR_HEIGHT}px)`,
        zIndex: window.zIndex,
        borderRadius: 0,
      }
    }

    if (window.snapEdge === "left") {
      return {
        top: 0,
        left: 0,
        width: "50%",
        height: `calc(100vh - ${TASKBAR_HEIGHT}px)`,
        zIndex: window.zIndex,
      }
    }

    if (window.snapEdge === "right") {
      return {
        top: 0,
        left: "50%",
        width: "50%",
        height: `calc(100vh - ${TASKBAR_HEIGHT}px)`,
        zIndex: window.zIndex,
      }
    }

    if (window.snapEdge === "top") {
      return {
        top: 0,
        left: 0,
        width: "100%",
        height: `calc(100vh - ${TASKBAR_HEIGHT}px)`,
        zIndex: window.zIndex,
      }
    }

    return {
      top: window.y,
      left: window.x,
      width: window.width,
      height: window.height,
      zIndex: window.zIndex,
    }
  }

  const canResize = !window.isMaximized && !window.snapEdge

  return (
    <>
      {previewSnap && (
        <div
          className={cn(
            "fixed pointer-events-none z-[9998]",
            "bg-[#60cdff]/10 border-2 border-[#60cdff]/40 rounded-lg",
            "backdrop-blur-sm",
            animationsEnabled && "animate-in fade-in zoom-in-95 duration-150",
            previewSnap === "left" && "top-0 left-0 w-1/2 h-[calc(100vh-48px)]",
            previewSnap === "right" && "top-0 right-0 w-1/2 h-[calc(100vh-48px)]",
            previewSnap === "top" && "top-0 left-0 w-full h-[calc(100vh-48px)]",
          )}
        >
          {/* Inner glow effect */}
          <div className="absolute inset-2 rounded border border-[#60cdff]/20" />
        </div>
      )}

      <div
        ref={windowRef}
        className={cn(
          "absolute flex flex-col overflow-hidden",
          "bg-[#202020]/95 backdrop-blur-xl",
          "border border-[#3d3d3d]",
          isActive
            ? "shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(96,205,255,0.15)]"
            : "shadow-lg shadow-black/30",
          !window.isMaximized && !window.snapEdge && "rounded-lg",
          animationsEnabled && isOpening && "animate-in fade-in zoom-in-[0.98] duration-200",
          // Disable transitions during drag/resize for performance
          !isDragging && !isResizing && !isMinimizing && "transition-shadow duration-200",
        )}
        style={getWindowStyle()}
        onMouseDown={() => focusWindow(window.id)}
      >
        {/* Title bar */}
        <div
          className={cn(
            "window-titlebar flex h-9 items-center justify-between select-none shrink-0",
            isActive ? "bg-[#2d2d2d]" : "bg-[#252525]",
            !window.isMaximized && !window.snapEdge && "rounded-t-lg",
          )}
          onMouseDown={handleTitleBarMouseDown}
          onDoubleClick={handleDoubleClick}
        >
          <div className="flex items-center gap-2 px-3 min-w-0">
            <img src={window.icon} alt={window.title} className="h-4 w-4 object-contain shrink-0" />
            <span className="text-xs text-white/90 font-normal truncate">{window.title}</span>
          </div>

          <div className="window-controls flex items-center shrink-0">
            <button
              onClick={handleMinimize}
              className="flex h-9 w-11 items-center justify-center text-white/80 hover:bg-white/10 transition-colors"
              aria-label="Minimize"
            >
              <Minus className="h-4 w-4" strokeWidth={1} />
            </button>
            <button
              onClick={handleMaximizeToggle}
              className="flex h-9 w-11 items-center justify-center text-white/80 hover:bg-white/10 transition-colors"
              aria-label={window.isMaximized ? "Restore" : "Maximize"}
            >
              {window.isMaximized || window.snapEdge ? (
                <Copy className="h-3.5 w-3.5 rotate-180" strokeWidth={1.5} />
              ) : (
                <Square className="h-3 w-3" strokeWidth={1.5} />
              )}
            </button>
            <button
              onClick={handleClose}
              className={cn(
                "flex h-9 w-11 items-center justify-center text-white/80 transition-colors",
                !window.isMaximized && !window.snapEdge && "rounded-tr-lg",
                "hover:bg-[#c42b1c] hover:text-white",
              )}
              aria-label="Close"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
          <AppRenderer appId={window.appId} windowId={window.id} />
        </div>

        {/* Resize handles */}
        {canResize && (
          <>
            <div
              className="absolute top-0 left-2 right-2 h-1 cursor-n-resize"
              onMouseDown={(e) => handleResizeStart(e, "n")}
            />
            <div
              className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize"
              onMouseDown={(e) => handleResizeStart(e, "s")}
            />
            <div
              className="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize"
              onMouseDown={(e) => handleResizeStart(e, "w")}
            />
            <div
              className="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize"
              onMouseDown={(e) => handleResizeStart(e, "e")}
            />
            <div
              className="absolute top-0 left-0 h-2 w-2 cursor-nw-resize"
              onMouseDown={(e) => handleResizeStart(e, "nw")}
            />
            <div
              className="absolute top-0 right-0 h-2 w-2 cursor-ne-resize"
              onMouseDown={(e) => handleResizeStart(e, "ne")}
            />
            <div
              className="absolute bottom-0 left-0 h-2 w-2 cursor-sw-resize"
              onMouseDown={(e) => handleResizeStart(e, "sw")}
            />
            <div
              className="absolute bottom-0 right-0 h-2 w-2 cursor-se-resize"
              onMouseDown={(e) => handleResizeStart(e, "se")}
            />
          </>
        )}
      </div>
    </>
  )
}
