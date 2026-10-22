const ALLOWED = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "a", "ul", "ol", "li", "h1", "h2", "h3", "h4", "blockquote", "span", "div",
  "table", "thead", "tbody", "tr", "td", "th", "img",
]);

function attr(source: string, name: string) {
  const match = source.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
  return match?.[2] ?? match?.[3] ?? "";
}

function safeStyle(value: string) {
  return value.replace(/expression|javascript|url\s*\(|@import|behavior|-moz-binding/gi, "").replace(/"/g, "");
}

export function sanitizeEmailHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (tag, name: string, attrs: string) => {
      const tagName = name.toLowerCase();
      if (!ALLOWED.has(tagName)) return "";
      if (tag.startsWith("</")) return `</${tagName}>`;
      if (tagName === "br") return "<br>";
      const kept: string[] = [];
      const style = safeStyle(attr(attrs, "style"));
      if (style) kept.push(`style="${style}"`);
      if (tagName === "a") {
        const url = attr(attrs, "href");
        const safe = /^(https?:|mailto:|#|\{)/i.test(url) ? url.replace(/"/g, "") : "#";
        kept.unshift(`href="${safe}"`);
      }
      if (tagName === "img") {
        const src = attr(attrs, "src");
        if (/^https?:/i.test(src)) kept.push(`src="${src.replace(/"/g, "")}"`);
        const alt = attr(attrs, "alt").replace(/"/g, "");
        kept.push(`alt="${alt}"`);
      }
      if (tagName === "td" || tagName === "th") {
        const align = attr(attrs, "align");
        if (/^(left|center|right)$/i.test(align)) kept.push(`align="${align}"`);
      }
      return `<${tagName}${kept.length ? ` ${kept.join(" ")}` : ""}>`;
    });
}

export function fillPlaceholders(template: string, values: Record<string, string>) {
  return template.replace(/\{([a-z0-9_]+)\}/gi, (token, key: string) => values[key] ?? token);
}

export function wrapEmailHtml(body: string) {
  const inner = sanitizeEmailHtml(body);
  return `<!DOCTYPE html><html><body style="margin:0;background:#eef2f6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f6;"><tr><td align="center" style="padding:28px 12px;">
<div id="email-body" style="width:560px;max-width:560px;text-align:left;">${inner}</div>
</td></tr></table></body></html>`;
}

export function htmlToText(html: string) {
  return html
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-4]|ol|ul|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function rupiah(value: string | number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
}
