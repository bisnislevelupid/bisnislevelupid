import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL("https://lh3.googleusercontent.com/**")],
  },
  async headers() {
    const noStore = [{ key: "Cache-Control", value: "private, no-store" }];
    return [
      { source: "/panel", headers: noStore },
      { source: "/panel/:path*", headers: noStore },
      { source: "/api/panel/:path*", headers: noStore },
    ];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
