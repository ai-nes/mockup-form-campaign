import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.117"],
  async rewrites() {
    return [
      {
        source: "/api/method/:path*",
        destination: `${process.env.NEXT_PUBLIC_FRAPPE_URL || "http://localhost:8000"}/api/method/:path*`,
      },
    ];
  },
};

export default nextConfig;
