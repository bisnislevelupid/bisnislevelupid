/** Path internal untuk ?next=. Menolak URL absolut, protokol, dan open redirect. */
export function internalNextPath(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) return null;
  if (trimmed.includes("\\") || trimmed.includes("\0") || trimmed.includes("@")) return null;
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
  if (decoded.includes("://") || decoded.includes("\\") || decoded.includes("@")) return null;
  return trimmed;
}
