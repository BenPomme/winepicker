/**
 * Fix Firebase configuration for i18n support
 */
const fs = require('fs');
const path = require('path');

// Firebase config path
const firebaseConfigPath = path.join(__dirname, '../firebase.json');

function fixFirebaseConfig() {
  console.log('Updating Firebase configuration for i18n support...');
  
  try {
    // Read current config
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    
    // Update both hosting targets
    if (Array.isArray(config.hosting)) {
      config.hosting.forEach(hostingConfig => {
        // Fix the order of rewrites
        fixRewrites(hostingConfig);
        // Add proper redirects
        fixRedirects(hostingConfig);
      });
      
      // Write the updated config
      fs.writeFileSync(firebaseConfigPath, JSON.stringify(config, null, 2));
      console.log('✅ Firebase configuration updated successfully.');
    } else {
      console.error('❌ Firebase config does not have hosting array.');
    }
  } catch (error) {
    console.error('❌ Error updating Firebase config:', error);
  }
}

function fixRewrites(hostingConfig) {
  // Get existing rewrites
  const rewrites = hostingConfig.rewrites || [];
  
  // API rewrites should come first
  const apiRewrites = rewrites.filter(rewrite => 
    rewrite.source && rewrite.source.startsWith('/api/')
  );
  
  // Locale-specific rewrites 
  const localeRewrites = rewrites.filter(rewrite =>
    rewrite.source && (
      rewrite.source.startsWith('/en') ||
      rewrite.source.startsWith('/fr') ||
      rewrite.source.startsWith('/zh') ||
      rewrite.source.startsWith('/ar')
    )
  );
  
  // Catch-all rewrite
  const catchAllRewrites = rewrites.filter(rewrite =>
    rewrite.source === '**' || rewrite.source === '/**'
  );
  
  // Other rewrites
  const otherRewrites = rewrites.filter(rewrite =>
    !apiRewrites.includes(rewrite) &&
    !localeRewrites.includes(rewrite) &&
    !catchAllRewrites.includes(rewrite)
  );
  
  // Reorder rewrites: API first, then i18n-specific, then others, catchall last
  hostingConfig.rewrites = [
    ...apiRewrites,
    ...localeRewrites,
    ...otherRewrites,
    ...catchAllRewrites
  ];
  
  console.log(`- Reordered ${hostingConfig.rewrites.length} rewrites`);
}

function fixRedirects(hostingConfig) {
  // Initialize redirects array if not present
  if (!hostingConfig.redirects) {
    hostingConfig.redirects = [];
  }
  
  // Remove existing root redirects
  hostingConfig.redirects = hostingConfig.redirects.filter(redirect =>
    redirect.source !== '/'
  );
  
  // Add root redirect to English
  hostingConfig.redirects.push({
    source: '/',
    destination: '/en/',
    type: 301
  });
  
  // Make sure we have locale redirects (without trailing slash to with trailing slash)
  const locales = ['en', 'fr', 'zh', 'ar'];
  
  // Check if we have redirects for each locale
  locales.forEach(locale => {
    const hasLocaleRedirect = hostingConfig.redirects.some(redirect => 
      redirect.source === `/${locale}` && redirect.destination === `/${locale}/`
    );
    
    if (!hasLocaleRedirect) {
      hostingConfig.redirects.push({
        source: `/${locale}`,
        destination: `/${locale}/`,
        type: 301
      });
    }
  });
  
  console.log(`- Updated redirects: ${hostingConfig.redirects.length} total`);
}

// Run the fix
fixFirebaseConfig();