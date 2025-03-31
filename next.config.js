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
  basePath: process.env.NODE_ENV === 'production' ? '/winepicker' : '',
  // Use trailing slashes for better compatibility with static hosting
  trailingSlash: true,
  // Security headers - will only apply in development since static export
  async headers() {
    if (process.env.NODE_ENV !== 'development') {
      return [];
    }
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:;"
          }
        ],
      },
    ];
  },
  // Any additional webpack configs
  webpack: (config) => {
    return config;
  },
}

module.exports = nextConfig 