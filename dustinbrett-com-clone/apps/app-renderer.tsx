"use client"

import dynamic from "next/dynamic"

const FileExplorer = dynamic(() => import("./file-explorer").then((m) => m.FileExplorer), { ssr: false })
const Notepad = dynamic(() => import("./notepad").then((m) => m.Notepad), { ssr: false })
const Terminal = dynamic(() => import("./terminal").then((m) => m.Terminal), { ssr: false })
const Browser = dynamic(() => import("./browser").then((m) => m.Browser), { ssr: false })
const Settings = dynamic(() => import("./settings").then((m) => m.Settings), { ssr: false })
const About = dynamic(() => import("./about").then((m) => m.About), { ssr: false })
const PDFViewer = dynamic(() => import("./pdf-viewer").then((m) => m.PDFViewer), { ssr: false })

interface AppRendererProps {
  appId: string
  windowId: string
}

export function AppRenderer({ appId, windowId }: AppRendererProps) {
  switch (appId) {
    case "file-explorer":
    case "my-computer":
    case "recycle-bin":
    case "projects":
      return <FileExplorer appId={appId} />
    case "notepad":
      return <Notepad windowId={windowId} />
    case "terminal":
      return <Terminal />
    case "browser":
      return <Browser />
    case "settings":
      return <Settings />
    case "about":
      return <About />
    case "pdf":
      return <PDFViewer />
    default:
      return <div className="flex items-center justify-center h-full text-white/50">Application not found</div>
  }
}
