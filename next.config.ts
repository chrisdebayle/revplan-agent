import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) resolves its worker script by a real
  // node_modules path at runtime; bundling it breaks that lookup, so it
  // needs to stay a plain server-side require instead.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
