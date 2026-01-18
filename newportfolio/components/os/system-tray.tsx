"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Wifi, Volume2, ChevronUp, BatteryMedium } from "lucide-react"
import { cn } from "@/lib/utils"

function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} suppressHydrationWarning>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-[#2d2d2d] text-white/90 text-[11px] rounded-[4px] whitespace-nowrap border border-white/10 shadow-lg pointer-events-none z-[10000]">
          {label}
        </div>
      )}
    </div>
  )
}

function TrayIconButton({
  onClick,
  label,
  children,
  className,
}: {
  onClick?: () => void
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Tooltip label={label}>
      <button
        onClick={onClick}
        className={cn(
          "flex h-full px-1.5 items-center justify-center transition-all duration-100",
          "hover:bg-white/10 active:scale-[0.98] hover:scale-[1.03]",
          className,
        )}
        aria-label={label}
      >
        {children}
      </button>
    </Tooltip>
  )
}

export function SystemTray() {
  const [time, setTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Only format time after mount to prevent hydration mismatch
  const formattedTime = mounted && time
    ? time.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : "--:--:-- --"

  const formattedDate = mounted && time
    ? time.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      })
    : "--/--/----"

  return (
    <div className="flex items-center h-full pr-1" suppressHydrationWarning>
      <TrayIconButton label="Show hidden icons">
        <ChevronUp className="h-3.5 w-3.5 text-white/70" strokeWidth={2} />
      </TrayIconButton>

      <div className="flex items-center h-9 mx-1 px-1 rounded-[6px] hover:bg-white/10 transition-all cursor-pointer" suppressHydrationWarning>
        <div className="flex items-center gap-1.5" suppressHydrationWarning>
          <Wifi className="h-4 w-4 text-white/80" strokeWidth={1.5} />
          <Volume2 className="h-4 w-4 text-white/80" strokeWidth={1.5} />
          <BatteryMedium className="h-4 w-4 text-white/80" strokeWidth={1.5} />
        </div>
      </div>

      <button className="h-9 px-2.5 flex flex-col items-end justify-center rounded-[6px] hover:bg-white/10 transition-all">
        <span className="text-[12px] text-white/95 leading-tight font-normal tracking-tight">{formattedTime}</span>
        <span className="text-[12px] text-white/95 leading-tight font-normal tracking-tight">{formattedDate}</span>
      </button>

      <button
        className="h-full w-[5px] ml-1 hover:bg-[#60cdff]/40 transition-colors border-l border-white/[0.06]"
        aria-label="Show desktop"
      />
    </div>
  )
}
