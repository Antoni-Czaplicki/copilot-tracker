import type { NextConfig } from "next";

import { healthCacheHeaders } from "./src/lib/healthResponse";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost"],
  // Next expects this hook to be promise-returning even though these headers are static.
  // eslint-disable-next-line @typescript-eslint/require-await
  async headers() {
    return [
      {
        headers: Object.entries(healthCacheHeaders).map(([key, value]) => ({
          key,
          value,
        })),
        source: "/api/health",
      },
    ];
  },
};

export default nextConfig;
