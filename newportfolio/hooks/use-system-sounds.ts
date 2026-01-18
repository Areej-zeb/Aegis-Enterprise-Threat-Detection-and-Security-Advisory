"use client"

import { useCallback, useRef, useEffect } from "react"
import { useSettingsStore } from "@/store/settings-store"

// Sound frequencies and durations for soft, elegant system sounds
const SOUNDS = {
  open: { frequency: 880, duration: 80, type: "sine" as OscillatorType, gain: 0.08 },
  close: { frequency: 440, duration: 60, type: "sine" as OscillatorType, gain: 0.06 },
  minimize: { frequency: 660, duration: 50, type: "sine" as OscillatorType, gain: 0.05 },
  maximize: { frequency: 784, duration: 60, type: "sine" as OscillatorType, gain: 0.06 },
  click: { frequency: 1200, duration: 30, type: "sine" as OscillatorType, gain: 0.03 },
  notification: { frequency: 587, duration: 150, type: "triangle" as OscillatorType, gain: 0.1 },
} as const

type SoundType = keyof typeof SOUNDS

export function useSystemSounds() {
  const { soundsEnabled } = useSettingsStore()
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize AudioContext on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        )()
      }
    }

    window.addEventListener("click", initAudio, { once: true })
    window.addEventListener("keydown", initAudio, { once: true })

    return () => {
      window.removeEventListener("click", initAudio)
      window.removeEventListener("keydown", initAudio)
    }
  }, [])

  const playSound = useCallback(
    (type: SoundType) => {
      if (!soundsEnabled || !audioContextRef.current) return

      const ctx = audioContextRef.current
      const sound = SOUNDS[type]

      // Create oscillator for the tone
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.type = sound.type
      oscillator.frequency.setValueAtTime(sound.frequency, ctx.currentTime)

      // Soft attack and decay envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(sound.gain, ctx.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + sound.duration / 1000)

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + sound.duration / 1000)
    },
    [soundsEnabled],
  )

  return {
    playOpen: useCallback(() => playSound("open"), [playSound]),
    playClose: useCallback(() => playSound("close"), [playSound]),
    playMinimize: useCallback(() => playSound("minimize"), [playSound]),
    playMaximize: useCallback(() => playSound("maximize"), [playSound]),
    playClick: useCallback(() => playSound("click"), [playSound]),
    playNotification: useCallback(() => playSound("notification"), [playSound]),
  }
}
