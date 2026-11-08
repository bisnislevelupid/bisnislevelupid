import { z } from "zod";

const SAPAAN = /^[\p{L}][\p{L}'’. -]{1,79}$/u;

export const namaSapaanSchema = z
  .string()
  .trim()
  .max(80)
  .refine((value) => value === "" || SAPAAN.test(value), "Nama sapaan 2–80 huruf, contoh Pak Irvan");

export function storedSapaan(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}
