import type { NextConfig } from "next";

const isStatic = process.env.STATIC_EXPORT === "true";
const basePath = process.env.BASE_PATH || "";

const nextConfig: NextConfig = {
  output: isStatic ? "export" : undefined,
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
