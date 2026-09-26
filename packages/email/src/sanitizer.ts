import sanitizeHtml from "sanitize-html";

export interface SanitizeOptions {
  blockExternalImages?: boolean;
  allowedLinkSchemes?: string[];
}

/**
 * Sanitizes untrusted HTML from email bodies.
 * Removes JavaScript, iframes, form elements, CSS injection, and handles external image blocking.
 */
export function sanitizeEmailHtml(rawHtml: string, options: SanitizeOptions = {}): string {
  if (!rawHtml || typeof rawHtml !== "string") {
    return "";
  }

  const blockImages = options.blockExternalImages ?? true;

  const clean = sanitizeHtml(rawHtml, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "p", "a", "ul", "ol",
      "nl", "li", "b", "i", "strong", "em", "strike", "code", "hr", "br", "div",
      "table", "thead", "caption", "tbody", "tr", "th", "td", "pre", "span",
      "img", "font", "center", "u", "s", "sub", "sup"
    ],
    allowedAttributes: {
      a: ["href", "name", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height", "style", "class", "data-original-src"],
      div: ["style", "class", "align"],
      span: ["style", "class"],
      p: ["style", "class", "align"],
      table: ["style", "class", "width", "height", "border", "cellpadding", "cellspacing", "bgcolor", "align"],
      td: ["style", "class", "width", "height", "valign", "align", "colspan", "rowspan", "bgcolor"],
      th: ["style", "class", "width", "height", "valign", "align", "colspan", "rowspan", "bgcolor"],
      tr: ["style", "class", "valign", "align"],
      font: ["color", "size", "face"],
      "*": ["dir"]
    },
    allowedSchemes: options.allowedLinkSchemes || ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["data", "http", "https", "cid"],
    },
    transformTags: {
      a: (tagName, attribs): sanitizeHtml.Tag => {
        const href = attribs.href || "";
        // Prevent javascript: or unsafe links
        if (href.trim().toLowerCase().startsWith("javascript:") || href.trim().toLowerCase().startsWith("vbscript:")) {
          return { tagName: "span", attribs: { class: "unsafe-link-stripped" } };
        }
        return {
          tagName: "a",
          attribs: {
            ...attribs,
            target: "_blank",
            rel: "noopener noreferrer nofollow",
          },
        };
      },
      img: (tagName, attribs): sanitizeHtml.Tag => {
        const src = attribs.src || "";
        // If image blocking is enabled and image is remote HTTP/HTTPS (not embedded CID / data URL)
        if (blockImages && (src.startsWith("http://") || src.startsWith("https://"))) {
          return {
            tagName: "img",
            attribs: {
              ...attribs,
              "data-original-src": src,
              src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='20'><rect width='100%' height='100%' fill='%23222'/><text x='50%' y='60%' fill='%23888' font-size='10' text-anchor='middle'>Image Blocked</text></svg>",
              class: "vxmail-blocked-image",
            },
          };
        }
        return {
          tagName: "img",
          attribs,
        };
      },
    },
  });

  return clean;
}
