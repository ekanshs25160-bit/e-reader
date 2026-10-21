/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Recommended false when using epub.js to prevent double-render canvas issues
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
};

export default nextConfig;
