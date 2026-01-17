/**
 * Windows 11 Design System - Usage Examples
 * This file demonstrates how to use the design tokens and utility classes
 */

import { Folder, FileText, Settings, X, Minus, Square } from "lucide-react"

/**
 * Example 1: Window Component
 * Uses: win-window, win-titlebar, win-content, win-shadow-active
 */
export function ExampleWindow() {
  return (
    <div className="win-window win-shadow-active" style={{ width: 600, height: 400 }}>
      {/* Titlebar - uses panel styling */}
      <div className="win-titlebar px-3">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-[var(--win-text-secondary)]" />
          <span className="text-[var(--win-text-sm)] text-[var(--win-text-primary)]">File Explorer</span>
        </div>
        <div className="flex">
          <button className="win-hover h-8 w-11 flex items-center justify-center">
            <Minus className="h-4 w-4 text-[var(--win-text-secondary)]" />
          </button>
          <button className="win-hover h-8 w-11 flex items-center justify-center">
            <Square className="h-3 w-3 text-[var(--win-text-secondary)]" />
          </button>
          <button className="h-8 w-11 flex items-center justify-center hover:bg-[var(--win-danger-hover)] hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="win-content win-scrollbar p-4">
        <p className="win-text-secondary win-text-sm">Window content goes here...</p>
      </div>
    </div>
  )
}

/**
 * Example 2: Menu / Start Menu
 * Uses: win-menu, win-menu-item, win-overlay, blur
 */
export function ExampleMenu() {
  const items = [
    { icon: FileText, label: "Documents" },
    { icon: Folder, label: "Downloads" },
    { icon: Settings, label: "Settings" },
  ]

  return (
    <div className="win-menu w-64 p-2">
      {items.map((item) => (
        <div key={item.label} className="win-menu-item win-rounded-md">
          <item.icon className="h-5 w-5 text-[var(--win-text-secondary)]" />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Example 3: Button Variants
 * Uses: win-button, win-button-accent, win-focus-ring
 */
export function ExampleButtons() {
  return (
    <div className="flex gap-3">
      <button className="win-button win-focus-ring">Cancel</button>
      <button className="win-button win-button-accent win-focus-ring">Save</button>
    </div>
  )
}

/**
 * Example 4: Input with Focus Ring
 * Uses: win-input, focus states
 */
export function ExampleInput() {
  return <input type="text" className="win-input" placeholder="Type to search..." />
}

/**
 * Example 5: Taskbar Button
 * Uses: win-taskbar-button, win-taskbar-button-active
 */
export function ExampleTaskbarButton({ isActive }: { isActive?: boolean }) {
  return (
    <button className={`win-taskbar-button ${isActive ? "win-taskbar-button-active" : ""}`}>
      <Folder className="h-5 w-5" />
      <span className="ml-2 text-[var(--win-text-sm)]">Files</span>
    </button>
  )
}

/**
 * Example 6: Card with Hover Effect
 * Uses: win-card, win-border, win-hover, win-rounded-md
 */
export function ExampleCard() {
  return (
    <div className="win-card win-border win-hover win-rounded-md p-4 cursor-pointer">
      <h3 className="win-text win-font-medium win-text-md mb-2">Project Title</h3>
      <p className="win-text-tertiary win-text-sm">A brief description of the project goes here.</p>
    </div>
  )
}

/**
 * Typography Hierarchy Example
 */
export function ExampleTypography() {
  return (
    <div className="space-y-2">
      <h1 className="win-text win-text-3xl win-font-semibold">Heading 1</h1>
      <h2 className="win-text win-text-xl win-font-medium">Heading 2</h2>
      <h3 className="win-text win-text-lg win-font-medium">Heading 3</h3>
      <p className="win-text-secondary win-text-base">Body text - secondary</p>
      <p className="win-text-tertiary win-text-sm">Caption - muted</p>
    </div>
  )
}
