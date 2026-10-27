const CANONICAL_HOST = "www.bisnislevelup.id";
const FALLBACK = `https://${CANONICAL_HOST}`;

function httpsOrigin(value: string | undefined) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:") return "";
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host.endsWith(".local")) return "";
    if (host === "bisnislevelup.id" || host === CANONICAL_HOST) return FALLBACK;
    return url.origin;
  } catch {
    return "";
  }
}

/** Satu base URL untuk tautan email, WA, dan halaman. Bukan origin request atau localhost. */
export function siteUrl() {
  return httpsOrigin(process.env.NEXT_PUBLIC_SITE_URL) || httpsOrigin(process.env.NEXT_PUBLIC_APP_URL) || FALLBACK;
}

export function publicSiteUrl() {
  return siteUrl();
}
