"use client"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"

interface HistoryEntry {
  command: string
  output: string
}

export function Terminal() {
  const [history, setHistory] = useState<HistoryEntry[]>([
    { command: "", output: "Windows 11 Portfolio Terminal\nType 'help' for available commands.\n" },
  ])
  const [currentCommand, setCurrentCommand] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    containerRef.current?.scrollTo(0, containerRef.current.scrollHeight)
  }, [history])

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase()
    let output = ""

    switch (trimmed) {
      case "help":
        output = `Available commands:
  help     - Show this help message
  clear    - Clear the terminal
  date     - Show current date and time
  echo     - Echo a message
  whoami   - Display current user
  ls       - List directory contents
  pwd      - Print working directory
  about    - About this portfolio`
        break
      case "clear":
        setHistory([])
        setCurrentCommand("")
        return
      case "date":
        output = new Date().toString()
        break
      case "whoami":
        output = "guest@portfolio"
        break
      case "ls":
        output = "Documents  Downloads  Pictures  Music  Videos  Projects"
        break
      case "pwd":
        output = "/home/guest"
        break
      case "about":
        output = `Portfolio OS v1.0
A Windows 11-style portfolio built with Next.js and React.
Developed with TypeScript and Tailwind CSS.`
        break
      default:
        if (trimmed.startsWith("echo ")) {
          output = cmd.slice(5)
        } else if (trimmed === "") {
          output = ""
        } else {
          output = `'${trimmed}' is not recognized as a command.`
        }
    }

    setHistory((prev) => [...prev, { command: cmd, output }])
    setCommandHistory((prev) => [...prev, cmd])
    setHistoryIndex(-1)
    setCurrentCommand("")
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeCommand(currentCommand)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex] || "")
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex] || "")
      } else {
        setHistoryIndex(-1)
        setCurrentCommand("")
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="h-full bg-[#0c0c0c] p-4 font-mono text-sm overflow-auto cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {history.map((entry, i) => (
        <div key={i} className="mb-1">
          {entry.command && (
            <div className="flex gap-2">
              <span className="text-[#569cd6]">guest@portfolio</span>
              <span className="text-white/50">:</span>
              <span className="text-[#dcdcaa]">~</span>
              <span className="text-white/50">$</span>
              <span className="text-white/90">{entry.command}</span>
            </div>
          )}
          {entry.output && <div className="text-white/80 whitespace-pre-wrap">{entry.output}</div>}
        </div>
      ))}

      {/* Current input line */}
      <div className="flex gap-2 items-center">
        <span className="text-[#569cd6]">guest@portfolio</span>
        <span className="text-white/50">:</span>
        <span className="text-[#dcdcaa]">~</span>
        <span className="text-white/50">$</span>
        <input
          ref={inputRef}
          type="text"
          value={currentCommand}
          onChange={(e) => setCurrentCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-white/90 focus:outline-none caret-white"
          autoFocus
        />
      </div>
    </div>
  )
}
