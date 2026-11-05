import type { NextConfig } from "next";

// La web se publica como sitio estático en GitHub Pages.
// NEXT_PUBLIC_BASE_PATH lo fija el workflow de deploy (p. ej. "/imprent"); en local queda vacío.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
