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

  // Close on click outside (but not on mouse movement)
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (!menuRef.current) return
      
      const target = e.target as HTMLElement
      
      // Don't close if clicking inside the menu
      if (menuRef.current.contains(target)) return
      
      // Don't close if clicking on the start button or search button
      if (target.closest("[data-start-button]") || target.closest("[data-search-button]")) return
      
      // Don't close if clicking on the taskbar (menu is positioned above it)
      if (target.closest("[data-taskbar]")) return
      
      // Only close on actual click, not on mouse movement
      close()
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
