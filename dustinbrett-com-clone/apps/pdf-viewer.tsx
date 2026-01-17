"use client"

import { Download, ExternalLink } from "lucide-react"

export function PDFViewer() {
  const resumeUrl = "/Sahar Iqbal Resume (7).pdf"

  return (
    <div className="flex flex-col h-full w-full bg-[#1a1a1a] text-white">
      {/* Header with title and buttons */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0">
        <h2 className="text-lg font-semibold m-0">Resume</h2>
        
        <div className="flex gap-2 ml-auto">
          <a
            href={resumeUrl}
            download="Sahar-Iqbal-Malik-Resume.pdf"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/18 bg-white/5 hover:bg-white/10 transition-colors text-sm text-white/90 no-underline"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </a>

          <a
            href={resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/18 bg-white/5 hover:bg-white/10 transition-colors text-sm text-white/90 no-underline"
          >
            <ExternalLink className="h-4 w-4" />
            Open in new tab
          </a>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden">
        <iframe
          title="Resume PDF"
          src={resumeUrl}
          className="w-full h-full border-0"
          style={{ minHeight: 0 }}
        />
      </div>
    </div>
  )
}
