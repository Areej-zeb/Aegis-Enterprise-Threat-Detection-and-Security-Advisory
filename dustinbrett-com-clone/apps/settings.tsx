"use client"

import type React from "react"

import { useState } from "react"
import { useSettingsStore } from "@/store/settings-store"
import {
  Search,
  Home,
  Wifi,
  Bluetooth,
  Monitor,
  Paintbrush,
  Shield,
  Lock,
  Clock,
  Gamepad2,
  Accessibility,
  Info,
  ChevronRight,
  Volume2,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SettingCategory {
  id: string
  title: string
  icon: typeof Home
  description: string
}

const categories: SettingCategory[] = [
  { id: "system", title: "System", icon: Monitor, description: "Display, sound, notifications" },
  { id: "bluetooth", title: "Bluetooth & devices", icon: Bluetooth, description: "Bluetooth, printers, mouse" },
  { id: "network", title: "Network & internet", icon: Wifi, description: "Wi-Fi, ethernet, VPN" },
  { id: "personalization", title: "Personalization", icon: Paintbrush, description: "Background, colors, themes" },
  { id: "apps", title: "Apps", icon: Home, description: "Installed apps, default apps" },
  { id: "accounts", title: "Accounts", icon: Lock, description: "Your accounts, email, sync" },
  { id: "time", title: "Time & language", icon: Clock, description: "Language, region, date" },
  { id: "gaming", title: "Gaming", icon: Gamepad2, description: "Game Mode, captures" },
  { id: "accessibility", title: "Accessibility", icon: Accessibility, description: "Narrator, magnifier" },
  { id: "privacy", title: "Privacy & security", icon: Shield, description: "Windows Security" },
  { id: "update", title: "Windows Update", icon: Info, description: "Security updates, features" },
]

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors duration-200",
        enabled ? "bg-[#60cdff]" : "bg-[#4a4a4a]",
      )}
    >
      <div
        className={cn(
          "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200",
          enabled ? "translate-x-[22px]" : "translate-x-1",
        )}
      />
    </button>
  )
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Volume2
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-[#2d2d2d] rounded-lg p-4 border border-[#3d3d3d]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3d3d3d]">
            <Icon className="h-5 w-5 text-[#60cdff]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white/90">{title}</h3>
            {description && <p className="text-xs text-white/50 mt-0.5">{description}</p>}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Settings() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const { soundsEnabled, animationsEnabled, setSoundsEnabled, setAnimationsEnabled } = useSettingsStore()

  const filteredCategories = categories.filter(
    (cat) =>
      cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (selectedCategory === "system") {
    return (
      <div className="flex h-full bg-[#202020]">
        {/* Sidebar */}
        <div className="w-64 bg-[#252525] border-r border-[#3d3d3d] p-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white mb-4"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back to Settings
          </button>

          <div className="space-y-1">
            {categories.slice(0, 5).map((cat) => {
              const CatIcon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2 rounded-md text-left transition-colors",
                    selectedCategory === cat.id ? "bg-white/10" : "hover:bg-white/5",
                  )}
                >
                  <CatIcon className="h-5 w-5 text-white/70" />
                  <span className="text-sm text-white/90">{cat.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="flex items-center gap-3 mb-6">
            <Monitor className="h-8 w-8 text-[#60cdff]" />
            <h1 className="text-2xl font-light text-white/90">System</h1>
          </div>

          <div className="space-y-3 max-w-xl">
            <h2 className="text-xs font-medium text-white/50 uppercase tracking-wide mb-3">Sound & Effects</h2>

            <SettingsCard icon={Volume2} title="System sounds" description="Play sounds for system events">
              <ToggleSwitch enabled={soundsEnabled} onChange={setSoundsEnabled} />
            </SettingsCard>

            <SettingsCard icon={Sparkles} title="Animation effects" description="Window animations and transitions">
              <ToggleSwitch enabled={animationsEnabled} onChange={setAnimationsEnabled} />
            </SettingsCard>

            <div className="pt-4">
              <h2 className="text-xs font-medium text-white/50 uppercase tracking-wide mb-3">Display</h2>

              <div className="bg-[#2d2d2d] rounded-lg p-4 border border-[#3d3d3d]">
                <h3 className="text-sm font-medium text-white/90 mb-2">Brightness and color</h3>
                <p className="text-xs text-white/50">Adjust display brightness and night light settings.</p>
                <div className="mt-3 h-2 bg-[#3d3d3d] rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-[#60cdff] to-[#0078d4] rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (selectedCategory) {
    const category = categories.find((c) => c.id === selectedCategory)
    const Icon = category?.icon || Home

    return (
      <div className="flex h-full bg-[#202020]">
        {/* Sidebar */}
        <div className="w-64 bg-[#252525] border-r border-[#3d3d3d] p-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white mb-4"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back to Settings
          </button>

          <div className="space-y-1">
            {categories.slice(0, 5).map((cat) => {
              const CatIcon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2 rounded-md text-left transition-colors",
                    selectedCategory === cat.id ? "bg-white/10" : "hover:bg-white/5",
                  )}
                >
                  <CatIcon className="h-5 w-5 text-white/70" />
                  <span className="text-sm text-white/90">{cat.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="flex items-center gap-3 mb-6">
            <Icon className="h-8 w-8 text-[#60cdff]" />
            <h1 className="text-2xl font-light text-white/90">{category?.title}</h1>
          </div>

          <div className="space-y-4">
            <div className="bg-[#2d2d2d] rounded-lg p-4 border border-[#3d3d3d]">
              <h3 className="text-sm font-medium text-white/90 mb-2">Example Setting</h3>
              <p className="text-xs text-white/50">This is a placeholder for the {category?.title} settings panel.</p>
            </div>

            <div className="bg-[#2d2d2d] rounded-lg p-4 border border-[#3d3d3d]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white/90">Toggle Option</h3>
                  <p className="text-xs text-white/50 mt-1">Enable or disable this feature</p>
                </div>
                <ToggleSwitch enabled={true} onChange={() => {}} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-[#202020] p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-light text-white/90 mb-4">Settings</h1>

        {/* Search */}
        <div className="flex items-center gap-3 bg-[#2d2d2d] rounded-lg px-4 py-3 border border-[#3d3d3d] max-w-md">
          <Search className="h-5 w-5 text-white/50" />
          <input
            type="text"
            placeholder="Find a setting"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder:text-white/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Categories grid */}
      <div className="grid grid-cols-2 gap-3 max-w-2xl">
        {filteredCategories.map((category) => {
          const Icon = category.icon
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-start gap-4 p-4 bg-[#2d2d2d] rounded-lg border border-[#3d3d3d] hover:bg-[#353535] transition-colors text-left"
            >
              <Icon className="h-7 w-7 text-[#60cdff] mt-0.5" />
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-white/90">{category.title}</h3>
                <p className="text-xs text-white/50 mt-0.5 line-clamp-1">{category.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
