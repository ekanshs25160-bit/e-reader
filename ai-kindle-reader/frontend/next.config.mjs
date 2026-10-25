/** @type {import('next').NextConfig} */
const createNextConfig = (phase) => ({
  distDir: phase === 'phase-development-server' ? '.next' : '.next-build',
  reactStrictMode: false, // Recommended false when using epub.js to prevent double-render canvas issues
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['localforage'],
    proxyTimeout: 120000, // Allow 120s for Render Free-tier backend cold starts & AI streams
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
  async rewrites() {
    const rawBackend = (
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://e-reader-backend-46oy.onrender.com"
    )
      .trim()
      .replace(/\/api\/?$/, "")
      .replace(/\/+$/, "");

    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: "/api/:path*",
          destination: `${rawBackend}/api/:path*`,
        },
        {
          source: "/health",
          destination: `${rawBackend}/health`,
        },
      ],
    };
  },
});

export default createNextConfig;
