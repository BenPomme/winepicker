/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export for GitHub Pages - this is crucial
  output: 'export',
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // Use correct basePath for GitHub Pages
  basePath: process.env.NODE_ENV === 'production' ? '/mywine' : '',
  // Use trailing slashes for better compatibility with static hosting
  trailingSlash: true,
  // Any additional webpack configs
  webpack: (config) => {
    return config;
  },
}

module.exports = nextConfig 