"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Home,
  Star,
  Shield,
  MoreHorizontal,
  X,
  Plus,
  Globe,
  BookOpen,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

type ViewMode = "iframe" | "reader"
type LoadState = "idle" | "loading" | "success" | "error" | "blocked"

interface Tab {
  id: string
  url: string
  title: string
  mode: ViewMode
  loadState: LoadState
  readerHtml?: string
  errorMessage?: string
}

const DEFAULT_HOME = "https://en.wikipedia.org"

// Safe fetch helper for reader mode
async function fetchReaderHtml(targetUrl: string) {
  const endpoint = `/api/browser/fetch?url=${encodeURIComponent(targetUrl)}`
  const res = await fetch(endpoint, { method: "GET" })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Fetch failed: ${res.status} ${res.statusText} :: ${text}`)
  }

  return res.json() as Promise<{ title?: string; html?: string; finalUrl?: string; error?: string }>
}

export function Browser() {
  const [tabs, setTabs] = useState<Tab[]>([{ id: "1", url: "", title: "New Tab", mode: "iframe", loadState: "idle" }])
  const [activeTabId, setActiveTabId] = useState("1")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const readerRef = useRef<HTMLIFrameElement>(null)

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0]

  const updateTab = useCallback((id: string, updates: Partial<Tab>) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }, [])

  // Detect iframe load errors (X-Frame-Options, CSP blocking)
  const handleIframeLoad = useCallback(() => {
    if (activeTab.mode === "iframe" && activeTab.loadState === "loading") {
      // If we get here, iframe loaded successfully
      updateTab(activeTab.id, { loadState: "success" })
    }
  }, [activeTab, updateTab])

  const handleIframeError = useCallback(() => {
    if (activeTab.mode === "iframe") {
      updateTab(activeTab.id, {
        loadState: "blocked",
        errorMessage: "This site cannot be displayed in an iframe.",
      })
    }
  }, [activeTab.id, updateTab])

  // Fetch page in Reader Mode via API
  const fetchReaderMode = useCallback(
    async (url: string) => {
      updateTab(activeTab.id, { loadState: "loading", mode: "reader" })

      try {
        // Use safe fetch helper - ensures absolute path and proper error handling
        const data = await fetchReaderHtml(url)

        if (data.error) {
          throw new Error(data.error)
        }

        if (!data.html) {
          throw new Error("No HTML content received")
        }

        // Inject click handler script for internal navigation
        const htmlWithHandler = injectLinkHandler(data.html, data.finalUrl || url)

        updateTab(activeTab.id, {
          loadState: "success",
          readerHtml: htmlWithHandler,
          title: data.title || new URL(url).hostname,
          url: data.finalUrl || url,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        updateTab(activeTab.id, {
          loadState: "error",
          errorMessage: message,
        })
      }
    },
    [activeTab.id, updateTab],
  )

  // Inject script to intercept link clicks in reader mode
  const injectLinkHandler = (html: string, baseUrl: string): string => {
    const script = `
      <script>
        document.addEventListener('click', function(e) {
          const link = e.target.closest('a[data-internal-link]');
          if (link) {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href) {
              window.parent.postMessage({ type: 'navigate', url: href }, '*');
            }
          }
        });
      </script>
      <style>
        body {
          background: #1e1e1e !important;
          color: #e0e0e0 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          line-height: 1.6 !important;
          padding: 20px !important;
          max-width: 900px !important;
          margin: 0 auto !important;
        }
        a { color: #6ba3d6 !important; }
        a:hover { color: #8bb8e0 !important; }
        img { max-width: 100% !important; height: auto !important; border-radius: 8px; }
        pre, code { background: #2d2d2d !important; padding: 2px 6px; border-radius: 4px; }
        pre { padding: 12px !important; overflow-x: auto; }
        blockquote { border-left: 3px solid #4a4a4a; padding-left: 16px; margin-left: 0; color: #a0a0a0; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #3d3d3d; padding: 8px 12px; text-align: left; }
        th { background: #2d2d2d; }
        h1, h2, h3, h4, h5, h6 { color: #ffffff; margin-top: 1.5em; margin-bottom: 0.5em; }
        hr { border: none; border-top: 1px solid #3d3d3d; margin: 24px 0; }
      </style>
    `
    // Insert before </head> or at start of <body>
    if (html.includes("</head>")) {
      return html.replace("</head>", `${script}</head>`)
    } else if (html.includes("<body")) {
      return html.replace(/<body([^>]*)>/, `<body$1>${script}`)
    }
    return script + html
  }

  // Listen for navigation messages from reader iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "navigate" && e.data?.url) {
        navigateToUrl(e.data.url)
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  // Navigate to a URL
  const navigateToUrl = useCallback(
    (url: string) => {
      // Normalize URL
      let normalizedUrl = url.trim()
      if (normalizedUrl && !normalizedUrl.match(/^https?:\/\//)) {
        // Check if it looks like a domain
        if (normalizedUrl.includes(".") && !normalizedUrl.includes(" ")) {
          normalizedUrl = `https://${normalizedUrl}`
        } else {
          // Treat as search query
          normalizedUrl = `https://www.google.com/search?q=${encodeURIComponent(normalizedUrl)}`
        }
      }

      if (!normalizedUrl) return

      const mode = activeTab.mode
      updateTab(activeTab.id, {
        url: normalizedUrl,
        loadState: "loading",
        title: new URL(normalizedUrl).hostname,
        errorMessage: undefined,
        readerHtml: undefined,
      })

      if (mode === "reader") {
        fetchReaderMode(normalizedUrl)
      }
      // Iframe mode will load automatically via src
    },
    [activeTab.id, activeTab.mode, updateTab, fetchReaderMode],
  )

  // Toggle between iframe and reader mode
  const toggleMode = useCallback(() => {
    const newMode = activeTab.mode === "iframe" ? "reader" : "iframe"
    updateTab(activeTab.id, { mode: newMode, loadState: "loading", readerHtml: undefined })

    if (newMode === "reader" && activeTab.url) {
      fetchReaderMode(activeTab.url)
    }
  }, [activeTab, updateTab, fetchReaderMode])

  // Switch to reader mode (from error state)
  const switchToReader = useCallback(() => {
    updateTab(activeTab.id, { mode: "reader", loadState: "loading" })
    if (activeTab.url) {
      fetchReaderMode(activeTab.url)
    }
  }, [activeTab, updateTab, fetchReaderMode])

  // Open URL externally
  const openExternal = useCallback(() => {
    if (activeTab.url) {
      window.open(activeTab.url, "_blank", "noopener,noreferrer")
    }
  }, [activeTab.url])

  // Add new tab
  const addTab = useCallback(() => {
    const id = Date.now().toString()
    setTabs((prev) => [...prev, { id, url: "", title: "New Tab", mode: "iframe", loadState: "idle" }])
    setActiveTabId(id)
  }, [])

  // Close tab
  const closeTab = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      if (tabs.length === 1) {
        // Reset the last tab instead of closing
        updateTab(id, { url: "", title: "New Tab", loadState: "idle", readerHtml: undefined })
        return
      }
      const newTabs = tabs.filter((t) => t.id !== id)
      setTabs(newTabs)
      if (activeTabId === id) {
        setActiveTabId(newTabs[newTabs.length - 1].id)
      }
    },
    [tabs, activeTabId, updateTab],
  )

  // Refresh
  const refresh = useCallback(() => {
    if (activeTab.url) {
      if (activeTab.mode === "reader") {
        fetchReaderMode(activeTab.url)
      } else {
        updateTab(activeTab.id, { loadState: "loading" })
        if (iframeRef.current) {
          iframeRef.current.src = activeTab.url
        }
      }
    }
  }, [activeTab, updateTab, fetchReaderMode])

  // Go home
  const goHome = useCallback(() => {
    navigateToUrl(DEFAULT_HOME)
  }, [navigateToUrl])

  // Detect iframe blocking with timeout
  useEffect(() => {
    if (activeTab.mode === "iframe" && activeTab.loadState === "loading" && activeTab.url) {
      const timeout = setTimeout(() => {
        // If still loading after 8s, suggest reader mode
        if (activeTab.loadState === "loading") {
          updateTab(activeTab.id, {
            loadState: "blocked",
            errorMessage: "Page is taking too long or may be blocked.",
          })
        }
      }, 8000)
      return () => clearTimeout(timeout)
    }
  }, [activeTab.mode, activeTab.loadState, activeTab.url, activeTab.id, updateTab])

  const [inputUrl, setInputUrl] = useState("")

  useEffect(() => {
    setInputUrl(activeTab.url)
  }, [activeTab.url, activeTab.id])

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      {/* Tabs bar */}
      <div className="flex items-center gap-0.5 px-2 pt-1.5 bg-[#2a2a2a]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-t-lg px-3 py-1.5 max-w-[180px] min-w-[100px] transition-colors",
              tab.id === activeTabId ? "bg-[#1a1a1a]" : "bg-[#353535] hover:bg-[#404040]",
            )}
          >
            {tab.loadState === "loading" ? (
              <Loader2 className="h-3.5 w-3.5 text-white/60 animate-spin flex-shrink-0" />
            ) : (
              <Globe className="h-3.5 w-3.5 text-white/60 flex-shrink-0" />
            )}
            <span className="text-xs text-white/90 truncate flex-1 text-left">{tab.title}</span>
            <button
              onClick={(e) => closeTab(tab.id, e)}
              className="p-0.5 rounded hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <X className="h-3 w-3 text-white/50 hover:text-white/80" />
            </button>
          </button>
        ))}
        <button onClick={addTab} className="p-1.5 rounded hover:bg-white/10 transition-colors ml-1">
          <Plus className="h-4 w-4 text-white/60" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-2 py-1.5 bg-[#1a1a1a] border-b border-[#3a3a3a]">
        <div className="flex items-center gap-0.5">
          <button className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={refresh}
            className={cn(
              "p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors",
              activeTab.loadState === "loading" && "animate-spin",
            )}
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            onClick={goHome}
            className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <Home className="h-4 w-4" />
          </button>
        </div>

        {/* Address bar */}
        <div className="flex-1 flex items-center gap-2 bg-[#2d2d2d] rounded-full px-3 py-1.5">
          <Shield className="h-4 w-4 text-white/40 flex-shrink-0" />
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && navigateToUrl(inputUrl)}
            placeholder="Search or enter URL..."
            className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/40 focus:outline-none min-w-0"
          />
          <button className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0">
            <Star className="h-4 w-4 text-white/40" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center bg-[#2d2d2d] rounded-lg p-0.5">
          <button
            onClick={toggleMode}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
              activeTab.mode === "iframe" ? "bg-[#404040] text-white" : "text-white/50 hover:text-white/70",
            )}
            title="Iframe Mode"
          >
            <Globe className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={toggleMode}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
              activeTab.mode === "reader" ? "bg-[#404040] text-white" : "text-white/50 hover:text-white/70",
            )}
            title="Reader Mode"
          >
            <BookOpen className="h-3.5 w-3.5" />
          </button>
        </div>

        <button className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative bg-[#1e1e1e] overflow-hidden">
        {/* Idle state - New Tab page */}
        {activeTab.loadState === "idle" && !activeTab.url && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#0078d4] to-[#00a2ed] flex items-center justify-center shadow-lg">
                <Globe className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-xl font-medium text-white/90 mb-2">Web Browser</h1>
              <p className="text-sm text-white/50 mb-6">Enter a URL or search the web</p>
              <button
                onClick={goHome}
                className="px-4 py-2 bg-[#0078d4] hover:bg-[#1a86d9] text-white text-sm font-medium rounded-lg transition-colors"
              >
                Go to Wikipedia
              </button>
            </div>
          </div>
        )}

        {/* Error / Blocked state */}
        {(activeTab.loadState === "error" || activeTab.loadState === "blocked") && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md px-6">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#3d3d3d] flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-amber-400" />
              </div>
              <h2 className="text-lg font-medium text-white/90 mb-2">
                {activeTab.loadState === "blocked" ? "Page Blocked" : "Failed to Load"}
              </h2>
              <p className="text-sm text-white/50 mb-6">{activeTab.errorMessage}</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={switchToReader}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0078d4] hover:bg-[#1a86d9] text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  Try Reader Mode
                </button>
                <button
                  onClick={openExternal}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white/90 text-sm font-medium rounded-lg transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Externally
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {activeTab.loadState === "loading" && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#2d2d2d] overflow-hidden z-10">
            <div className="h-full w-1/3 bg-[#0078d4] animate-[loading_1s_ease-in-out_infinite]" />
          </div>
        )}

        {/* Iframe Mode */}
        {activeTab.mode === "iframe" &&
          activeTab.url &&
          activeTab.loadState !== "blocked" &&
          activeTab.loadState !== "error" && (
            <iframe
              ref={iframeRef}
              src={activeTab.url}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              className="absolute inset-0 w-full h-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
              referrerPolicy="no-referrer"
            />
          )}

        {/* Reader Mode */}
        {activeTab.mode === "reader" && activeTab.readerHtml && activeTab.loadState === "success" && (
          <iframe
            ref={readerRef}
            srcDoc={activeTab.readerHtml}
            className="absolute inset-0 w-full h-full border-0"
            sandbox="allow-same-origin"
          />
        )}
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(200%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}
