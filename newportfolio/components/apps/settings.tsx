"use client"

import { useState } from "react"
import { Monitor, Palette, Bell, Shield, Info, User, Wifi, Volume2 } from "lucide-react"

export function Settings() {
  const [activeTab, setActiveTab] = useState("display")

  const tabs = [
    { id: "display", label: "Display", icon: Monitor },
    { id: "personalization", label: "Personalization", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "network", label: "Network", icon: Wifi },
    { id: "sound", label: "Sound", icon: Volume2 },
    { id: "accounts", label: "Accounts", icon: User },
    { id: "about", label: "About", icon: Info },
  ]

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-56 bg-[#151528] border-r border-white/10 p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
        <div className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors ${
                activeTab === tab.id ? "bg-sky-500/20 text-sky-400" : "text-white/70 hover:bg-white/10"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === "display" && (
          <div>
            <h3 className="text-xl font-semibold text-white mb-6">Display</h3>
            <div className="space-y-6">
              <div>
                <label className="text-sm text-white/70 mb-2 block">Brightness</label>
                <input type="range" className="w-64" defaultValue={80} />
              </div>
              <div>
                <label className="text-sm text-white/70 mb-2 block">Resolution</label>
                <select className="bg-[#0d0d1a] text-white border border-white/20 rounded px-3 py-2">
                  <option>1920 x 1080</option>
                  <option>2560 x 1440</option>
                  <option>3840 x 2160</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === "about" && (
          <div>
            <h3 className="text-xl font-semibold text-white mb-6">About</h3>
            <div className="space-y-4">
              <div className="bg-[#151528] rounded-lg p-4">
                <p className="text-sm text-white/50">System</p>
                <p className="text-white">daedalOS Clone</p>
              </div>
              <div className="bg-[#151528] rounded-lg p-4">
                <p className="text-sm text-white/50">Version</p>
                <p className="text-white">1.0.0</p>
              </div>
              <div className="bg-[#151528] rounded-lg p-4">
                <p className="text-sm text-white/50">Built with</p>
                <p className="text-white">React, Next.js, Tailwind CSS</p>
              </div>
            </div>
          </div>
        )}

        {!["display", "about"].includes(activeTab) && (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/50">Settings for {activeTab} coming soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}
