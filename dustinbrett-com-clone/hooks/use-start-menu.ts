"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export function useStartMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, close])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        // Check if click was on the start button (don't close if toggling)
        const target = e.target as HTMLElement
        if (target.closest("[data-start-button]")) return
        close()
      }
    }

    // Small delay to prevent immediate close on open click
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside)
    }, 10)

    return () => {
      clearTimeout(timer)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, close])

  return {
    isOpen,
    open,
    close,
    toggle,
    menuRef,
  }
}
