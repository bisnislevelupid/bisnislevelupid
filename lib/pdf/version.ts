export const CURRENT_PDF_VERSION = 2;

export function sendsNewPdf(version: number | null | undefined) {
  return (version ?? 1) >= CURRENT_PDF_VERSION;
}
