"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SettingsStore {
  soundsEnabled: boolean
  animationsEnabled: boolean
  setSoundsEnabled: (enabled: boolean) => void
  setAnimationsEnabled: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      soundsEnabled: true,
      animationsEnabled: true,
      setSoundsEnabled: (enabled) => set({ soundsEnabled: enabled }),
      setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),
    }),
    {
      name: "os-settings",
    },
  ),
)
