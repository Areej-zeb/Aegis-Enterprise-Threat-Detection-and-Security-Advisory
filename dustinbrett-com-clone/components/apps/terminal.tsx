"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"

interface HistoryItem {
  command: string
  output: string
}

export function Terminal() {
  const [history, setHistory] = useState<HistoryItem[]>([
    { command: "", output: "Welcome to Terminal v1.0.0\nType 'help' for available commands.\n" },
  ])
  const [currentInput, setCurrentInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    containerRef.current?.scrollTo(0, containerRef.current.scrollHeight)
  }, [history])

  const processCommand = (cmd: string): string => {
    const command = cmd.trim().toLowerCase()

    switch (command) {
      case "help":
        return "Available commands:\n  help    - Show this help message\n  clear   - Clear terminal\n  date    - Show current date\n  whoami  - Show current user\n  echo    - Echo text\n  ls      - List files"
      case "clear":
        setHistory([])
        return ""
      case "date":
        return new Date().toString()
      case "whoami":
        return "user@daedalos"
      case "ls":
        return "Documents  Pictures  Music  Videos  Downloads"
      default:
        if (command.startsWith("echo ")) {
          return cmd.slice(5)
        }
        return `Command not found: ${cmd}`
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentInput.trim()) return

    const output = processCommand(currentInput)
    if (output !== "") {
      setHistory((prev) => [...prev, { command: currentInput, output }])
    }
    setCurrentInput("")
  }

  return (
    <div
      className="h-full bg-[#0a0a14] p-4 font-mono text-sm text-green-400 overflow-auto"
      ref={containerRef}
      onClick={() => inputRef.current?.focus()}
    >
      {history.map((item, i) => (
        <div key={i} className="mb-2">
          {item.command && (
            <div className="flex gap-2">
              <span className="text-sky-400">user@daedalos:~$</span>
              <span>{item.command}</span>
            </div>
          )}
          <pre className="whitespace-pre-wrap text-white/80">{item.output}</pre>
        </div>
      ))}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <span className="text-sky-400">user@daedalos:~$</span>
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          className="flex-1 bg-transparent outline-none text-green-400"
          autoFocus
        />
      </form>
    </div>
  )
}
