"use client"

import { useState } from "react"
import { Menu, LayoutGrid, Folder, ImageIcon, Power } from "lucide-react"
import { cn } from "@/lib/utils"

export type RailItemId = "home" | "all-apps" | "files" | "images" | "power"

interface RailItem {
  id: RailItemId
  icon: typeof Menu
  label: string
  position: "top" | "bottom"
}

const railItems: RailItem[] = [
  { id: "home", icon: Menu, label: "Home", position: "top" },
  { id: "all-apps", icon: LayoutGrid, label: "All Apps", position: "top" },
  { id: "files", icon: Folder, label: "Files", position: "top" },
  { id: "images", icon: ImageIcon, label: "Images", position: "top" },
  { id: "power", icon: Power, label: "Power", position: "bottom" },
]

interface StartMenuRailProps {
  activeItem?: RailItemId
  onItemClick?: (id: RailItemId) => void
}

export function StartMenuRail({ activeItem = "home", onItemClick }: StartMenuRailProps) {
  const [hoveredItem, setHoveredItem] = useState<RailItemId | null>(null)

  const topItems = railItems.filter((item) => item.position === "top")
  const bottomItems = railItems.filter((item) => item.position === "bottom")

  const renderItem = (item: RailItem) => {
    const Icon = item.icon
    const isActive = activeItem === item.id
    const isHovered = hoveredItem === item.id
    const isPower = item.id === "power"

    return (
      <button
        key={item.id}
        onClick={() => onItemClick?.(item.id)}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
        className={cn(
          "relative h-11 w-11 flex items-center justify-center rounded-lg transition-all duration-150",
          isActive && !isPower && "bg-white/[0.10]",
          !isActive && isHovered && "bg-white/[0.06]",
          !isActive && !isHovered && "bg-transparent",
          "focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
        )}
        title={item.label}
        aria-label={item.label}
      >
        {isActive && !isPower && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#60a5fa] rounded-r-full" />
        )}

        <Icon
          className={cn(
            "h-[22px] w-[22px] transition-colors duration-150",
            isPower
              ? isHovered
                ? "text-red-400"
                : "text-white/45"
              : isActive
                ? "text-white"
                : isHovered
                  ? "text-white/85"
                  : "text-white/55",
          )}
          strokeWidth={1.5}
        />
      </button>
    )
  }

  return (
    <div className={cn("w-14 flex flex-col items-center py-2.5", "bg-[#08090d]", "border-r border-white/[0.08]")}>
      {/* Top-aligned icons */}
      <div className="flex flex-col items-center gap-0.5">{topItems.map(renderItem)}</div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom-pinned power */}
      <div className="flex flex-col items-center">{bottomItems.map(renderItem)}</div>
    </div>
  )
}
