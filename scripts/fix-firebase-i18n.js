/**
 * Fix for Firebase i18n redirect issues
 */
const fs = require('fs');
const path = require('path');

// Firebase config path
const firebaseConfigPath = path.join(__dirname, '../firebase.json');

function fixFirebaseConfig() {
  console.log('Fixing Firebase hosting configuration for i18n...');
  
  if (!fs.existsSync(firebaseConfigPath)) {
    console.error('❌ firebase.json not found!');
    return;
  }
  
  try {
    // Read current config
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    
    // Update hosting config to handle i18n routes properly
    if (config.hosting) {
      // If hosting is an array, update all sites
      if (Array.isArray(config.hosting)) {
        config.hosting.forEach(site => {
          updateSiteConfig(site);
        });
      } else {
        // Single site config
        updateSiteConfig(config.hosting);
      }
      
      // Write updated config
      fs.writeFileSync(firebaseConfigPath, JSON.stringify(config, null, 2));
      console.log('✅ Firebase config updated successfully');
    } else {
      console.error('❌ No hosting configuration found in firebase.json');
    }
  } catch (error) {
    console.error('❌ Error updating Firebase config:', error);
  }
}

function updateSiteConfig(siteConfig) {
  // Ensure rewrites array exists
  if (!siteConfig.rewrites) {
    siteConfig.rewrites = [];
  }
  
  // Remove any existing language-related rewrites
  siteConfig.rewrites = siteConfig.rewrites.filter(rewrite => 
    !(rewrite.source && (
      rewrite.source.includes('/en/') || 
      rewrite.source.includes('/fr/') || 
      rewrite.source.includes('/zh/') || 
      rewrite.source.includes('/ar/')
    ))
  );
  
  // Add rewrites for all locales
  const locales = ['en', 'fr', 'zh', 'ar'];
  
  locales.forEach(locale => {
    // Add rewrite for the locale root
    siteConfig.rewrites.push({
      source: `/${locale}`,
      destination: `/${locale}/index.html`
    });
    
    // Add rewrite for the locale root with trailing slash
    siteConfig.rewrites.push({
      source: `/${locale}/`,
      destination: `/${locale}/index.html`
    });
    
    // Add dynamic path handling within each locale
    siteConfig.rewrites.push({
      source: `/${locale}/**`,
      destination: `/${locale}/index.html`
    });
  });
  
  // Add redirect from root to default locale (en)
  if (!siteConfig.redirects) {
    siteConfig.redirects = [];
  }
  
  // Remove any existing root redirects
  siteConfig.redirects = siteConfig.redirects.filter(redirect => 
    redirect.source !== '/'
  );
  
  // Add new root redirect
  siteConfig.redirects.push({
    source: '/',
    destination: '/en/',
    type: 301
  });
  
  console.log('✅ Site config updated with i18n rewrites and redirects');
}

// Execute the fix
fixFirebaseConfig();