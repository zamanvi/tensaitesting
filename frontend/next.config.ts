import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-f01f8a3511524b808cb8116aa5d495aa.r2.dev',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
