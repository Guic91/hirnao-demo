import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@hirnao/shared"],
  async rewrites() {
    const apiUrl = process.env.API_URL ?? "http://localhost:3001";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
