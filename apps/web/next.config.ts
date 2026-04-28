import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for self-hosted Docker container deployment
  output: "standalone",

  // Strip X-Powered-By header
  poweredByHeader: false,

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
