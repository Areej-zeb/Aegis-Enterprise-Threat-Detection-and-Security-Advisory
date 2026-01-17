"use client"

import { cn } from "@/lib/utils"

export interface PinnedItem {
  id: string
  label: string
  icon: string
  appId: string
}

interface StartMenuFooterProps {
  pinnedItems: PinnedItem[]
  onItemClick: (appId: string) => void
}

export function StartMenuFooter({ pinnedItems, onItemClick }: StartMenuFooterProps) {
  return (
    <div className="h-[56px] border-t border-white/[0.08] px-3 flex items-center gap-2 bg-[#0a0b10]/50">
      {pinnedItems.map((item) => {
        return (
          <button
            key={item.id}
            onClick={() => onItemClick(item.appId)}
            className={cn(
              "flex items-center gap-2.5 h-10 px-3.5",
              "rounded-xl",
              "bg-white/[0.06] hover:bg-white/[0.10] active:bg-white/[0.14]",
              "border border-white/[0.04]",
              "transition-all duration-100",
              "focus:outline-none focus-visible:ring-1 focus-visible:ring-white/25",
            )}
          >
            <img src={item.icon} alt={item.label} className="h-[18px] w-[18px] object-contain" />
            <span className="text-[13px] font-medium text-white/85 whitespace-nowrap">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
