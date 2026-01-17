import { type NextRequest, NextResponse } from "next/server"
import { JSDOM } from "jsdom"
import createDOMPurify from "dompurify"

// Sanitize HTML on the server
function sanitizeHtml(html: string, baseUrl: string): { sanitized: string; title: string } {
  const dom = new JSDOM(html, { url: baseUrl })
  const DOMPurify = createDOMPurify(dom.window)

  // Extract title before sanitizing
  const title = dom.window.document.title || new URL(baseUrl).hostname

  // Configure DOMPurify to remove dangerous elements
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "html",
      "head",
      "body",
      "title",
      "meta",
      "link",
      "style",
      "div",
      "span",
      "p",
      "a",
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "article",
      "section",
      "header",
      "footer",
      "nav",
      "main",
      "aside",
      "figure",
      "figcaption",
      "blockquote",
      "pre",
      "code",
      "em",
      "strong",
      "b",
      "i",
      "u",
      "s",
      "br",
      "hr",
      "small",
      "sub",
      "sup",
      "mark",
      "details",
      "summary",
      "time",
      "address",
      "abbr",
      "cite",
      "q",
      "picture",
      "source",
      "video",
      "audio",
      "track",
      "label",
      "input",
      "button",
      "form",
      "fieldset",
      "legend",
      "select",
      "option",
      "textarea",
      "dl",
      "dt",
      "dd",
      "caption",
      "colgroup",
      "col",
    ],
    ALLOWED_ATTR: [
      "href",
      "src",
      "alt",
      "title",
      "class",
      "id",
      "style",
      "width",
      "height",
      "target",
      "rel",
      "type",
      "name",
      "value",
      "placeholder",
      "disabled",
      "readonly",
      "checked",
      "selected",
      "colspan",
      "rowspan",
      "scope",
      "datetime",
      "cite",
      "data-*",
      "aria-*",
      "role",
      "loading",
      "decoding",
      "srcset",
      "sizes",
      "media",
      "poster",
      "controls",
      "autoplay",
      "loop",
      "muted",
    ],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
    WHOLE_DOCUMENT: true,
    ADD_TAGS: ["style"],
    ADD_ATTR: ["target"],
  })

  // Rewrite relative URLs to absolute
  const sanitizedDom = new JSDOM(sanitized, { url: baseUrl })
  const doc = sanitizedDom.window.document

  // Rewrite links
  doc.querySelectorAll("a[href]").forEach((el) => {
    const href = el.getAttribute("href")
    if (href && !href.startsWith("javascript:") && !href.startsWith("data:")) {
      try {
        const absoluteUrl = new URL(href, baseUrl).href
        el.setAttribute("href", absoluteUrl)
        el.setAttribute("data-internal-link", "true")
      } catch {
        // Invalid URL, remove it
        el.removeAttribute("href")
      }
    }
  })

  // Rewrite images
  doc.querySelectorAll("img[src]").forEach((el) => {
    const src = el.getAttribute("src")
    if (src) {
      try {
        const absoluteUrl = new URL(src, baseUrl).href
        el.setAttribute("src", absoluteUrl)
      } catch {
        // Invalid URL
      }
    }
  })

  // Rewrite srcset
  doc.querySelectorAll("[srcset]").forEach((el) => {
    const srcset = el.getAttribute("srcset")
    if (srcset) {
      const rewritten = srcset
        .split(",")
        .map((entry) => {
          const parts = entry.trim().split(/\s+/)
          if (parts[0]) {
            try {
              parts[0] = new URL(parts[0], baseUrl).href
            } catch {
              // Invalid URL
            }
          }
          return parts.join(" ")
        })
        .join(", ")
      el.setAttribute("srcset", rewritten)
    }
  })

  // Rewrite CSS url() references in style tags
  doc.querySelectorAll("style").forEach((styleEl) => {
    if (styleEl.textContent) {
      styleEl.textContent = styleEl.textContent.replace(/url$$['"]?([^'")]+)['"]?$$/g, (match, url) => {
        try {
          const absoluteUrl = new URL(url, baseUrl).href
          return `url('${absoluteUrl}')`
        } catch {
          return match
        }
      })
    }
  })

  // Add base tag for any remaining relative resources
  const head = doc.querySelector("head")
  if (head) {
    const existingBase = doc.querySelector("base")
    if (!existingBase) {
      const base = doc.createElement("base")
      base.setAttribute("href", baseUrl)
      head.insertBefore(base, head.firstChild)
    }
  }

  return {
    sanitized: sanitizedDom.serialize(),
    title,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetUrl = searchParams.get("url")

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
  }

  // Validate URL
  let parsedUrl: URL
  try {
    parsedUrl = new URL(targetUrl)
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid protocol")
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status} ${response.statusText}` },
        { status: response.status },
      )
    }

    const contentType = response.headers.get("content-type") || ""
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return NextResponse.json({ error: "URL does not return HTML content" }, { status: 400 })
    }

    const html = await response.text()
    const { sanitized, title } = sanitizeHtml(html, response.url || targetUrl)

    // Return with strict CSP
    return new NextResponse(JSON.stringify({ html: sanitized, title, finalUrl: response.url || targetUrl }), {
      headers: {
        "Content-Type": "application/json",
        "Content-Security-Policy": "default-src 'self'; style-src 'unsafe-inline'; img-src * data: blob:;",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Fetch failed: ${message}` }, { status: 500 })
  }
}
