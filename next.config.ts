import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Build zamanı lint yoxlamasını söndür
    ignoreDuringBuilds: true,
  },
  /* digər konfiqurasiya opsiyaları buraya */
};

export default nextConfig;
