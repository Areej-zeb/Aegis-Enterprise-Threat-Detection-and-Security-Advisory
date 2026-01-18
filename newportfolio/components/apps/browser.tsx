"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, RotateCw, Home, Search, Star, ExternalLink, BookOpen, Globe, Sparkles } from "lucide-react"

type Mode = "iframe" | "reader"

type ReaderPayload = {
  title?: string
  html?: string
  finalUrl?: string
  error?: string
}

function normalizeInputToUrl(input: string) {
  const raw = input.trim()
  if (!raw) return "os://welcome"
  if (raw.startsWith("os://") || raw.startsWith("about:")) return raw

  const looksLikeHttp = /^https?:\/\//i.test(raw)
  const looksLikeDomain = /^[a-z0-9.-]+\.[a-z]{2,}([/].*)?$/i.test(raw)

  if (looksLikeHttp) return raw
  if (looksLikeDomain) return `https://${raw}`

  return `https://duckduckgo.com/?q=${encodeURIComponent(raw)}`
}

export function Browser() {
  const HOME_URL = "os://welcome"

  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const readerFrameRef = useRef<HTMLIFrameElement | null>(null)

  const [mode, setMode] = useState<Mode>("iframe")
  const [url, setUrl] = useState<string>(HOME_URL)
  const [inputUrl, setInputUrl] = useState<string>(HOME_URL)

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [title, setTitle] = useState<string>("")
  const [error, setError] = useState<string>("")

  const [readerHtml, setReaderHtml] = useState<string>("")
  const [readerFinalUrl, setReaderFinalUrl] = useState<string>("")

  const [history, setHistory] = useState<string[]>([HOME_URL])
  const [historyIndex, setHistoryIndex] = useState<number>(0)

  const canGoBack = historyIndex > 0
  const canGoForward = historyIndex < history.length - 1

  const isInternal = useMemo(() => url.startsWith("os://") || url.startsWith("about:"), [url])

  const pushHistory = useCallback(
    (nextUrl: string) => {
      setHistory((prev) => {
        const prefix = prev.slice(0, historyIndex + 1)
        return [...prefix, nextUrl]
      })
      setHistoryIndex((prev) => prev + 1)
    },
    [historyIndex]
  )

  const navigateTo = useCallback(
    (raw: string, opts?: { replace?: boolean; preferredMode?: Mode }) => {
      const next = normalizeInputToUrl(raw)

      setError("")
      setTitle("")
      setIsLoading(true)

      if (opts?.replace) {
        setUrl(next)
        setInputUrl(next)
        setHistory((prev) => {
          const copy = [...prev]
          copy[historyIndex] = next
          return copy
        })
      } else {
        setUrl(next)
        setInputUrl(next)
        pushHistory(next)
      }

      if (opts?.preferredMode) setMode(opts.preferredMode)
    },
    [historyIndex, pushHistory]
  )

  const goBack = useCallback(() => {
    if (!canGoBack) return
    const nextIndex = historyIndex - 1
    const nextUrl = history[nextIndex]
    setHistoryIndex(nextIndex)
    setUrl(nextUrl)
    setInputUrl(nextUrl)
    setError("")
    setTitle("")
    setIsLoading(true)
  }, [canGoBack, history, historyIndex])

  const goForward = useCallback(() => {
    if (!canGoForward) return
    const nextIndex = historyIndex + 1
    const nextUrl = history[nextIndex]
    setHistoryIndex(nextIndex)
    setUrl(nextUrl)
    setInputUrl(nextUrl)
    setError("")
    setTitle("")
    setIsLoading(true)
  }, [canGoForward, history, historyIndex])

  const openExternal = useCallback(() => {
    const external = isInternal ? "https://example.com" : url
    window.open(external, "_blank", "noopener,noreferrer")
  }, [isInternal, url])

  const refresh = useCallback(() => {
    setError("")
    setTitle("")
    setIsLoading(true)

    if (mode === "iframe" && iframeRef.current) {
      const current = iframeRef.current.src
      iframeRef.current.src = "about:blank"
      window.setTimeout(() => {
        if (iframeRef.current) iframeRef.current.src = current
      }, 0)
      return
    }

    if (mode === "reader") {
      // Re-trigger reader fetch via effect by setting url to itself
      setUrl((u) => u)
      return
    }

    setIsLoading(false)
  }, [mode])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      navigateTo(inputUrl)
    },
    [inputUrl, navigateTo]
  )

  // Reader fetch
  useEffect(() => {
    if (mode !== "reader") return

    if (isInternal) {
      setReaderHtml("")
      setReaderFinalUrl("")
      setTitle("")
      setIsLoading(false)
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        setError("")
        setIsLoading(true)

        const endpoint = `/api/browser/fetch?url=${encodeURIComponent(url)}`
        const res = await fetch(endpoint)
        if (!res.ok) {
          const t = await res.text().catch(() => "")
          throw new Error(`Reader fetch failed (${res.status}). ${t}`)
        }

        const data = (await res.json()) as ReaderPayload
        if (data.error) throw new Error(data.error)

        if (cancelled) return
        setReaderHtml(data.html ?? "")
        setReaderFinalUrl(data.finalUrl ?? url)
        setTitle(data.title ?? "")
        setError("")
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Reader Mode failed.")
      } finally {
        if (cancelled) return
        setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isInternal, mode, url])

  // Receive navigation events from Reader Mode (injected script)
  useEffect(() => {
    const onMsg = (event: MessageEvent) => {
      const data = event.data
      if (!data || typeof data !== "object") return

      if (data.type === "DAEDALOS_BROWSER_NAVIGATE" && typeof data.url === "string") {
        navigateTo(data.url, { preferredMode: "reader" })
      } else if (data.type === "DAEDALOS_BROWSER_OPEN_EXTERNAL" && typeof data.url === "string") {
        window.open(data.url, "_blank", "noopener,noreferrer")
      }
    }

    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [navigateTo])

  const onIframeLoad = useCallback(() => {
    setIsLoading(false)
    setError("")
  }, [])

  const showHint = mode === "iframe" && !isInternal && !isLoading

  // Home page content
  const renderHomePage = () => (
    <div className="h-full w-full flex items-center justify-center overflow-y-auto bg-gradient-to-br from-[#0a0a1a] via-[#151528] to-[#0d0d1a]">
      <div className="max-w-4xl w-full px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative">
              <Globe className="h-20 w-20 text-[#60cdff] animate-pulse" />
              <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-[#60cdff] to-[#a855f7] bg-clip-text text-transparent">
            daedalOS Browser
          </h1>
          <p className="text-xl text-white/70 mb-2">Navigate the web with style</p>
          <p className="text-sm text-white/50">Powered by Reader Mode • Works on most websites</p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {[
            { name: "Wikipedia", url: "https://wikipedia.org", icon: "📚" },
            { name: "GitHub", url: "https://github.com", icon: "💻" },
            { name: "Reddit", url: "https://reddit.com", icon: "🤖" },
            { name: "Hacker News", url: "https://news.ycombinator.com", icon: "🔥" },
            { name: "MDN Web Docs", url: "https://developer.mozilla.org", icon: "📖" },
            { name: "Stack Overflow", url: "https://stackoverflow.com", icon: "💡" },
          ].map((site) => (
            <button
              key={site.name}
              onClick={() => {
                setMode("reader")
                navigateTo(site.url, { preferredMode: "reader" })
              }}
              className="group relative p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#60cdff]/40 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{site.icon}</span>
                <div>
                  <div className="text-white/90 font-medium group-hover:text-white">{site.name}</div>
                  <div className="text-xs text-white/50">{site.url}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <BookOpen className="h-8 w-8 text-[#60cdff] mb-3" />
            <h3 className="text-white font-semibold mb-2">Reader Mode</h3>
            <p className="text-sm text-white/60">
              Clean, readable content from blogs, docs, and news sites. Perfect for articles and documentation.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <Globe className="h-8 w-8 text-[#60cdff] mb-3" />
            <h3 className="text-white font-semibold mb-2">Iframe Mode</h3>
            <p className="text-sm text-white/60">
              Full browser experience for sites that support it. Switch modes anytime with one click.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <Search className="h-8 w-8 text-[#60cdff] mb-3" />
            <h3 className="text-white font-semibold mb-2">Smart Search</h3>
            <p className="text-sm text-white/60">
              Type a URL or search query. We'll figure out what you mean and take you there.
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-12 p-6 rounded-xl bg-gradient-to-r from-[#60cdff]/10 to-[#a855f7]/10 border border-[#60cdff]/20">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            Pro Tips & Tricks
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-[#60cdff] mt-0.5">🔀</span>
                <div>
                  <div className="text-white/90 font-medium text-sm mb-1">Switch Modes</div>
                  <div className="text-xs text-white/60">
                    If a site says "refused to connect" in Iframe Mode, toggle to Reader Mode for better compatibility.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#60cdff] mt-0.5">📖</span>
                <div>
                  <div className="text-white/90 font-medium text-sm mb-1">Reader Mode Best For</div>
                  <div className="text-xs text-white/60">
                    Blogs, documentation, wikis, news sites, and articles work perfectly in Reader Mode.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#60cdff] mt-0.5">🔗</span>
                <div>
                  <div className="text-white/90 font-medium text-sm mb-1">Click to Navigate</div>
                  <div className="text-xs text-white/60">
                    Click any link inside Reader Mode to navigate without leaving the browser window.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#60cdff] mt-0.5">⌨️</span>
                <div>
                  <div className="text-white/90 font-medium text-sm mb-1">Smart URL Input</div>
                  <div className="text-xs text-white/60">
                    Type a domain like "github.com" or a full URL. We'll auto-detect and format it correctly.
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-[#60cdff] mt-0.5">🔍</span>
                <div>
                  <div className="text-white/90 font-medium text-sm mb-1">Search Integration</div>
                  <div className="text-xs text-white/60">
                    Type a search query and we'll automatically search using DuckDuckGo.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#60cdff] mt-0.5">⬅️➡️</span>
                <div>
                  <div className="text-white/90 font-medium text-sm mb-1">History Navigation</div>
                  <div className="text-xs text-white/60">
                    Use the back and forward buttons to navigate through your browsing history.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#60cdff] mt-0.5">🌐</span>
                <div>
                  <div className="text-white/90 font-medium text-sm mb-1">External Links</div>
                  <div className="text-xs text-white/60">
                    Click the external link icon to open the current page in your default browser.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#60cdff] mt-0.5">⚡</span>
                <div>
                  <div className="text-white/90 font-medium text-sm mb-1">Performance Note</div>
                  <div className="text-xs text-white/60">
                    Heavy JS apps (YouTube, Gmail) may not work fully. Reader Mode is optimized for content sites.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Try it out */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setMode("reader")
              navigateTo("https://example.com", { preferredMode: "reader" })
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#60cdff] to-[#a855f7] text-white font-semibold hover:shadow-lg hover:shadow-[#60cdff]/50 transition-all"
          >
            Try Example.com
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-[#151528] border-b border-white/10">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className="p-1.5 rounded hover:bg-white/10 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          title="Back"
        >
          <ArrowLeft className="h-4 w-4 text-white/70" />
        </button>

        <button
          onClick={goForward}
          disabled={!canGoForward}
          className="p-1.5 rounded hover:bg-white/10 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          title="Forward"
        >
          <ArrowRight className="h-4 w-4 text-white/70" />
        </button>

        <button onClick={refresh} className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Refresh">
          <RotateCw className="h-4 w-4 text-white/70" />
        </button>

        <button
          onClick={() => navigateTo(HOME_URL, { preferredMode: "iframe" })}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title="Home"
        >
          <Home className="h-4 w-4 text-white/70" />
        </button>

        <form onSubmit={handleSubmit} className="flex-1 flex items-center">
          <div className="flex-1 flex items-center gap-2 bg-[#0d0d1a] rounded-full px-4 py-1.5 border border-white/5 focus-within:border-sky-500/40">
            <Search className="h-4 w-4 text-white/40" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white/90 outline-none"
              placeholder="Search or enter URL"
            />
          </div>
        </form>

        <button
          onClick={() => setMode((m) => (m === "iframe" ? "reader" : "iframe"))}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title={mode === "iframe" ? "Switch to Reader Mode" : "Switch to Iframe Mode"}
        >
          {mode === "iframe" ? <BookOpen className="h-4 w-4 text-white/70" /> : <Globe className="h-4 w-4 text-white/70" />}
        </button>

        <button onClick={openExternal} className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Open externally">
          <ExternalLink className="h-4 w-4 text-white/70" />
        </button>

        <button className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Bookmark (placeholder)">
          <Star className="h-4 w-4 text-white/70" />
        </button>
      </div>

      {/* Loading bar */}
      <div className="h-[2px] bg-white/5">
        <div className="h-full bg-sky-500/70 transition-[width] duration-200" style={{ width: isLoading ? "60%" : "0%" }} />
      </div>

      {/* Content */}
      <div className="relative flex-1 bg-[#0d0d1a]">
        {isInternal ? (
          renderHomePage()
        ) : mode === "iframe" ? (
          <>
            <iframe
              ref={iframeRef}
              key={url}
              src={url}
              className="h-full w-full"
              sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
              onLoad={onIframeLoad}
            />

            {showHint ? (
              <div className="absolute left-3 bottom-3 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/70 backdrop-blur">
                If this site says "refused to connect", switch to <span className="text-white/90">Reader Mode</span>.
              </div>
            ) : null}
          </>
        ) : (
          <>
            {error ? (
              <div className="h-full w-full flex items-center justify-center p-8">
                <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#0b0c10]/80 p-5">
                  <div className="text-white font-semibold text-lg">Reader Mode failed</div>
                  <div className="mt-2 text-sm text-white/70">{error}</div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setMode("iframe")}
                      className="flex-1 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2 text-sm text-white/90"
                    >
                      Try Iframe Mode
                    </button>
                    <button
                      onClick={openExternal}
                      className="flex-1 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2 text-sm text-white/90"
                    >
                      Open Externally
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <iframe
                ref={readerFrameRef}
                className="h-full w-full"
                srcDoc={readerHtml || "<div style='color:#bbb;font-family:system-ui;padding:24px'>Loading...</div>"}
                sandbox="allow-same-origin"
                onLoad={() => setIsLoading(false)}
              />
            )}

            <div className="absolute left-3 bottom-3 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/70 backdrop-blur">
              Reader Mode{title ? ` • ${title}` : ""}{readerFinalUrl ? ` • ${readerFinalUrl}` : ""}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
