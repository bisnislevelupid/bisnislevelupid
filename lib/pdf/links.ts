import { siteUrl } from "@/lib/email/site-url";

const ACCOUNT = /^\/(akun|panel)(\/|$|\?|#)/;

/** Tautan PDF selalu https://www.bisnislevelup.id. Halaman akun lewat login dengan next internal. */
export function pdfHref(pathOrUrl: string) {
  const origin = siteUrl().replace(/\/$/, "");
  if (/^https?:\/\//i.test(pathOrUrl)) {
    try {
      const url = new URL(pathOrUrl);
      if (url.hostname === "bisnislevelup.id" || url.hostname === "www.bisnislevelup.id") {
        return pdfHref(`${url.pathname}${url.search}${url.hash}`);
      }
    } catch {
      return pathOrUrl;
    }
    return pathOrUrl;
  }
  if (/^mailto:/i.test(pathOrUrl) || /^https:\/\/wa\.me\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  if (ACCOUNT.test(path)) return `${origin}/masuk?next=${encodeURIComponent(path)}`;
  return `${origin}${path}`;
}
