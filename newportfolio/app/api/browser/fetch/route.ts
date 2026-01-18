// app/api/browser/fetch/route.ts
import { NextResponse } from "next/server"
import dns from "node:dns/promises"
import net from "node:net"

export const runtime = "nodejs"

const MAX_HTML_BYTES = 2_000_000 // 2MB, enough for most pages in a portfolio
const FETCH_TIMEOUT_MS = 12_000

function isPrivateIp(ip: string) {
  // IPv6
  if (ip.includes(":")) {
    const normalized = ip.toLowerCase()
    if (normalized === "::1") return true
    // fc00::/7 (unique local), fe80::/10 (link-local)
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true
    if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb"))
      return true
    return false
  }

  // IPv4
  const parts = ip.split(".").map((p) => Number(p))
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true

  const [a, b] = parts

  if (a === 127) return true // loopback
  if (a === 10) return true // 10/8
  if (a === 169 && b === 254) return true // link-local
  if (a === 192 && b === 168) return true // 192.168/16
  if (a === 172 && b >= 16 && b <= 31) return true // 172.16/12
  if (a === 0) return true

  return false
}

async function assertSafeUrl(target: URL) {
  if (!["http:", "https:"].includes(target.protocol)) {
    throw new Error("Only http/https URLs are allowed.")
  }

  const hostname = target.hostname.toLowerCase()

  // obvious localhost blocks
  if (hostname === "localhost" || hostname.endsWith(".localhost")) throw new Error("Blocked host.")
  if (hostname === "0.0.0.0") throw new Error("Blocked host.")

  // If hostname is literal IP, validate directly
  const ipType = net.isIP(hostname)
  if (ipType) {
    if (isPrivateIp(hostname)) throw new Error("Blocked IP.")
    return
  }

  // Resolve DNS and block private ranges
  const records = await dns.lookup(hostname, { all: true })
  if (!records.length) throw new Error("DNS lookup failed.")
  for (const r of records) {
    if (isPrivateIp(r.address)) throw new Error("Blocked IP.")
  }
}

function safeDecodeHtml(bytes: Uint8Array) {
  // Basic: assume UTF-8 (works for most modern sites)
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes)
}

function stripCspMeta(html: string) {
  // Removes CSP meta tags (common in some pages)
  return html
    .replace(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*>/gi, "")
    .replace(/<meta[^>]+name=["']Content-Security-Policy["'][^>]*>/gi, "")
}

function injectBaseTag(html: string, baseHref: string) {
  const baseTag = `<base href="${baseHref}">`

  if (/<base\s/i.test(html)) return html

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`)
  }

  // If no <head>, prepend a minimal head
  return `<!doctype html><head>${baseTag}</head>${html}`
}

function absolutifyAttrs(html: string, finalUrl: string) {
  const base = new URL(finalUrl)

  const ATTRS = ["href", "src", "action", "poster"]
  const attrGroup = ATTRS.join("|")

  // Replace href/src/action/poster="..."
  return html.replace(
    new RegExp(`\\s(${attrGroup})=(["'])(.*?)\\2`, "gi"),
    (full, attrName: string, quote: string, value: string) => {
      const v = value.trim()
      if (!v) return full

      // leave these alone
      const lower = v.toLowerCase()
      if (
        lower.startsWith("data:") ||
        lower.startsWith("mailto:") ||
        lower.startsWith("tel:") ||
        lower.startsWith("javascript:") ||
        lower.startsWith("#")
      ) {
        return full
      }

      try {
        // Protocol-relative
        if (v.startsWith("//")) {
          const abs = `${base.protocol}${v}`
          return ` ${attrName}=${quote}${abs}${quote}`
        }

        // Absolute already
        if (/^https?:\/\//i.test(v)) return full

        // Resolve relative
        const abs = new URL(v, base).toString()
        return ` ${attrName}=${quote}${abs}${quote}`
      } catch {
        return full
      }
    }
  )
}

function injectNavigationBridge(html: string) {
  // Captures link clicks + form submits and sends parent a postMessage
  // so your React app can update the address bar and navigate without reloading the whole Next site.
  const script = `
<script>
(function(){
  function toAbs(url){
    try { return new URL(url, document.baseURI).toString(); } catch(e){ return null; }
  }

  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if(!a) return;

    var href = a.getAttribute('href');
    if(!href) return;

    var abs = toAbs(href);
    if(!abs) return;

    // prevent default navigation inside srcDoc
    e.preventDefault();
    try {
      window.parent.postMessage({ type: 'DAEDALOS_BROWSER_NAVIGATE', url: abs }, '*');
    } catch(_){}
  }, true);

  document.addEventListener('submit', function(e){
    var form = e.target;
    if(!form || !form.action) return;

    e.preventDefault();

    var method = (form.method || 'GET').toUpperCase();
    var actionAbs = toAbs(form.action) || form.action;

    if(method === 'GET'){
      try{
        var fd = new FormData(form);
        var u = new URL(actionAbs, document.baseURI);
        fd.forEach(function(v,k){ u.searchParams.set(k, String(v)); });
        window.parent.postMessage({ type: 'DAEDALOS_BROWSER_NAVIGATE', url: u.toString() }, '*');
      }catch(_){}
    } else {
      // For POST we just let the parent open externally (simpler + safer for a portfolio)
      try {
        window.parent.postMessage({ type: 'DAEDALOS_BROWSER_OPEN_EXTERNAL', url: actionAbs }, '*');
      } catch(_){}
    }
  }, true);
})();
</script>
`

  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${script}</body>`)
  return html + script
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const raw = searchParams.get("url")
    if (!raw) return NextResponse.json({ error: "Missing url" }, { status: 400 })

    let target: URL
    try {
      target = new URL(raw)
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    await assertSafeUrl(target)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const res = await fetch(target.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        // Helps many sites return HTML
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    }).finally(() => clearTimeout(timeout))

    const finalUrl = res.url || target.toString()

    const contentType = res.headers.get("content-type") || ""
    if (!contentType.toLowerCase().includes("text/html")) {
      return NextResponse.json(
        { error: `Unsupported content-type: ${contentType}`, finalUrl },
        { status: 415 }
      )
    }

    // Limit size
    const reader = res.body?.getReader()
    if (!reader) {
      return NextResponse.json({ error: "Empty response body", finalUrl }, { status: 502 })
    }

    let received = 0
    const chunks: Uint8Array[] = []

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        received += value.byteLength
        if (received > MAX_HTML_BYTES) {
          return NextResponse.json(
            { error: "Page too large for Reader Mode", finalUrl },
            { status: 413 }
          )
        }
        chunks.push(value)
      }
    }

    const merged = new Uint8Array(received)
    let offset = 0
    for (const c of chunks) {
      merged.set(c, offset)
      offset += c.byteLength
    }

    let html = safeDecodeHtml(merged)

    // Rewrite pipeline
    html = stripCspMeta(html)
    html = injectBaseTag(html, finalUrl)
    html = absolutifyAttrs(html, finalUrl)
    html = injectNavigationBridge(html)

    // Grab a title (best-effort)
    let title = ""
    const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    if (m?.[1]) title = m[1].trim().replace(/\s+/g, " ").slice(0, 140)

    return NextResponse.json({ title, html, finalUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
