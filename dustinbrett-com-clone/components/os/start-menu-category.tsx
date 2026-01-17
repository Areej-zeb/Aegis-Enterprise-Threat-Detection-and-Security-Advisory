"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Folder, ChevronDown } from "lucide-react"

export interface CategoryItem {
  id: string
  title: string
  icon: string
}

interface StartMenuCategoryProps {
  label: string
  items: CategoryItem[]
  onItemClick: (itemId: string) => void
  defaultOpen?: boolean
}

export function StartMenuCategory({ label, items, onItemClick, defaultOpen = false }: StartMenuCategoryProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [items])

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between h-[46px] px-3 w-full",
          "rounded-lg transition-colors duration-100",
          "hover:bg-white/[0.08]",
          isOpen && "bg-white/[0.05]",
          "focus:outline-none focus-visible:ring-1 focus-visible:ring-white/25",
        )}
      >
        <div className="flex items-center gap-3">
          {/* Yellow folder icon */}
          <Folder className="h-5 w-5 text-amber-400" strokeWidth={1.5} fill="currentColor" fillOpacity={0.15} />
          <span className="text-[14px] font-medium text-white/90">{label}</span>
        </div>

        <ChevronDown
          className={cn("h-4 w-4 text-white/45 transition-transform duration-200 ease-out", isOpen && "rotate-180")}
          strokeWidth={1.5}
        />
      </button>

      <div
        className="overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: isOpen ? contentHeight : 0 }}
      >
        <div ref={contentRef} className="flex flex-col py-0.5">
          {items.map((item) => {
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={cn(
                  "flex items-center gap-3 h-10 w-full",
                  "pl-9 pr-3",
                  "rounded-lg transition-colors duration-100 text-left",
                  "hover:bg-white/[0.08]",
                  "active:bg-white/[0.14]",
                  "focus:outline-none focus-visible:ring-1 focus-visible:ring-white/25",
                )}
              >
                <div className="h-7 w-7 rounded-md bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <img src={item.icon} alt={item.title} className="h-4 w-4 object-contain" />
                </div>
                <span className="text-[14px] font-normal text-white/85 truncate">{item.title}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
