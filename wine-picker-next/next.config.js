/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable i18n
  i18n: {
    locales: ['en', 'ru'],
    defaultLocale: 'en',
  },
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // Security headers
  async headers() {
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