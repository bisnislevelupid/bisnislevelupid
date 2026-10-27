const FALLBACK = "https://www.bisnislevelup.id";

function httpsOrigin(value: string | undefined) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:") return "";
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host.endsWith(".local")) return "";
    return url.origin;
  } catch {
    return "";
  }
}

/** Base URL untuk tautan email. Tidak memakai origin request atau localhost. */
export function publicSiteUrl() {
  return httpsOrigin(process.env.NEXT_PUBLIC_SITE_URL) || httpsOrigin(process.env.NEXT_PUBLIC_APP_URL) || FALLBACK;
}
