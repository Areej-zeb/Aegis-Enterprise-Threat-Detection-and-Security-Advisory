"use client"

import { Github, Linkedin, Mail, Globe, Code, Coffee } from "lucide-react"

export function About() {
  return (
    <div className="h-full bg-gradient-to-br from-[#1e1e1e] to-[#252525] p-8 overflow-auto">
      <div className="max-w-lg mx-auto">
        {/* Profile */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#0078d4] to-[#00a2ed] flex items-center justify-center">
            <span className="text-3xl font-light text-white">YN</span>
          </div>
          <h1 className="text-2xl font-light text-white/90 mb-1">Your Name</h1>
          <p className="text-white/60">Full Stack Developer</p>
        </div>

        {/* Bio */}
        <div className="bg-[#2d2d2d] rounded-lg p-5 border border-[#3d3d3d] mb-6">
          <p className="text-sm text-white/80 leading-relaxed">
            Welcome to my Windows 11-style portfolio! I'm a passionate developer who loves creating unique and
            interactive web experiences. This portfolio itself is a demonstration of my skills in React, TypeScript, and
            modern web technologies.
          </p>
        </div>

        {/* Skills */}
        <div className="bg-[#2d2d2d] rounded-lg p-5 border border-[#3d3d3d] mb-6">
          <h2 className="text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
            <Code className="h-4 w-4 text-[#0078d4]" />
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {["React", "TypeScript", "Next.js", "Tailwind CSS", "Node.js", "PostgreSQL", "Git"].map((skill) => (
              <span key={skill} className="px-3 py-1 text-xs bg-[#0078d4]/20 text-[#0078d4] rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="#"
            className="flex items-center gap-3 p-3 bg-[#2d2d2d] rounded-lg border border-[#3d3d3d] hover:bg-[#353535] transition-colors"
          >
            <Github className="h-5 w-5 text-white/70" />
            <span className="text-sm text-white/90">GitHub</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 p-3 bg-[#2d2d2d] rounded-lg border border-[#3d3d3d] hover:bg-[#353535] transition-colors"
          >
            <Linkedin className="h-5 w-5 text-[#0a66c2]" />
            <span className="text-sm text-white/90">LinkedIn</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 p-3 bg-[#2d2d2d] rounded-lg border border-[#3d3d3d] hover:bg-[#353535] transition-colors"
          >
            <Mail className="h-5 w-5 text-white/70" />
            <span className="text-sm text-white/90">Email</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 p-3 bg-[#2d2d2d] rounded-lg border border-[#3d3d3d] hover:bg-[#353535] transition-colors"
          >
            <Globe className="h-5 w-5 text-white/70" />
            <span className="text-sm text-white/90">Website</span>
          </a>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-white/40 flex items-center justify-center gap-1">
          <span>Made with</span>
          <Coffee className="h-3 w-3" />
          <span>and code</span>
        </div>
      </div>
    </div>
  )
}
