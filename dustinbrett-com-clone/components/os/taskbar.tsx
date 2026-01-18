"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useWindowStore } from "@/store/window-store"
import { useSystemSounds } from "@/hooks/use-system-sounds"
import { StartMenu, type StartMenuRef } from "./start-menu"
import { SystemTray } from "./system-tray"
import { pinnedApps, apps } from "@/lib/apps"
import { useStartMenu } from "@/hooks/use-start-menu"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

function StartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
    </svg>
  )
}

function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-[#2d2d2d] text-white/90 text-[11px] rounded-[4px] whitespace-nowrap border border-white/10 shadow-lg pointer-events-none z-[10000]">
          {label}
        </div>
      )}
    </div>
  )
}

function TaskbarIconButton({
  onClick,
  label,
  isActive,
  hasIndicator,
  children,
  className,
  dataWindowId,
}: {
  onClick: () => void
  label: string
  isActive?: boolean
  hasIndicator?: boolean
  children: React.ReactNode
  className?: string
  dataWindowId?: string
}) {
  return (
    <Tooltip label={label}>
      <button
        onClick={onClick}
        data-window-id={dataWindowId}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-[8px] transition-all duration-100",
          "hover:bg-white/10 active:scale-[0.98] hover:scale-[1.03]",
          isActive && "bg-white/10",
          className,
        )}
        aria-label={label}
      >
        {children}
        {hasIndicator && (
          <div
            className={cn(
              "absolute bottom-0.5 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all",
              isActive ? "w-4 bg-[#60cdff]" : "w-1.5 bg-white/50",
            )}
          />
        )}
      </button>
    </Tooltip>
  )
}

export function Taskbar() {
  const { windows, activeWindowId, focusWindow, minimizeWindow, openWindow } = useWindowStore()
  const { isOpen: startMenuOpen, toggle: toggleStartMenu, close: closeStartMenu, menuRef } = useStartMenu()
  const { playClick } = useSystemSounds()
  const startMenuRef = useRef<StartMenuRef>(null)

  const handleTaskbarItemClick = (windowId: string, isMinimized: boolean) => {
    playClick()
    if (activeWindowId === windowId && !isMinimized) {
      minimizeWindow(windowId)
    } else {
      focusWindow(windowId)
    }
  }

  const handlePinnedAppClick = (appId: string) => {
    playClick()
    const existingWindow = windows.find((w) => w.appId === appId)
    if (existingWindow) {
      if (activeWindowId === existingWindow.id && !existingWindow.isMinimized) {
        minimizeWindow(existingWindow.id)
      } else {
        focusWindow(existingWindow.id)
      }
    } else {
      const app = apps[appId]
      if (app) {
        openWindow(app)
      }
    }
    closeStartMenu()
  }

  const getWindowIdForApp = (appId: string) => {
    const win = windows.find((w) => w.appId === appId)
    return win?.id
  }

  return (
    <>
      <StartMenu ref={startMenuRef} divRef={menuRef} isOpen={startMenuOpen} onClose={closeStartMenu} />

      <div data-taskbar className="fixed bottom-0 left-0 right-0 h-[46px] bg-[#1c1c1c]/92 backdrop-blur-xl border-t border-white/[0.06] flex items-center z-[9999]">
        {/* Left section: Start button + Search + Pinned apps */}
        <div className="flex items-center h-full px-2 gap-0.5">
          <TaskbarIconButton
            data-start-button
            onClick={() => {
              playClick()
              toggleStartMenu()
            }}
            label="Start"
            isActive={startMenuOpen}
          >
            <StartIcon className="h-[20px] w-[20px] text-[#60cdff]" />
          </TaskbarIconButton>

          <TaskbarIconButton
            data-search-button
            onClick={() => {
              playClick()
              if (!startMenuOpen) {
                toggleStartMenu()
                // Focus search after menu opens
                setTimeout(() => {
                  startMenuRef.current?.focusSearch()
                }, 50)
              } else {
                // If menu is already open, just focus search
                startMenuRef.current?.focusSearch()
              }
            }}
            label="Search"
          >
            <Search className="h-[20px] w-[20px] text-white/80" strokeWidth={1.5} />
          </TaskbarIconButton>

          {pinnedApps.map((app) => {
            const appWindows = windows.filter((w) => w.appId === app.id)
            const hasOpenWindows = appWindows.length > 0
            const isActive = appWindows.some((w) => w.id === activeWindowId && !w.isMinimized)

            return (
              <TaskbarIconButton
                key={app.id}
                onClick={() => handlePinnedAppClick(app.id)}
                label={app.title}
                isActive={isActive}
                hasIndicator={hasOpenWindows}
                dataWindowId={getWindowIdForApp(app.id)}
              >
                <img src={app.icon} alt={app.title} className="h-[20px] w-[20px] object-contain" />
              </TaskbarIconButton>
            )
          })}
        </div>

        <div className="flex items-center h-full flex-1 justify-center gap-0.5">
          {windows
            .filter((win) => !pinnedApps.some((p) => p.id === win.appId))
            .map((win) => {
              const isActive = activeWindowId === win.id && !win.isMinimized

              return (
                <TaskbarIconButton
                  key={win.id}
                  onClick={() => handleTaskbarItemClick(win.id, win.isMinimized)}
                  label={win.title}
                  isActive={isActive}
                  hasIndicator={true}
                  dataWindowId={win.id}
                >
                  <img src={win.icon} alt={win.title} className="h-[20px] w-[20px] object-contain" />
                </TaskbarIconButton>
              )
            })}
        </div>

        {/* Right section: System tray */}
        <div className="h-full">
          <SystemTray />
        </div>
      </div>
    </>
  )
}
