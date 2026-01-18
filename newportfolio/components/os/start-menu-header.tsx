"use client"

import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RefObject } from "react"

interface StartMenuHeaderProps {
  title: string
  searchQuery: string
  onSearchChange: (value: string) => void
  inputRef?: RefObject<HTMLInputElement>
  className?: string
}

export function StartMenuHeader({ title, searchQuery, onSearchChange, inputRef, className }: StartMenuHeaderProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="h-[46px] flex items-center px-4">
        <h2 className="text-[15px] font-medium text-white/90 truncate max-w-full">{title}</h2>
      </div>

      <div className="h-px bg-white/[0.10] mx-3" />

      <div className="p-3">
        <div
          className={cn(
            "flex items-center gap-2.5",
            "h-10 px-3.5",
            "bg-[#1a1c24] hover:bg-[#1e2028]",
            "rounded-xl",
            "border border-white/[0.06]",
            "transition-all duration-150",
            "focus-within:border-[#5b8dee]/50 focus-within:shadow-[0_0_0_3px_rgba(91,141,238,0.12)]",
          )}
        >
          <Search className="h-4 w-4 text-white/35 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type to search…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              "flex-1 bg-transparent",
              "text-[13px] text-white/90",
              "placeholder:text-white/30",
              "focus:outline-none",
            )}
          />
        </div>
      </div>
    </div>
  )
}
