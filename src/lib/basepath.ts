/**
 * Mirrors next.config.ts's basePath so raw root-relative asset paths
 * (plain <img src="/x">, manifest icon URLs) resolve correctly under a
 * GitHub Pages project-page subpath. next/link and next/image handle
 * this automatically; anything else referencing a /public file by a
 * literal root path must go through this helper.
 */
export const BASE_PATH = process.env.GH_PAGES_BASE_PATH ?? "";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
