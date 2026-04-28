import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Strip X-Powered-By header
  poweredByHeader: false,

  outputFileTracingRoot: path.join(appDir, "../.."),

  // Vercel build should not be blocked by local ESLint option drift.
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Security headers applied on every response
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  // Transpile workspace packages
  transpilePackages: ['@gujarati-global/types', '@gujarati-global/validators'],

  // Image optimization — add Azure CDN as an allowed remote pattern when Front Door is wired
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.blob.core.windows.net",
      },
    ],
  },
};

export default nextConfig;
