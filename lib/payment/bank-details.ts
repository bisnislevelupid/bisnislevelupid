/** Nilai token instruksi bayar. Nomor dan nama hanya dari payment_methods. */
export function paymentPlaceholderValues(input: {
  accountNumber?: string | null;
  accountHolder?: string | null;
  vaNumber?: string | null;
  paymentCode?: string | null;
  nominal: string;
  methodName?: string | null;
  vaFallback?: string;
  codeFallback?: string;
}) {
  const rekening = input.accountNumber?.trim() || "";
  const atasNama = input.accountHolder?.trim() || "";
  return {
    va: input.vaNumber?.trim() || input.vaFallback || "",
    kode: input.paymentCode?.trim() || input.codeFallback || "",
    rekening: rekening || "—",
    atas_nama: atasNama || "—",
    nominal: input.nominal,
    metode: input.methodName?.trim() || "",
  };
}
