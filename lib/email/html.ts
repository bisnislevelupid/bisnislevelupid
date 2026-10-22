const ALLOWED = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "a", "ul", "ol", "li", "h1", "h2", "h3", "h4", "blockquote", "span", "div",
]);

export function sanitizeEmailHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (tag, name: string, attrs: string) => {
      const tagName = name.toLowerCase();
      if (!ALLOWED.has(tagName)) return "";
      if (tag.startsWith("</")) return `</${tagName}>`;
      if (tagName === "br") return "<br>";
      if (tagName === "a") {
        const href = attrs.match(/href\s*=\s*("([^"]*)"|'([^']*)')/i);
        const url = href?.[2] ?? href?.[3] ?? "";
        const safe = /^(https?:|mailto:|#|\{)/i.test(url) ? url : "#";
        return `<a href="${safe}" style="color:#059669;">`;
      }
      return `<${tagName}>`;
    });
}

export function fillPlaceholders(template: string, values: Record<string, string>) {
  return template.replace(/\{([a-z0-9_]+)\}/gi, (token, key: string) => values[key] ?? token);
}

export function wrapEmailHtml(body: string) {
  const inner = sanitizeEmailHtml(body);
  return `<!DOCTYPE html><html><body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:560px;background:#ffffff;border-radius:16px;">
<tr><td style="padding:28px 28px 8px;font-size:13px;letter-spacing:0.04em;color:#059669;font-weight:700;">BisnisLevelUp.id</td></tr>
<tr><td style="padding:8px 28px 28px;font-size:15px;line-height:1.6;color:#0f172a;">${inner}</td></tr>
</table>
<p style="font-size:12px;color:#94a3b8;margin:16px 0 0;">Email ini dikirim karena ada aktivitas di akun BisnisLevelUp.id Anda.</p>
</td></tr></table></body></html>`;
}

export function rupiah(value: string | number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
}
