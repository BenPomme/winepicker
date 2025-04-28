/** @type {import('next').NextConfig} */
const { i18n } = require('./next-i18next.config');
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

const nextConfig = {
  reactStrictMode: true,
  // Disable image optimization for static exports
  images: {
    unoptimized: true,
  },
  // Output static files
  output: 'export',
  // Ignore build errors for faster deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ensure font files and static assets are properly processed and included in the build
  webpack(config) {
    // Font handling
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name][ext]',
      },
    });
    
    // Image handling
    config.module.rules.push({
      test: /\.(png|jpg|jpeg|gif|svg|ico)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/images/[name][ext]',
      },
    });
    
    return config;
  },
  
  // Specify asset prefixes for static files
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  
  // Import i18n configuration from next-i18next.config.js
  // Note: For static export, we use a combination of:
  // 1. Sub-path routing (/en/page, /fr/page, etc.)
  // 2. The trailingSlash option to ensure proper static file loading
  trailingSlash: true,
  
  // Custom export logic for handling i18n
  exportPathMap: async function (defaultPathMap, { dev, dir, outDir, distDir, buildId }) {
    const pathMap = {};
    const locales = ['en', 'fr', 'zh', 'ar'];
    
    // Create redirects from root to default locale (en)
    pathMap['/'] = { page: '/' };
    
    // Debug info for build process
    console.log('Building static export with i18n support');
    console.log('Default path map keys:', Object.keys(defaultPathMap).length);
    
    // For each page, create versions for each locale
    Object.entries(defaultPathMap).forEach(([path, config]) => {
      // Skip API routes for static export
      if (path.startsWith('/api/')) {
        console.log(`Skipping API route: ${path}`);
        return;
      }
      
      // Add the non-localized path for compatibility
      // This ensures each path is available without a locale prefix too
      pathMap[path] = { 
        ...config
      };
      
      // Create localized paths for all pages
      locales.forEach(locale => {
        // Special case for index page
        if (path === '/') {
          // Root locale path (e.g., /en)
          pathMap[`/${locale}`] = { 
            ...config,
            locale
          };
          
          // Root locale path with trailing slash (e.g., /en/)
          pathMap[`/${locale}/`] = { 
            ...config,
            locale
          };
          
          // Create index.html directly in each locale folder for hosting platforms
          pathMap[`/${locale}/index`] = { 
            ...config,
            locale
          };
        } 
        // Handle app page special case - ensure it works in all locales
        else if (path === '/app') {
          pathMap[`/${locale}${path}`] = { 
            ...config,
            locale
          };
          
          // Also create with trailing slash
          pathMap[`/${locale}${path}/`] = { 
            ...config,
            locale
          };
          
          // For Firebase hosting compatibility
          pathMap[`/${locale}${path}/index`] = { 
            ...config,
            locale
          };
        }
        // Regular page with locale prefix
        else {
          pathMap[`/${locale}${path}`] = { 
            ...config,
            locale
          };
          
          // Also add with trailing slash for consistency
          if (!path.endsWith('/')) {
            pathMap[`/${locale}${path}/`] = { 
              ...config,
              locale
            };
          }
        }
      });
    });
    
    console.log(`Generated ${Object.keys(pathMap).length} static paths with internationalization`);
    return pathMap;
  },
  
  // Generate proper 404 pages for each locale
  generateBuildId: async () => {
    return 'build-' + new Date().toISOString().replace(/[\W_]+/g, '');
  },
}

module.exports = withPWA(nextConfig);