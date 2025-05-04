/**
 * Restore proper i18n configuration for Firebase hosting
 */
const fs = require('fs');
const path = require('path');

// Firebase config path
const firebaseConfigPath = path.join(__dirname, '../firebase.json');

function fixFirebaseConfig() {
  console.log('Updating Firebase configuration for proper i18n support...');
  
  try {
    // Read current config
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    
    // Update both hosting targets
    if (Array.isArray(config.hosting)) {
      config.hosting.forEach(hostingConfig => {
        // Update rewrites for proper i18n support
        updateRewrites(hostingConfig);
        // Update redirects to handle language selection
        updateRedirects(hostingConfig);
      });
      
      // Write the updated config
      fs.writeFileSync(firebaseConfigPath, JSON.stringify(config, null, 2));
      console.log('✅ Firebase configuration updated for i18n support');
    } else {
      console.error('❌ Firebase config does not have hosting array');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error updating Firebase config:', error);
    return false;
  }
}

function updateRewrites(hostingConfig) {
  // Get API rewrites
  const apiRewrites = hostingConfig.rewrites ? 
    hostingConfig.rewrites.filter(rewrite => 
      rewrite.source && rewrite.source.includes('/api/')
    ) : [];
    
  // Create language-specific rewrites
  const i18nRewrites = [
    // English rewrites
    {
      "source": "/en",
      "destination": "/en/index.html"
    },
    {
      "source": "/en/",
      "destination": "/en/index.html"
    },
    {
      "source": "/en/**",
      "destination": "/index.html"
    },
    
    // French rewrites
    {
      "source": "/fr",
      "destination": "/fr/index.html"
    },
    {
      "source": "/fr/",
      "destination": "/fr/index.html"
    },
    {
      "source": "/fr/**",
      "destination": "/index.html"
    },
    
    // Chinese rewrites
    {
      "source": "/zh",
      "destination": "/zh/index.html"
    },
    {
      "source": "/zh/",
      "destination": "/zh/index.html"
    },
    {
      "source": "/zh/**",
      "destination": "/index.html"
    },
    
    // Arabic rewrites
    {
      "source": "/ar",
      "destination": "/ar/index.html"
    },
    {
      "source": "/ar/",
      "destination": "/ar/index.html"
    },
    {
      "source": "/ar/**",
      "destination": "/index.html"
    }
  ];
  
  // Set up the rewrites in the correct order
  hostingConfig.rewrites = [
    ...apiRewrites,          // API handlers first
    ...i18nRewrites,         // Then language-specific rewrites
    {                        // Finally, the catch-all
      "source": "**",
      "destination": "/index.html"
    }
  ];
  
  console.log(`Updated rewrites for proper i18n support (${hostingConfig.rewrites.length} total)`);
}

function updateRedirects(hostingConfig) {
  // Create redirects that support language selection
  hostingConfig.redirects = [
    // Root to user's preferred language or default English
    {
      "source": "/",
      "destination": "/index.html",
      "type": 301
    },
    
    // Language selection redirects (no trailing slash to with trailing slash)
    {
      "source": "/en",
      "destination": "/en/",
      "type": 301
    },
    {
      "source": "/fr",
      "destination": "/fr/",
      "type": 301
    },
    {
      "source": "/zh",
      "destination": "/zh/",
      "type": 301
    },
    {
      "source": "/ar",
      "destination": "/ar/",
      "type": 301
    }
  ];
  
  console.log(`Updated redirects for language selection (${hostingConfig.redirects.length} total)`);
}

// Run the function
fixFirebaseConfig();