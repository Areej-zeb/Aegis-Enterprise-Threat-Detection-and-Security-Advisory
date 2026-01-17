"use client"

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { m as motion } from "motion/react"
import { useDesktop } from "@/contexts/desktop-context"
import { FileExplorer } from "@/components/apps/file-explorer"
import { Notepad } from "@/components/apps/notepad"
import { Terminal } from "@/components/apps/terminal"
import { Browser } from "@/components/apps/browser"
import { Settings } from "@/components/apps/settings"
import {
  Search,
  Power,
  User,
  Menu,
  List,
  Folder,
  Globe,
  FileText,
  Terminal as TerminalIcon,
  Settings as SettingsIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  Wrench,
  MessageCircle,
  Code2,
  Paintbrush,
  Camera,
  Monitor,
} from "lucide-react"

type AppId = "file-explorer" | "browser" | "notepad" | "terminal" | "settings"

type AppRow = {
  id: AppId
  title: string
  icon: React.ComponentType<{ className?: string }>
  section: "Development" | "Internet" | "Graphics" | "Office" | "System"
}

const OPEN_ANIM = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: "easeOut" } },
  exit: { opacity: 0, y: 6, scale: 0.99, transition: { duration: 0.14, ease: "easeIn" } },
}

export const StartMenu = memo(function StartMenu() {
  const { openWindow, setStartMenuOpen } = useDesktop()

  const rootRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)

  const [query, setQuery] = useState("")
  const [showScrolling, setShowScrolling] = useState(false)
  const [activeLeft, setActiveLeft] = useState<"allapps" | "documents" | "pictures" | "videos" | "power">("allapps")
  const [selectedIndex, setSelectedIndex] = useState<number>(0)

  const apps: AppRow[] = useMemo(
    () => [
      { id: "terminal", title: "Terminal", icon: TerminalIcon, section: "Development" },
      { id: "notepad", title: "Monaco Editor", icon: Code2, section: "Development" }, // placeholder
      { id: "settings", title: "DevTools", icon: Wrench, section: "Development" }, // placeholder
      { id: "browser", title: "Browser", icon: Globe, section: "Internet" },
      { id: "notepad", title: "IRC", icon: MessageCircle, section: "Internet" }, // placeholder
      { id: "notepad", title: "Messenger", icon: MessageCircle, section: "Internet" }, // placeholder
      { id: "notepad", title: "Marked", icon: FileText, section: "Office" }, // placeholder
      { id: "notepad", title: "PDF", icon: FileText, section: "Office" }, // placeholder
      { id: "notepad", title: "Paint", icon: Paintbrush, section: "Graphics" }, // placeholder
      { id: "notepad", title: "Photo Viewer", icon: Camera, section: "Graphics" }, // placeholder
      { id: "file-explorer", title: "Files", icon: Folder, section: "System" },
      { id: "settings", title: "Settings", icon: SettingsIcon, section: "System" },
      { id: "notepad", title: "About Me", icon: Monitor, section: "System" }, // placeholder
    ],
    []
  )

  const handleOpenApp = useCallback(
    (appId: AppId, title: string, Icon: AppRow["icon"]) => {
      let content: React.ReactNode = null
      let width = 820
      let height = 520

      switch (appId) {
        case "file-explorer":
          content = <FileExplorer path="/" />
          width = 920
          height = 560
          break
        case "notepad":
          content = <Notepad />
          width = 640
          height = 420
          break
        case "terminal":
          content = <Terminal />
          width = 760
          height = 480
          break
        case "browser":
          content = <Browser />
          width = 980
          height = 640
          break
        case "settings":
          content = <Settings />
          width = 760
          height = 560
          break
      }

      openWindow({
        title,
        icon: "", // icon asset slot (you’ll swap to Windows icons later)
        content,
        x: 100,
        y: 60,
        width,
        height,
        isMinimized: false,
        isMaximized: false,
      })

      setStartMenuOpen(false)
    },
    [openWindow, setStartMenuOpen]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return apps
    return apps.filter((a) => a.title.toLowerCase().includes(q))
  }, [apps, query])

  const sections = useMemo(() => {
    const order: AppRow["section"][] = ["Development", "Internet", "Graphics", "Office", "System"]
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

  const close = useCallback(() => setStartMenuOpen(false), [setStartMenuOpen])

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
        handleOpenApp(row.id, row.title, row.icon)
        return
      }

      // Printable key: focus search and start typing immediately (native-feel)
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // keep menu open; just behave like OS search
        searchRef.current?.focus()
        setQuery((prev) => (prev ? prev + e.key : e.key))
      }
    },
    [close, flatRows, handleOpenApp, selectedIndex]
  )

  // Focus menu on mount (so keyboard works instantly)
  useEffect(() => {
    const t = window.setTimeout(() => rootRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [])

  const openDocuments = useCallback(() => {
    setActiveLeft("documents")
    handleOpenApp("file-explorer", "Documents", Folder)
  }, [handleOpenApp])

  const openPictures = useCallback(() => {
    setActiveLeft("pictures")
    handleOpenApp("file-explorer", "Pictures", ImageIcon)
  }, [handleOpenApp])

  const openVideos = useCallback(() => {
    setActiveLeft("videos")
    handleOpenApp("file-explorer", "Videos", VideoIcon)
  }, [handleOpenApp])

  return (
    <motion.div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setShowScrolling(false)}
      className="absolute bottom-12 left-0 z-[9998] outline-none"
      {...OPEN_ANIM}
      aria-label="Start menu"
    >
      {/* Shell */}
      <div
        className={[
          "relative overflow-hidden",
          "w-[420px] max-w-[92vw] h-[560px] max-h-[calc(100vh-64px)]",
          "rounded-[14px]",
          "border border-white/10",
          "bg-[#0b0c10]/90",
          "shadow-[0_24px_90px_rgba(0,0,0,0.55)]",
          "backdrop-blur-xl",
        ].join(" ")}
      >
        {/* Subtle top->bottom gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent" />

        {/* Two-panel layout */}
        <div className="relative flex h-full">
          {/* Left Panel */}
          <div className="relative w-[168px] shrink-0 bg-black/35">
            <div className="flex h-full flex-col px-[10px] py-2">
              {/* START header */}
              <button
                onClick={() => setActiveLeft("allapps")}
                className="group relative flex h-11 w-full items-center gap-2 rounded-md px-2 text-left hover:bg-white/[0.08]"
              >
                <Menu className="h-[18px] w-[18px] text-white/75" />
                <span className="text-xs font-semibold tracking-widest text-white/70">START</span>
              </button>

              {/* All apps */}
              <button
                onClick={() => setActiveLeft("allapps")}
                className={[
                  "group relative mt-1 flex h-11 w-full items-center gap-2 rounded-md px-2 text-left",
                  "hover:bg-white/[0.08] active:bg-white/[0.12]",
                  activeLeft === "allapps" ? "bg-white/[0.10]" : "",
                ].join(" ")}
              >
                {activeLeft === "allapps" && (
                  <span className="absolute left-0 top-1/2 h-7 w-[2px] -translate-y-1/2 rounded-full bg-sky-500" />
                )}
                <List className="h-[18px] w-[18px] text-sky-300" />
                <span className="text-sm font-medium text-sky-300">All apps</span>
              </button>

              {/* Quick links */}
              <div className="mt-3 space-y-1">
                <button
                  onClick={openDocuments}
                  className={[
                    "group relative flex h-11 w-full items-center gap-2 rounded-md px-2 text-left",
                    "hover:bg-white/[0.08] active:bg-white/[0.12]",
                    activeLeft === "documents" ? "bg-white/[0.16]" : "",
                  ].join(" ")}
                >
                  {activeLeft === "documents" && (
                    <span className="absolute left-0 top-1/2 h-7 w-[2px] -translate-y-1/2 rounded-full bg-sky-500" />
                  )}
                  <Folder className="h-[18px] w-[18px] text-white/75" />
                  <span className="text-sm font-semibold text-white/90">Documents</span>
                </button>

                <button
                  onClick={openPictures}
                  className={[
                    "group relative flex h-11 w-full items-center gap-2 rounded-md px-2 text-left",
                    "hover:bg-white/[0.08] active:bg-white/[0.12]",
                    activeLeft === "pictures" ? "bg-white/[0.16]" : "",
                  ].join(" ")}
                >
                  {activeLeft === "pictures" && (
                    <span className="absolute left-0 top-1/2 h-7 w-[2px] -translate-y-1/2 rounded-full bg-sky-500" />
                  )}
                  <ImageIcon className="h-[18px] w-[18px] text-white/75" />
                  <span className="text-sm font-semibold text-white/90">Pictures</span>
                </button>

                <button
                  onClick={openVideos}
                  className={[
                    "group relative flex h-11 w-full items-center gap-2 rounded-md px-2 text-left",
                    "hover:bg-white/[0.08] active:bg-white/[0.12]",
                    activeLeft === "videos" ? "bg-white/[0.16]" : "",
                  ].join(" ")}
                >
                  {activeLeft === "videos" && (
                    <span className="absolute left-0 top-1/2 h-7 w-[2px] -translate-y-1/2 rounded-full bg-sky-500" />
                  )}
                  <VideoIcon className="h-[18px] w-[18px] text-white/75" />
                  <span className="text-sm font-semibold text-white/90">Videos</span>
                </button>

                <button
                  onClick={() => {
                    setActiveLeft("power")
                    close()
                  }}
                  className={[
                    "group relative flex h-11 w-full items-center gap-2 rounded-md px-2 text-left",
                    "hover:bg-white/[0.08] active:bg-white/[0.12]",
                    activeLeft === "power" ? "bg-white/[0.16]" : "",
                  ].join(" ")}
                >
                  {activeLeft === "power" && (
                    <span className="absolute left-0 top-1/2 h-7 w-[2px] -translate-y-1/2 rounded-full bg-sky-500" />
                  )}
                  <Power className="h-[18px] w-[18px] text-white/75" />
                  <span className="text-sm font-semibold text-white/90">Power</span>
                </button>
              </div>

              {/* Sticky profile */}
              <div className="mt-auto">
                <div className="my-2 h-px w-full bg-white/10" />
                <button className="flex h-[52px] w-full items-center gap-2 rounded-md px-2 hover:bg-white/[0.08] active:bg-white/[0.12]">
                  <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-sky-500/90">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="truncate text-sm font-medium text-white/90">John Doe</span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="absolute right-0 top-0 h-full w-px bg-white/[0.06]" />
          </div>

          {/* Right Panel */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Search */}
            <div className="px-3 pt-3">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
                <Search className="h-4 w-4 text-white/50" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type to search..."
                  className="w-full bg-transparent text-sm text-white/90 placeholder:text-white/40 outline-none"
                />
              </div>
            </div>

            {/* List */}
            <div
              className={[
                "mt-2 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-6 pt-1",
                // scrollbar: show only near right edge
                showScrolling ? "scrollbar-thin scrollbar-thumb-white/40 scrollbar-track-transparent" : "scrollbar-none",
              ].join(" ")}
            >
              {sections.length === 0 ? (
                <div className="px-2 py-8 text-sm text-white/50">No results.</div>
              ) : (
                <div className="space-y-3">
                  {sections.map((sec) => (
                    <div key={sec.section}>
                      <div className="px-2 pb-1 pt-2 text-[11px] font-semibold tracking-wider text-white/55">
                        {sec.section.toUpperCase()}
                      </div>

                      <div className="space-y-1">
                        {sec.items.map((row) => {
                          const Icon = row.icon
                          const idx = flatRows.findIndex((r) => r.title === row.title && r.section === row.section)
                          const isSelected = idx === selectedIndex

                          return (
                            <button
                              key={`${row.section}:${row.title}`}
                              onMouseEnter={() => setSelectedIndex(idx)}
                              onClick={() => handleOpenApp(row.id, row.title, row.icon)}
                              className={[
                                "group relative flex h-10 w-full items-center gap-2 rounded-md px-2 text-left",
                                "hover:bg-white/[0.08] active:bg-white/[0.15]",
                                isSelected ? "bg-sky-500/20 outline outline-1 outline-sky-400/30" : "",
                              ].join(" ")}
                            >
                              <span className="flex w-[34px] items-center justify-center">
                                {/* press shift like original */}
                                <span className="transition-none group-active:translate-x-1">
                                  <Icon className="h-[22px] w-[22px] text-white/85" />
                                </span>
                              </span>
                              <span className="min-w-0 flex-1 truncate text-sm text-white/92">{row.title}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pinned footer (Resume) */}
            <div className="border-t border-white/10 p-3">
              <button
                onClick={() => handleOpenApp("file-explorer", "Resume - PDF", FileText)}
                className="flex h-12 w-full items-center gap-2 rounded-xl bg-white/[0.06] px-3 hover:bg-white/[0.10] active:bg-white/[0.14]"
              >
                <FileText className="h-5 w-5 text-white/80" />
                <span className="text-sm font-medium text-white/90">Resume - PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tailwind scrollbar helpers (works with your stack; harmless if you already have these utilities) */}
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
          border-radius: 999px;
        }
      `}</style>
    </motion.div>
  )
})
