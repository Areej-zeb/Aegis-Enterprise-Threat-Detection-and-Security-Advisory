"use client"

import { cn } from "@/lib/utils"

export interface AppListItem {
  id: string
  title: string
  icon: string
}

interface StartMenuAppListProps {
  apps: AppListItem[]
  onAppClick: (appId: string) => void
  focusedIndex?: number
}

export function StartMenuAppList({ apps, onAppClick, focusedIndex = -1 }: StartMenuAppListProps) {
  return (
    <div className="flex flex-col">
      {apps.map((app, index) => {
        const isFocused = index === focusedIndex

        return (
          <button
            key={app.id}
            onClick={() => onAppClick(app.id)}
            className={cn(
              "flex items-center gap-3 h-10 px-3 w-full",
              "rounded-lg transition-colors duration-100 text-left",
              isFocused ? "bg-white/[0.12]" : "hover:bg-white/[0.08]",
              "active:bg-white/[0.14]",
              "focus:outline-none focus-visible:ring-1 focus-visible:ring-white/25",
            )}
          >
            <div className="h-7 w-7 rounded-md bg-white/[0.06] flex items-center justify-center flex-shrink-0">
              <img src={app.icon} alt={app.title} className="h-4 w-4 object-contain" />
            </div>
            <span className="text-[14px] font-normal text-white/85 truncate">{app.title}</span>
          </button>
        )
      })}
    </div>
  )
}
