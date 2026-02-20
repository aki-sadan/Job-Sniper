import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirnameCompat = dirname(__filename);

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirnameCompat,
};

export default nextConfig;
