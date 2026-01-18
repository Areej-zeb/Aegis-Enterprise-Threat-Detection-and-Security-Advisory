"use client"

import { useState } from "react"
import { ChevronRight, Folder, FileText, ImageIcon, Music, Video, ArrowLeft, ArrowRight, Home } from "lucide-react"

interface FileItem {
  name: string
  type: "folder" | "file" | "image" | "audio" | "video"
  size?: string
  modified?: string
}

interface FileExplorerProps {
  path: string
}

const mockFileSystem: Record<string, FileItem[]> = {
  "/": [
    { name: "Documents", type: "folder" },
    { name: "Pictures", type: "folder" },
    { name: "Music", type: "folder" },
    { name: "Videos", type: "folder" },
    { name: "Downloads", type: "folder" },
    { name: "readme.txt", type: "file", size: "2 KB", modified: "Jan 15, 2026" },
  ],
  "/Documents": [
    { name: "Work", type: "folder" },
    { name: "Personal", type: "folder" },
    { name: "report.pdf", type: "file", size: "1.2 MB", modified: "Jan 10, 2026" },
    { name: "notes.txt", type: "file", size: "4 KB", modified: "Jan 12, 2026" },
  ],
  "/Pictures": [
    { name: "Wallpapers", type: "folder" },
    { name: "Screenshots", type: "folder" },
    { name: "vacation.jpg", type: "image", size: "3.5 MB", modified: "Dec 25, 2025" },
    { name: "profile.png", type: "image", size: "250 KB", modified: "Jan 1, 2026" },
  ],
  "/Music": [
    { name: "playlist.mp3", type: "audio", size: "4.2 MB", modified: "Jan 5, 2026" },
    { name: "podcast.mp3", type: "audio", size: "45 MB", modified: "Jan 14, 2026" },
  ],
  "/Videos": [{ name: "tutorial.mp4", type: "video", size: "250 MB", modified: "Jan 8, 2026" }],
  "/Recycle Bin": [{ name: "old_file.txt", type: "file", size: "1 KB", modified: "Jan 2, 2026" }],
}

export function FileExplorer({ path: initialPath }: FileExplorerProps) {
  const [currentPath, setCurrentPath] = useState(initialPath)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  const files = mockFileSystem[currentPath] || []

  const getIcon = (type: FileItem["type"]) => {
    switch (type) {
      case "folder":
        return <Folder className="h-5 w-5 text-yellow-400" />
      case "image":
        return <ImageIcon className="h-5 w-5 text-green-400" />
      case "audio":
        return <Music className="h-5 w-5 text-pink-400" />
      case "video":
        return <Video className="h-5 w-5 text-red-400" />
      default:
        return <FileText className="h-5 w-5 text-blue-400" />
    }
  }

  const handleDoubleClick = (item: FileItem) => {
    if (item.type === "folder") {
      const newPath = currentPath === "/" ? `/${item.name}` : `${currentPath}/${item.name}`
      if (mockFileSystem[newPath]) {
        setCurrentPath(newPath)
      }
    }
  }

  const goUp = () => {
    if (currentPath !== "/") {
      const parts = currentPath.split("/").filter(Boolean)
      parts.pop()
      setCurrentPath(parts.length ? `/${parts.join("/")}` : "/")
    }
  }

  return (
    <div className="flex flex-col h-full text-white">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-[#151528] border-b border-white/10">
        <button
          onClick={goUp}
          className="p-1.5 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
          disabled={currentPath === "/"}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button className="p-1.5 rounded hover:bg-white/10 transition-colors opacity-50" disabled>
          <ArrowRight className="h-4 w-4" />
        </button>
        <button onClick={() => setCurrentPath("/")} className="p-1.5 rounded hover:bg-white/10 transition-colors">
          <Home className="h-4 w-4" />
        </button>

        {/* Breadcrumb */}
        <div className="flex-1 flex items-center gap-1 bg-[#0d0d1a] rounded px-3 py-1.5 ml-2">
          <span className="text-sm text-white/70">{currentPath === "/" ? "This PC" : currentPath}</span>
        </div>
      </div>

      {/* Sidebar & Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 bg-[#151528] border-r border-white/10 p-2 overflow-y-auto">
          <div className="space-y-1">
            {["Documents", "Pictures", "Music", "Videos", "Downloads"].map((folder) => (
              <button
                key={folder}
                onClick={() => setCurrentPath(`/${folder}`)}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-white/10 transition-colors text-left"
              >
                <Folder className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-white/80">{folder}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
            {files.map((file) => (
              <div
                key={file.name}
                className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                  selectedItem === file.name ? "bg-sky-500/30" : "hover:bg-white/10"
                }`}
                onClick={() => setSelectedItem(file.name)}
                onDoubleClick={() => handleDoubleClick(file)}
              >
                {getIcon(file.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/90 truncate">{file.name}</p>
                  {file.size && <p className="text-xs text-white/50">{file.size}</p>}
                </div>
                {file.type === "folder" && <ChevronRight className="h-4 w-4 text-white/30" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-3 py-1.5 bg-[#151528] border-t border-white/10">
        <span className="text-xs text-white/50">{files.length} items</span>
      </div>
    </div>
  )
}
