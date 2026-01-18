"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useWindowStore } from "@/store/window-store"
import { apps } from "@/lib/apps"
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  Search,
  LayoutGrid,
  List,
  Folder,
  FileText,
  ImageIcon,
  Music,
  Video,
  File,
  HardDrive,
  Monitor,
  Download,
  Star,
  Trash2,
  FolderOpen,
  Pencil,
  Info,
  Copy,
  Scissors,
  Clipboard,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FileItem {
  id: string
  name: string
  type: "folder" | "file" | "drive"
  icon: typeof Folder
  modified?: string
  size?: string
}

const quickAccessItems: FileItem[] = [
  { id: "desktop", name: "Desktop", type: "folder", icon: Monitor },
  { id: "downloads", name: "Downloads", type: "folder", icon: Download },
  { id: "documents", name: "Documents", type: "folder", icon: Folder },
  { id: "pictures", name: "Pictures", type: "folder", icon: ImageIcon },
  { id: "music", name: "Music", type: "folder", icon: Music },
  { id: "videos", name: "Videos", type: "folder", icon: Video },
]

const thisPCItems: FileItem[] = [
  { id: "c-drive", name: "Local Disk (C:)", type: "drive", icon: HardDrive },
  { id: "d-drive", name: "Data (D:)", type: "drive", icon: HardDrive },
]

const documentsContent: FileItem[] = [
  { id: "1", name: "Projects", type: "folder", icon: Folder, modified: "Jan 15, 2026" },
  { id: "2", name: "Resume.pdf", type: "file", icon: FileText, modified: "Jan 10, 2026", size: "245 KB" },
  { id: "3", name: "Notes.txt", type: "file", icon: FileText, modified: "Jan 8, 2026", size: "12 KB" },
  { id: "4", name: "Photos", type: "folder", icon: ImageIcon, modified: "Dec 20, 2025" },
  { id: "5", name: "Music", type: "folder", icon: Music, modified: "Nov 5, 2025" },
  { id: "6", name: "report.docx", type: "file", icon: File, modified: "Jan 12, 2026", size: "156 KB" },
  { id: "7", name: "Backup", type: "folder", icon: Folder, modified: "Jan 5, 2026" },
  { id: "8", name: "screenshot.png", type: "file", icon: ImageIcon, modified: "Jan 14, 2026", size: "1.2 MB" },
]

interface FileExplorerProps {
  appId: string
}

interface ContextMenuProps {
  x: number
  y: number
  item: FileItem | null
  onClose: () => void
  onAction: (action: string) => void
}

function ContextMenu({ x, y, item, onClose, onAction }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  const menuItems = item
    ? [
        { id: "open", label: "Open", icon: FolderOpen },
        { id: "divider1", divider: true },
        { id: "cut", label: "Cut", icon: Scissors, shortcut: "Ctrl+X" },
        { id: "copy", label: "Copy", icon: Copy, shortcut: "Ctrl+C" },
        { id: "divider2", divider: true },
        { id: "rename", label: "Rename", icon: Pencil },
        { id: "delete", label: "Delete", icon: Trash2, shortcut: "Del" },
        { id: "divider3", divider: true },
        { id: "properties", label: "Properties", icon: Info },
      ]
    : [
        { id: "paste", label: "Paste", icon: Clipboard, shortcut: "Ctrl+V" },
        { id: "divider1", divider: true },
        { id: "refresh", label: "Refresh", icon: ArrowUp },
        { id: "properties", label: "Properties", icon: Info },
      ]

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[220px] py-1.5 bg-[#2b2b2b] border border-white/10 rounded-lg shadow-xl shadow-black/40"
      style={{ left: x, top: y }}
    >
      {menuItems.map((menuItem) =>
        menuItem.divider ? (
          <div key={menuItem.id} className="my-1.5 mx-3 h-px bg-white/10" />
        ) : (
          <button
            key={menuItem.id}
            onClick={() => {
              onAction(menuItem.id)
              onClose()
            }}
            className="flex items-center gap-3 w-full px-3 py-1.5 text-left hover:bg-white/8 transition-colors group"
          >
            {menuItem.icon && <menuItem.icon className="h-4 w-4 text-white/60 group-hover:text-white/80" />}
            <span className="flex-1 text-[13px] text-white/90">{menuItem.label}</span>
            {menuItem.shortcut && <span className="text-[11px] text-white/40">{menuItem.shortcut}</span>}
          </button>
        ),
      )}
    </div>
  )
}

export function FileExplorer({ appId }: FileExplorerProps) {
  const { openWindow } = useWindowStore()
  const getInitialPath = () => {
    if (appId === "my-computer") return "This PC"
    if (appId === "projects") return "Projects"
    return "Documents"
  }
  const [currentPath, setCurrentPath] = useState(getInitialPath())
  const [pathHistory, setPathHistory] = useState<string[]>([getInitialPath()])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [quickAccessExpanded, setQuickAccessExpanded] = useState(true)
  const [thisPCExpanded, setThisPCExpanded] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: FileItem | null } | null>(null)
  const [sidebarSelectedId, setSidebarSelectedId] = useState<string | null>(appId === "projects" ? "projects" : "documents")

  const getCurrentContent = () => {
    if (currentPath === "This PC") return thisPCItems
    if (currentPath === "Recycle Bin") return []
    if (currentPath === "Projects") {
      // Return only the Projects folder content
      const projectsFolder = documentsContent.find((item) => item.name === "Projects")
      if (projectsFolder) {
        // Return projects content - for now, return empty or you can add project items
        return []
      }
      return []
    }
    let content = documentsContent
    if (searchQuery) {
      content = content.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    return content
  }

  const navigateTo = (path: string) => {
    const newHistory = [...pathHistory.slice(0, historyIndex + 1), path]
    setPathHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setCurrentPath(path)
    setSelectedItem(null)
  }

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setCurrentPath(pathHistory[historyIndex - 1])
    }
  }

  const goForward = () => {
    if (historyIndex < pathHistory.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setCurrentPath(pathHistory[historyIndex + 1])
    }
  }

  const goUp = () => {
    if (currentPath !== "This PC") {
      navigateTo("This PC")
    }
  }

  const handleItemDoubleClick = (item: FileItem) => {
    if (item.type === "folder" || item.type === "drive") {
      navigateTo(item.name)
    } else if (item.name.endsWith(".txt")) {
      openWindow(apps.notepad)
    }
  }

  const handleSidebarClick = (id: string, name: string) => {
    setSidebarSelectedId(id)
    navigateTo(name)
  }

  const handleContextMenu = (e: React.MouseEvent, item: FileItem | null) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, item })
    if (item) setSelectedItem(item.id)
  }

  const handleContextAction = (action: string) => {
    // Fake actions for demo
    console.log(`Action: ${action}`, selectedItem)
  }

  const pathSegments = currentPath === "This PC" ? ["This PC"] : ["This PC", currentPath]

  return (
    <div className="flex flex-col h-full bg-[#191919] text-white select-none">
      <div className="flex items-center gap-1 px-2 h-[46px] bg-[#202020] border-b border-white/[0.06]">
        {/* Navigation buttons - round icon style */}
        <div className="flex items-center gap-0.5 mr-1">
          <button
            onClick={goBack}
            disabled={historyIndex === 0}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
              historyIndex === 0
                ? "text-white/25 cursor-not-allowed"
                : "text-white/70 hover:bg-white/8 active:bg-white/12",
            )}
          >
            <ChevronLeft className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={goForward}
            disabled={historyIndex >= pathHistory.length - 1}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
              historyIndex >= pathHistory.length - 1
                ? "text-white/25 cursor-not-allowed"
                : "text-white/70 hover:bg-white/8 active:bg-white/12",
            )}
          >
            <ChevronRight className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={goUp}
            disabled={currentPath === "This PC"}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
              currentPath === "This PC"
                ? "text-white/25 cursor-not-allowed"
                : "text-white/70 hover:bg-white/8 active:bg-white/12",
            )}
          >
            <ArrowUp className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="flex-1 flex items-center h-8 bg-[#1a1a1a] rounded-md border border-white/[0.08] px-2.5 gap-1.5 min-w-0">
          <Folder className="h-4 w-4 text-yellow-500/90 shrink-0" />
          <div className="flex items-center gap-0.5 text-[13px] min-w-0 overflow-hidden">
            {pathSegments.map((segment, index) => (
              <div key={index} className="flex items-center gap-0.5 min-w-0">
                {index > 0 && <ChevronRight className="h-3 w-3 text-white/30 shrink-0" />}
                <button
                  onClick={() => navigateTo(segment)}
                  className={cn(
                    "px-1 py-0.5 rounded hover:bg-white/8 transition-colors truncate",
                    index === pathSegments.length - 1 ? "text-white/90" : "text-white/60",
                  )}
                >
                  {segment}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center w-52 h-8 bg-[#1a1a1a] rounded-md border border-white/[0.08] px-2.5 gap-2 ml-2">
          <Search className="h-4 w-4 text-white/40 shrink-0" />
          <input
            type="text"
            placeholder="Search Documents"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-white/90 placeholder:text-white/40 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-0.5 ml-2 p-0.5 bg-[#1a1a1a] rounded-md border border-white/[0.08]">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded transition-colors",
              viewMode === "list" ? "bg-white/12 text-white/90" : "text-white/50 hover:text-white/70 hover:bg-white/6",
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded transition-colors",
              viewMode === "grid" ? "bg-white/12 text-white/90" : "text-white/50 hover:text-white/70 hover:bg-white/6",
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-52 bg-[#1e1e1e] border-r border-white/[0.06] overflow-y-auto shrink-0 py-1">
          {/* Quick Access section */}
          <div className="px-2 py-1.5">
            <button
              onClick={() => setQuickAccessExpanded(!quickAccessExpanded)}
              className="flex items-center gap-2 w-full px-2 py-1 rounded hover:bg-white/6 transition-colors"
            >
              <ChevronDown
                className={cn("h-3.5 w-3.5 text-white/50 transition-transform", !quickAccessExpanded && "-rotate-90")}
              />
              <Star className="h-4 w-4 text-yellow-500/90" />
              <span className="text-[11px] font-medium text-white/50 uppercase tracking-wide">Quick access</span>
            </button>

            {quickAccessExpanded && (
              <div className="mt-0.5 space-y-0.5">
                {quickAccessItems.map((item) => {
                  const Icon = item.icon
                  const isSelected = sidebarSelectedId === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSidebarClick(item.id, item.name)}
                      className={cn(
                        "flex items-center gap-2.5 w-full pl-7 pr-2 py-1.5 rounded-md text-left transition-colors relative",
                        isSelected ? "bg-white/10" : "hover:bg-white/6",
                      )}
                    >
                      {isSelected && (
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#60cdff] rounded-full" />
                      )}
                      <Icon className={cn("h-4 w-4 shrink-0", isSelected ? "text-white/90" : "text-white/60")} />
                      <span className={cn("text-[13px] truncate", isSelected ? "text-white" : "text-white/80")}>
                        {item.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* This PC section */}
          <div className="px-2 py-1.5 mt-1">
            <button
              onClick={() => setThisPCExpanded(!thisPCExpanded)}
              className="flex items-center gap-2 w-full px-2 py-1 rounded hover:bg-white/6 transition-colors"
            >
              <ChevronDown
                className={cn("h-3.5 w-3.5 text-white/50 transition-transform", !thisPCExpanded && "-rotate-90")}
              />
              <Monitor className="h-4 w-4 text-white/70" />
              <span className="text-[11px] font-medium text-white/50 uppercase tracking-wide">This PC</span>
            </button>

            {thisPCExpanded && (
              <div className="mt-0.5 space-y-0.5">
                {thisPCItems.map((item) => {
                  const Icon = item.icon
                  const isSelected = sidebarSelectedId === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSidebarClick(item.id, item.name)}
                      className={cn(
                        "flex items-center gap-2.5 w-full pl-7 pr-2 py-1.5 rounded-md text-left transition-colors relative",
                        isSelected ? "bg-white/10" : "hover:bg-white/6",
                      )}
                    >
                      {isSelected && (
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#60cdff] rounded-full" />
                      )}
                      <Icon className={cn("h-4 w-4 shrink-0", isSelected ? "text-white/90" : "text-white/60")} />
                      <span className={cn("text-[13px] truncate", isSelected ? "text-white" : "text-white/80")}>
                        {item.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div
          className="flex-1 flex flex-col overflow-hidden bg-[#191919]"
          onContextMenu={(e) => handleContextMenu(e, null)}
        >
          {viewMode === "list" ? (
            <div className="flex-1 overflow-auto">
              <div className="sticky top-0 flex items-center h-8 px-3 bg-[#1e1e1e] border-b border-white/[0.06] text-[12px] font-medium text-white/50">
                <span className="flex-1 min-w-[200px]">Name</span>
                <span className="w-36 px-2">Date modified</span>
                <span className="w-24 px-2 text-right">Size</span>
              </div>

              <div className="p-1">
                {getCurrentContent().map((item) => {
                  const Icon = item.icon
                  const isSelected = selectedItem === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item.id)}
                      onDoubleClick={() => handleItemDoubleClick(item)}
                      onContextMenu={(e) => handleContextMenu(e, item)}
                      className={cn(
                        "flex items-center w-full h-9 px-3 rounded text-left transition-colors group",
                        isSelected ? "bg-[#0078d4]/25" : "hover:bg-white/[0.04]",
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                          <Icon
                            className={cn("h-5 w-5", item.type === "folder" ? "text-yellow-500/90" : "text-white/60")}
                          />
                        </div>
                        <span className="text-[13px] text-white/90 truncate">{item.name}</span>
                      </div>
                      <span className="w-36 px-2 text-[12px] text-white/50">{item.modified || "—"}</span>
                      <span className="w-24 px-2 text-[12px] text-white/50 text-right">{item.size || "—"}</span>
                      <div className="absolute left-3 right-3 bottom-0 h-px bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Grid view */
            <div className="flex-1 overflow-auto p-3">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-1">
                {getCurrentContent().map((item) => {
                  const Icon = item.icon
                  const isSelected = selectedItem === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item.id)}
                      onDoubleClick={() => handleItemDoubleClick(item)}
                      onContextMenu={(e) => handleContextMenu(e, item)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                        isSelected ? "bg-[#0078d4]/25" : "hover:bg-white/[0.04]",
                      )}
                    >
                      <div className="w-12 h-12 flex items-center justify-center">
                        <Icon
                          className={cn("h-10 w-10", item.type === "folder" ? "text-yellow-500/90" : "text-white/60")}
                          strokeWidth={1}
                        />
                      </div>
                      <span className="text-[12px] text-white/90 text-center line-clamp-2 leading-tight">
                        {item.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {getCurrentContent().length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-white/30">
              <Folder className="h-20 w-20 mb-3" strokeWidth={0.75} />
              <span className="text-sm">This folder is empty</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between h-7 px-3 bg-[#202020] border-t border-white/[0.06] text-[12px] text-white/50">
        <span>{getCurrentContent().length} items</span>
        {selectedItem && <span>1 item selected</span>}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          onClose={() => setContextMenu(null)}
          onAction={handleContextAction}
        />
      )}
    </div>
  )
}
