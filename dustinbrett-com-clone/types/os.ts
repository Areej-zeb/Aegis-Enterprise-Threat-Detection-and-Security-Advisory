export interface WindowState {
  id: string
  appId: string
  title: string
  icon: string
  x: number
  y: number
  width: number
  height: number
  minWidth: number
  minHeight: number
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
  snapEdge: "left" | "right" | "top" | null
}

export interface AppDefinition {
  id: string
  title: string
  icon: string
  defaultWidth?: number
  defaultHeight?: number
  defaultX?: number
  defaultY?: number
  minWidth?: number
  minHeight?: number
  allowMultiple?: boolean
}

export interface DesktopIconData {
  id: string
  title: string
  icon: string
  appId: string
  gridPosition: { row: number; col: number }
}
