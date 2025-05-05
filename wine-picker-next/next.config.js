/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for GitHub Pages
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  // Any additional webpack configs
  webpack: (config) => {
    return config;
  },
  // Only use basePath in production
  ...(process.env.NODE_ENV === 'production' ? { basePath: '/winepicker' } : {}),
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development' 
              ? '' // Disable CSP in development
              : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:;"
          }
        ],
      },
    ]
  },
}

module.exports = nextConfig 