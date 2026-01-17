import type React from "react"
export interface Window {
  id: string
  title: string
  icon: string
  content: React.ReactNode
  x: number
  y: number
  width: number
  height: number
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
}

export interface DesktopIcon {
  id: string
  title: string
  icon: string
  type: "folder" | "app" | "file"
  action?: () => void
}

export interface Position {
  x: number
  y: number
}
