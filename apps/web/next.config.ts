import type { NextConfig } from "next";

const staticExport = process.env.STATIC_EXPORT === "true";
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  transpilePackages: ["@hirnao/shared"],
  ...(staticExport
    ? {
        output: "export",
        basePath,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        async rewrites() {
          const apiUrl = process.env.API_URL ?? "http://localhost:3001";
          return [
            {
              source: "/api/:path*",
              destination: `${apiUrl}/:path*`,
            },
          ];
        },
      }),
};

export default nextConfig;
