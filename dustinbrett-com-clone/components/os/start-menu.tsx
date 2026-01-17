"use client"

import { memo, useCallback, useEffect, useMemo, useRef, useState, forwardRef } from "react"
import { useWindowStore } from "@/store/window-store"
import { startMenuApps, apps, appCategories } from "@/lib/apps"
import {
  Search,
  Power,
  User,
  Menu,
  List,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
} from "lucide-react"

interface StartMenuProps {
  isOpen: boolean
  onClose: () => void
}

export const StartMenu = forwardRef<HTMLDivElement, StartMenuProps>(function StartMenu({ isOpen, onClose }, ref) {
  const { openWindow } = useWindowStore()

  const rootRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const isManualUpdateRef = useRef(false)

  const [query, setQuery] = useState("")
  const [showScrolling, setShowScrolling] = useState(false)
  const [activeLeft, setActiveLeft] = useState<"allapps" | "documents" | "pictures" | "videos" | "power">("allapps")
  const [selectedIndex, setSelectedIndex] = useState<number>(0)

  // Convert apps from lib/apps.ts to the format needed for display
  const appsList = useMemo(() => {
    return startMenuApps.map((app) => ({
      id: app.id,
      title: app.title,
      icon: app.icon,
      section: appCategories.find((cat) => cat.apps.some((a) => a.id === app.id))?.label || "System",
    }))
  }, [])

  const handleOpenApp = useCallback(
    (appId: string) => {
      const app = apps[appId]
      if (app) {
        openWindow(app)
        onClose()
      }
    },
    [openWindow, onClose]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return appsList
    return appsList.filter((a) => a.title.toLowerCase().includes(q))
  }, [appsList, query])

  const sections = useMemo(() => {
    const order = ["Development", "Internet", "Graphics", "Office", "System"]
    return order
      .map((section) => ({
        section,
        items: filtered.filter((a) => a.section === section),
      }))
      .filter((s) => s.items.length > 0)
  }, [filtered])

  const flatRows = useMemo(() => sections.flatMap((s) => s.items), [sections])

  // Keep selectedIndex in range when filtering changes
  useEffect(() => {
    setSelectedIndex((i) => {
      if (flatRows.length === 0) return 0
      return Math.max(0, Math.min(i, flatRows.length - 1))
    })
  }, [flatRows.length])

  // Scrollbar reveal only near right edge
  const onMouseMove: React.MouseEventHandler<HTMLDivElement> = useCallback((e) => {
    const el = rootRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const withinRightEdge = e.clientX > rect.right - 14
    setShowScrolling(withinRightEdge)
  }, [])

  const close = useCallback(() => {
    onClose()
  }, [onClose])

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.preventDefault()
        close()
        return
      }

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, Math.max(0, flatRows.length - 1)))
        return
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        return
      }

      if (e.key === "Enter") {
        e.preventDefault()
        const row = flatRows[selectedIndex]
        if (!row) return
        handleOpenApp(row.id)
        return
      }

      // Printable key: focus search and start typing immediately (native-feel)
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // If input is already focused, let the native input handler take care of it
        if (document.activeElement === searchRef.current) {
          return
        }
        // Otherwise, focus the input and manually add the key
        e.preventDefault()
        searchRef.current?.focus()
        isManualUpdateRef.current = true
        setQuery((prev) => prev + e.key)
        // Reset flag after a brief delay to allow onChange to be skipped
        setTimeout(() => {
          isManualUpdateRef.current = false
        }, 0)
      }
    },
    [close, flatRows, handleOpenApp, selectedIndex]
  )

  // Focus menu on mount (so keyboard works instantly)
  useEffect(() => {
    if (isOpen) {
      const t = window.setTimeout(() => rootRef.current?.focus(), 0)
      return () => window.clearTimeout(t)
    }
  }, [isOpen])

  const openDocuments = useCallback(() => {
    setActiveLeft("documents")
    handleOpenApp("file-explorer")
  }, [handleOpenApp])

  const openPictures = useCallback(() => {
    setActiveLeft("pictures")
    handleOpenApp("photos")
  }, [handleOpenApp])

  const openVideos = useCallback(() => {
    setActiveLeft("videos")
    // Videos app doesn't exist, open file explorer as fallback
    handleOpenApp("file-explorer")
  }, [handleOpenApp])

  if (!isOpen) return null

  return (
    <div
      ref={ref || rootRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setShowScrolling(false)}
      className="absolute bottom-12 left-0 z-[9998] outline-none"
      aria-label="Start menu"
    >
      {/* Shell - Flatter panel style */}
      <div
        className={[
          "relative overflow-hidden",
          "w-[420px] max-w-[92vw] h-[560px] max-h-[calc(100vh-64px)]",
          "rounded-[12px]",
          "border border-white/20",
          "bg-[hsl(0_0%_10%_/_75%)]",
          "backdrop-blur-[10px]",
        ].join(" ")}
      >
        {/* Two-panel layout */}
        <div className="relative flex h-full">
          {/* Left Panel - Sidebar with hover expansion */}
          <div
            className={[
              "relative shrink-0 transition-all duration-200",
              sidebarHovered ? "w-[168px]" : "w-[56px]",
              "bg-[hsl(0_0%_10%_/_75%)]",
            ].join(" ")}
            onMouseEnter={() => setSidebarHovered(true)}
            onMouseLeave={() => setSidebarHovered(false)}
          >
            <div className="flex h-full flex-col px-[10px] py-2">
              {/* START header */}
              <button
                onClick={() => setActiveLeft("allapps")}
                className="group relative flex h-11 w-full items-center gap-2 rounded-[8px] px-2 text-left hover:bg-[hsl(0_0%_35%_/_35%)]"
              >
                <Menu className="h-[18px] w-[18px] text-white/75 shrink-0" />
                {sidebarHovered && <span className="text-xs font-semibold tracking-widest text-white/70">START</span>}
              </button>

              {/* All apps */}
              <button
                onClick={() => setActiveLeft("allapps")}
                className={[
                  "group relative mt-1 flex h-11 w-full items-center gap-2 rounded-[8px] px-2 text-left",
                  "hover:bg-[hsl(0_0%_35%_/_35%)]",
                  activeLeft === "allapps" ? "bg-[hsl(0_0%_35%_/_55%)]" : "",
                ].join(" ")}
              >
                {activeLeft === "allapps" && (
                  <span className="absolute left-0 top-1/2 h-7 w-[2px] -translate-y-1/2 rounded-full bg-sky-500" />
                )}
                <List className="h-[18px] w-[18px] text-sky-300 shrink-0" />
                {sidebarHovered && <span className="text-sm font-medium text-sky-300">All apps</span>}
              </button>

              {/* Quick links */}
              <div className="mt-3 space-y-1">
                <button
                  onClick={openDocuments}
                  className={[
                    "group relative flex h-11 w-full items-center gap-2 rounded-[8px] px-2 text-left",
                    "hover:bg-[hsl(0_0%_35%_/_35%)]",
                    activeLeft === "documents" ? "bg-[hsl(0_0%_35%_/_55%)]" : "",
                  ].join(" ")}
                >
                  {activeLeft === "documents" && (
                    <span className="absolute left-0 top-1/2 h-7 w-[2px] -translate-y-1/2 rounded-full bg-sky-500" />
                  )}
                  <img src="/fileexplorer.png" alt="File Explorer" className="h-[18px] w-[18px] object-contain shrink-0" />
                  {sidebarHovered && <span className="text-sm font-semibold text-white/90">File Explorer</span>}
                </button>

                <button
                  onClick={openPictures}
                  className={[
                    "group relative flex h-11 w-full items-center gap-2 rounded-[8px] px-2 text-left",
                    "hover:bg-[hsl(0_0%_35%_/_35%)]",
                    activeLeft === "pictures" ? "bg-[hsl(0_0%_35%_/_55%)]" : "",
                  ].join(" ")}
                >
                  {activeLeft === "pictures" && (
                    <span className="absolute left-0 top-1/2 h-7 w-[2px] -translate-y-1/2 rounded-full bg-sky-500" />
                  )}
                  <ImageIcon className="h-[18px] w-[18px] text-white/75 shrink-0" />
                  {sidebarHovered && <span className="text-sm font-semibold text-white/90">Pictures</span>}
                </button>

                <button
                  onClick={openVideos}
                  className={[
                    "group relative flex h-11 w-full items-center gap-2 rounded-[8px] px-2 text-left",
                    "hover:bg-[hsl(0_0%_35%_/_35%)]",
                    activeLeft === "videos" ? "bg-[hsl(0_0%_35%_/_55%)]" : "",
                  ].join(" ")}
                >
                  {activeLeft === "videos" && (
                    <span className="absolute left-0 top-1/2 h-7 w-[2px] -translate-y-1/2 rounded-full bg-sky-500" />
                  )}
                  <VideoIcon className="h-[18px] w-[18px] text-white/75 shrink-0" />
                  {sidebarHovered && <span className="text-sm font-semibold text-white/90">Videos</span>}
                </button>

                <button
                  onClick={() => {
                    setActiveLeft("power")
                    close()
                  }}
                  className={[
                    "group relative flex h-11 w-full items-center gap-2 rounded-[8px] px-2 text-left",
                    "hover:bg-[hsl(0_0%_35%_/_35%)]",
                    activeLeft === "power" ? "bg-[hsl(0_0%_35%_/_55%)]" : "",
                  ].join(" ")}
                >
                  {activeLeft === "power" && (
                    <span className="absolute left-0 top-1/2 h-7 w-[2px] -translate-y-1/2 rounded-full bg-sky-500" />
                  )}
                  <Power className="h-[18px] w-[18px] text-white/75 shrink-0" />
                  {sidebarHovered && <span className="text-sm font-semibold text-white/90">Power</span>}
                </button>
              </div>

              {/* Sticky profile */}
              <div className="mt-auto">
                <div className="my-2 h-px w-full bg-white/10" />
                <button className="flex h-[52px] w-full items-center gap-2 rounded-[8px] px-2 hover:bg-[hsl(0_0%_35%_/_35%)]">
                  <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-sky-500/90 shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  {sidebarHovered && <span className="truncate text-sm font-medium text-white/90">Sahar Iqbal Malik</span>}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="absolute right-0 top-0 h-full w-px bg-white/[0.2]" />
          </div>

          {/* Right Panel */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Search - Flatter, inset style */}
            <div className="px-3 pt-3">
              <div className="flex items-center gap-2 rounded-[8px] border border-white/10 bg-[hsl(0_0%_8%_/_80%)] px-3 py-2">
                <Search className="h-4 w-4 text-white/50 shrink-0" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => {
                    // Skip onChange if we just manually updated (to prevent double input)
                    if (isManualUpdateRef.current) {
                      isManualUpdateRef.current = false
                      return
                    }
                    setQuery(e.target.value)
                  }}
                  placeholder="Type to search..."
                  className="w-full bg-transparent text-sm text-white/90 placeholder:text-white/40 outline-none focus:border-transparent"
                />
              </div>
            </div>

            {/* List - Plain rows, no card styling */}
            <div
              className={[
                "mt-2 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-6",
                // scrollbar: show only near right edge
                showScrolling ? "scrollbar-thin scrollbar-thumb-[rgb(167,167,167)] scrollbar-track-transparent" : "scrollbar-none",
              ].join(" ")}
            >
              {sections.length === 0 ? (
                <div className="px-2 py-8 text-sm text-white/50">No results.</div>
              ) : (
                <div className="space-y-0">
                  {sections.map((sec) => (
                    <div key={sec.section}>
                      {/* Section header - Plain text, no card */}
                      <div className="px-2 py-2 text-[12px] font-medium text-white/55">
                        {sec.section.toUpperCase()}
                      </div>

                      {/* App rows - Plain list rows, no icon wells */}
                      <div className="space-y-0">
                        {sec.items.map((row) => {
                          const idx = flatRows.findIndex((r) => r.title === row.title && r.section === row.section)
                          const isSelected = idx === selectedIndex

                          return (
                            <button
                              key={`${row.section}:${row.title}`}
                              onMouseEnter={() => setSelectedIndex(idx)}
                              onClick={() => handleOpenApp(row.id)}
                              className={[
                                "group relative flex h-[40px] w-full items-center gap-3 rounded-[6px] px-2 text-left",
                                "hover:bg-[hsl(0_0%_35%_/_35%)]",
                                isSelected ? "bg-[hsl(0_0%_40%_/_45%)]" : "",
                              ].join(" ")}
                            >
                              {/* Icon - No background, no well */}
                              <img src={row.icon} alt={row.title} className="h-[22px] w-[22px] object-contain shrink-0" />
                              {/* Text */}
                              <span className="min-w-0 flex-1 truncate text-[14px] text-white/92">{row.title}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pinned footer (Resume) - Flatter */}
            <div className="border-t border-white/10 p-3">
              <button
                onClick={() => {
                  handleOpenApp("pdf")
                }}
                className="flex h-[40px] w-full items-center gap-2 rounded-[8px] bg-[hsl(0_0%_8%_/_60%)] px-3 hover:bg-[hsl(0_0%_35%_/_35%)]"
              >
                <img src="/pdf.png" alt="PDF" className="h-5 w-5 object-contain shrink-0" />
                <span className="text-sm font-medium text-white/90">Resume - PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tailwind scrollbar helpers */}
      <style jsx global>{`
        .scrollbar-none::-webkit-scrollbar {
          width: 0px;
          height: 0px;
        }
        .scrollbar-none {
          scrollbar-width: none;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgb(167, 167, 167);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgb(180, 180, 180);
        }
      `}</style>
    </div>
  )
})
