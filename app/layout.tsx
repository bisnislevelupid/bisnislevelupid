import type { Metadata } from "next";
import { Albert_Sans, Cabin } from "next/font/google";
import "./globals.css";
import { getSiteSettings } from "@/lib/db/public";

const heading = Albert_Sans({ subsets: ["latin"], variable: "--font-heading" });
const body = Cabin({ subsets: ["latin"], variable: "--font-body" });

export async function generateMetadata(): Promise<Metadata> {
  let settings: Record<string, string> = {};
  try {
    settings = await getSiteSettings();
  } catch {
    settings = {};
  }
  const title = settings.site_title || "BisnisLevelUp.id";
  const description =
    settings.site_description ||
    "Audit fase bisnis untuk pengusaha Indonesia.";
  return {
    title,
    description,
    icons: settings.favicon_url ? { icon: settings.favicon_url } : undefined,
    openGraph: {
      title: settings.og_title || title,
      description: settings.og_description || description,
      images: settings.og_image_url ? [settings.og_image_url] : undefined,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${heading.variable} ${body.variable} h-full`}>
      <body className="min-h-full bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
