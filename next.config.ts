import type { NextConfig } from "next";

// Only set for the soderarak GitHub Pages project-page build (see
// .github/workflows/deploy-soderarak-pages.yml). Empty locally and for
// every other build target, so `npm run dev`/`npm run build` and the
// existing chefke1337.github.io root deploy are both unaffected.
const basePath = process.env.GH_PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
