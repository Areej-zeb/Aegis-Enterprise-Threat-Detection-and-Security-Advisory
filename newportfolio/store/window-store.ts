"use client"

import { create } from "zustand"
import type { WindowState, AppDefinition } from "@/types/os"

interface WindowStore {
  windows: WindowState[]
  activeWindowId: string | null
  highestZIndex: number
  startMenuOpen: boolean

  openWindow: (app: AppDefinition) => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  restoreWindow: (id: string) => void
  focusWindow: (id: string) => void
  updateWindowPosition: (id: string, x: number, y: number) => void
  updateWindowSize: (id: string, width: number, height: number) => void
  snapWindow: (id: string, edge: "left" | "right" | "top" | null) => void
  setStartMenuOpen: (open: boolean) => void
  toggleStartMenu: () => void
  getWindowById: (id: string) => WindowState | undefined
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  activeWindowId: null,
  highestZIndex: 100,
  startMenuOpen: false,

  openWindow: (app) => {
    const { windows, highestZIndex } = get()
    const existingWindow = windows.find((w) => w.appId === app.id && !app.allowMultiple)

    if (existingWindow) {
      get().focusWindow(existingWindow.id)
      return
    }

    const id = `window-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const newZIndex = highestZIndex + 1

    const windowCount = windows.length
    const offsetX = (windowCount % 10) * 30
    const offsetY = (windowCount % 10) * 30

    set({
      windows: [
        ...windows,
        {
          id,
          appId: app.id,
          title: app.title,
          icon: app.icon,
          x: app.defaultX ?? 100 + offsetX,
          y: app.defaultY ?? 50 + offsetY,
          width: app.defaultWidth ?? 800,
          height: app.defaultHeight ?? 600,
          minWidth: app.minWidth ?? 400,
          minHeight: app.minHeight ?? 300,
          isMinimized: false,
          isMaximized: false,
          zIndex: newZIndex,
          snapEdge: null,
        },
      ],
      activeWindowId: id,
      highestZIndex: newZIndex,
    })
  },

  closeWindow: (id) => {
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
    }))
  },

  minimizeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)),
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
    }))
  },

  maximizeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMaximized: true, isMinimized: false, snapEdge: null } : w,
      ),
    }))
  },

  restoreWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMaximized: false, isMinimized: false, snapEdge: null } : w,
      ),
    }))
  },

  focusWindow: (id) => {
    const { highestZIndex } = get()
    const newZIndex = highestZIndex + 1

    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, zIndex: newZIndex, isMinimized: false } : w)),
      activeWindowId: id,
      highestZIndex: newZIndex,
    }))
  },

  updateWindowPosition: (id, x, y) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, x, y, snapEdge: null } : w)),
    }))
  },

  updateWindowSize: (id, width, height) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, width, height } : w)),
    }))
  },

  snapWindow: (id, edge) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, snapEdge: edge, isMaximized: false } : w)),
    }))
  },

  setStartMenuOpen: (open) => set({ startMenuOpen: open }),
  toggleStartMenu: () => set((state) => ({ startMenuOpen: !state.startMenuOpen })),

  getWindowById: (id) => get().windows.find((w) => w.id === id),
}))
