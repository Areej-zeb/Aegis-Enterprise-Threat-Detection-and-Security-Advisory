"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { Window, DesktopIcon } from "@/types/desktop"

interface DesktopContextType {
  windows: Window[]
  openWindow: (window: Omit<Window, "id" | "zIndex">) => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  focusWindow: (id: string) => void
  updateWindowPosition: (id: string, x: number, y: number) => void
  updateWindowSize: (id: string, width: number, height: number) => void
  activeWindowId: string | null
  desktopIcons: DesktopIcon[]
  startMenuOpen: boolean
  setStartMenuOpen: (open: boolean) => void
}

const DesktopContext = createContext<DesktopContextType | null>(null)

export function DesktopProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<Window[]>([])
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null)
  const [highestZIndex, setHighestZIndex] = useState(100)
  const [startMenuOpen, setStartMenuOpen] = useState(false)

  const desktopIcons: DesktopIcon[] = [
    { id: "my-pc", title: "My PC", icon: "💻", type: "app" },
    { id: "documents", title: "Documents", icon: "📁", type: "folder" },
    { id: "pictures", title: "Pictures", icon: "🖼️", type: "folder" },
    { id: "recycle-bin", title: "Recycle Bin", icon: "🗑️", type: "app" },
    { id: "notepad", title: "Notepad", icon: "📝", type: "app" },
    { id: "terminal", title: "Terminal", icon: "⬛", type: "app" },
    { id: "browser", title: "Browser", icon: "🌐", type: "app" },
    { id: "settings", title: "Settings", icon: "⚙️", type: "app" },
  ]

  const openWindow = useCallback(
    (window: Omit<Window, "id" | "zIndex">) => {
      const id = `window-${Date.now()}`
      const newZIndex = highestZIndex + 1
      setHighestZIndex(newZIndex)
      setWindows((prev) => [...prev, { ...window, id, zIndex: newZIndex }])
      setActiveWindowId(id)
    },
    [highestZIndex],
  )

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id))
    setActiveWindowId(null)
  }, [])

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)))
  }, [])

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w)))
  }, [])

  const focusWindow = useCallback(
    (id: string) => {
      const newZIndex = highestZIndex + 1
      setHighestZIndex(newZIndex)
      setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, zIndex: newZIndex, isMinimized: false } : w)))
      setActiveWindowId(id)
    },
    [highestZIndex],
  )

  const updateWindowPosition = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)))
  }, [])

  const updateWindowSize = useCallback((id: string, width: number, height: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, width, height } : w)))
  }, [])

  return (
    <DesktopContext.Provider
      value={{
        windows,
        openWindow,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        focusWindow,
        updateWindowPosition,
        updateWindowSize,
        activeWindowId,
        desktopIcons,
        startMenuOpen,
        setStartMenuOpen,
      }}
    >
      {children}
    </DesktopContext.Provider>
  )
}

export function useDesktop() {
  const context = useContext(DesktopContext)
  if (!context) {
    throw new Error("useDesktop must be used within a DesktopProvider")
  }
  return context
}
