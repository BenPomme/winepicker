/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  webpack: (config, { dev, isServer }) => {
    // Add any webpack configurations here if needed
    return config
  },
  output: 'export',
  basePath: '/winepicker',
  images: {
    unoptimized: true,
  },
  // Disable server-side features since we're using static export
  experimental: {
    appDir: false,
  },
}

module.exports = nextConfig 