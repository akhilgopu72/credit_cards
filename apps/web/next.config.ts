import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@cardmax/shared"],
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
