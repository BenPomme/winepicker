#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting manual deployment of language fix to Firebase Production${NC}"

# Make sure we're in the project directory
cd "$(dirname "$0")"

# Set up Firebase project
echo -e "${YELLOW}Setting up Firebase project for production...${NC}"
firebase use winepicker-63daa

# Create a temporary directory for the files we need to deploy
echo -e "${YELLOW}Creating temporary deployment directory...${NC}"
mkdir -p temp_deploy/out
mkdir -p temp_deploy/public

# Copy the fixed manifest.json
echo -e "${YELLOW}Copying fixed manifest.json...${NC}"
cp public/manifest.json temp_deploy/public/

# Create the fix scripts in the temp_deploy
echo -e "${YELLOW}Creating fix-locale.js...${NC}"
cat > temp_deploy/public/fix-locale.js << 'EOL'
/**
 * Script to properly set the locale based on the URL path
 */
document.addEventListener('DOMContentLoaded', function() {
  // Extract locale from URL path
  const path = window.location.pathname;
  const pathSegments = path.split('/').filter(Boolean);
  
  // Determine the locale from the first path segment
  let locale = 'en'; // Default
  if (pathSegments.length > 0) {
    const firstSegment = pathSegments[0];
    if (['en', 'fr', 'zh', 'ar'].includes(firstSegment)) {
      locale = firstSegment;
    }
  }
  
  console.log('Setting locale to:', locale);
  
  // Find the __NEXT_DATA__ script tag that contains the app configuration
  const nextDataScript = document.getElementById('__NEXT_DATA__');
  if (nextDataScript) {
    try {
      // Parse the data
      const nextData = JSON.parse(nextDataScript.textContent);
      
      // Check if we have the i18n configuration
      if (nextData.props && nextData.props.pageProps && nextData.props.pageProps._nextI18Next) {
        // Update the locale
        nextData.props.pageProps._nextI18Next.initialLocale = locale;
        
        // Also update the router locale if it exists
        if (nextData.props.pageProps.router) {
          nextData.props.pageProps.router.locale = locale;
        }
        
        // If there's an initialI18nStore, make sure the locale exists in it
        if (nextData.props.pageProps._nextI18Next.initialI18nStore) {
          // If the target locale doesn't exist, copy from English
          if (!nextData.props.pageProps._nextI18Next.initialI18nStore[locale] && 
              nextData.props.pageProps._nextI18Next.initialI18nStore['en']) {
            nextData.props.pageProps._nextI18Next.initialI18nStore[locale] = 
              nextData.props.pageProps._nextI18Next.initialI18nStore['en'];
          }
        }
        
        // Write back the updated data
        nextDataScript.textContent = JSON.stringify(nextData);
        console.log('Updated initialLocale in __NEXT_DATA__');
        
        // Force reload to apply changes if the URL doesn't match the locale
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        if (pathSegments[0] !== locale) {
          console.log(`URL doesn't match locale, forcing navigation to /${locale}/`);
          window.location.href = `/${locale}/`;
        }
      }
    } catch (error) {
      console.error('Error updating locale in __NEXT_DATA__:', error);
    }
  }
  
  // Handle RTL for Arabic
  if (locale === 'ar') {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
    document.body.classList.add('rtl');
  } else {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = locale;
    document.body.classList.remove('rtl');
  }
  
  // Create language selector
  const selector = document.createElement('div');
  selector.className = 'fixed top-4 right-4 z-50 bg-white rounded-md shadow-md p-2';
  selector.style.minWidth = '120px';
  
  // Language options
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'zh', name: '中文' },
    { code: 'ar', name: 'العربية' }
  ];
  
  // Create buttons for each language
  languages.forEach(lang => {
    const btn = document.createElement('button');
    btn.className = 'block w-full text-left px-4 py-2 text-sm rounded hover:bg-gray-100';
    
    if (lang.code === locale) {
      btn.className += ' bg-blue-100 font-bold';
    }
    
    btn.innerText = lang.name;
    
    btn.addEventListener('click', function() {
      if (lang.code !== locale) {
        // Force a full page reload with the new locale
        const currentPath = window.location.pathname;
        // Remove existing language prefix if present
        let pathWithoutLang = currentPath;
        
        // Check if there's a language code at the start of the path
        const langRegex = /^\/(en|fr|zh|ar)\//;
        if (langRegex.test(currentPath)) {
          pathWithoutLang = currentPath.replace(langRegex, '/');
        }
        
        // Ensure path starts with slash
        if (!pathWithoutLang.startsWith('/')) {
          pathWithoutLang = '/' + pathWithoutLang;
        }
        
        // Create new path with selected language
        const newPath = `/${lang.code}${pathWithoutLang === '/' ? '/' : pathWithoutLang}`;
        
        console.log(`Language selector clicked: navigating from ${locale} to ${lang.code}, path: ${newPath}`);
        
        // Use window.location.replace for a clean reload without history entry
        window.location.replace(newPath);
      }
    });
    
    selector.appendChild(btn);
  });
  
  // Add to body
  document.body.appendChild(selector);
  
  // Fetch and apply translations
  fetchTranslations(locale);
});

// Function to fetch translations
function fetchTranslations(locale) {
  fetch(`/locales/${locale}/common.json`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return response.json();
    })
    .then(translations => {
      console.log(`Loaded translations for ${locale}`);
      window.translations = translations;
      
      // Apply translations to key elements
      applyTranslations(translations);
    })
    .catch(error => {
      console.error('Error loading translations:', error);
    });
}

// Apply translations to key elements
function applyTranslations(translations) {
  if (!translations) return;
  
  // Apply page title
  if (translations.appName) {
    document.title = translations.appName;
  }
  
  // Apply to elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const parts = key.split('.');
    
    let value = translations;
    for (const part of parts) {
      if (value && value[part]) {
        value = value[part];
      } else {
        value = null;
        break;
      }
    }
    
    if (value && typeof value === 'string') {
      el.textContent = value;
    }
  });
}
EOL

echo -e "${YELLOW}Creating force-reload.js...${NC}"
cat > temp_deploy/public/force-reload.js << 'EOL'
/**
 * Script to force a complete page reload when changing languages
 * This is a more aggressive approach to ensure language changes work
 */
(function() {
  // Wait for the page to fully load
  window.addEventListener('load', function() {
    console.log('Force reload script initialized');
    
    // Check if we have a language in URL
    const path = window.location.pathname;
    const pathSegments = path.split('/').filter(Boolean);
    
    // Determine the locale from the first path segment
    let currentLocale = 'en'; // Default
    if (pathSegments.length > 0) {
      const firstSegment = pathSegments[0];
      if (['en', 'fr', 'zh', 'ar'].includes(firstSegment)) {
        currentLocale = firstSegment;
      }
    }
    
    // Get all language selector links in the document
    const languageLinks = document.querySelectorAll('button, a');
    languageLinks.forEach(link => {
      // Look for language selectors by analyzing text content
      const languages = {
        'English': 'en',
        'Français': 'fr',
        '中文': 'zh',
        'العربية': 'ar',
        'EN': 'en',
        'FR': 'fr',
        'ZH': 'zh',
        'AR': 'ar'
      };
      
      // Check if this element contains a language name
      Object.entries(languages).forEach(([name, code]) => {
        if (link.textContent.includes(name) || link.textContent === name) {
          // This looks like a language selector, override its click behavior
          link.addEventListener('click', function(e) {
            if (code !== currentLocale) {
              console.log(`Language link clicked: ${name} (${code})`);
              e.preventDefault();
              e.stopPropagation();
              
              // Force full page reload with the new locale
              const currentPath = window.location.pathname;
              
              // Remove existing language prefix if present
              let pathWithoutLang = currentPath;
              const langRegex = /^\/(en|fr|zh|ar)\//;
              
              if (langRegex.test(currentPath)) {
                pathWithoutLang = currentPath.replace(langRegex, '/');
              }
              
              // Ensure path starts with slash
              if (!pathWithoutLang.startsWith('/')) {
                pathWithoutLang = '/' + pathWithoutLang;
              }
              
              // Create new path with selected language
              const newPath = `/${code}${pathWithoutLang === '/' ? '/' : pathWithoutLang}`;
              console.log(`Force navigating to: ${newPath}`);
              
              // Use replace for a clean navigation
              window.location.replace(newPath);
              return false;
            }
          }, true); // Use capture to ensure we get the event first
        }
      });
    });
    
    // Also check for language data attributes
    document.querySelectorAll('[data-locale], [data-language]').forEach(element => {
      const locale = element.getAttribute('data-locale') || element.getAttribute('data-language');
      if (locale && ['en', 'fr', 'zh', 'ar'].includes(locale)) {
        element.addEventListener('click', function(e) {
          if (locale !== currentLocale) {
            console.log(`Language element clicked with data attribute: ${locale}`);
            e.preventDefault();
            e.stopPropagation();
            
            // Create new path with selected language
            const currentPath = window.location.pathname;
            let pathWithoutLang = currentPath;
            const langRegex = /^\/(en|fr|zh|ar)\//;
            
            if (langRegex.test(currentPath)) {
              pathWithoutLang = currentPath.replace(langRegex, '/');
            }
            
            const newPath = `/${locale}${pathWithoutLang === '/' ? '/' : pathWithoutLang}`;
            console.log(`Force navigating to: ${newPath}`);
            
            window.location.replace(newPath);
            return false;
          }
        }, true);
      }
    });
  });
})();
EOL

echo -e "${YELLOW}Creating early-load.js...${NC}"
cat > temp_deploy/public/early-load.js << 'EOL'
// Execute before DOMContentLoaded
(function() {
  // Detect locale based on path
  function detectLocale() {
    const path = window.location.pathname;
    const pathSegments = path.split('/').filter(Boolean);
    const validLocales = ['en', 'fr', 'zh', 'ar'];
    
    // If first path segment is a valid locale, use it
    if (pathSegments.length > 0 && validLocales.includes(pathSegments[0])) {
      return pathSegments[0];
    }
    
    // Default to English
    return 'en';
  }

  // Update the __NEXT_DATA__ script with the correct locale
  function updateNextData(locale) {
    const nextDataScript = document.getElementById('__NEXT_DATA__');
    if (!nextDataScript) return;
    
    try {
      const data = JSON.parse(nextDataScript.textContent);
      
      // Update locale in all necessary places
      if (data.props?.pageProps?._nextI18Next) {
        data.props.pageProps._nextI18Next.initialLocale = locale;
      }
      
      nextDataScript.textContent = JSON.stringify(data);
      console.log(`Updated __NEXT_DATA__ with locale: ${locale}`);
    } catch (error) {
      console.error('Error updating __NEXT_DATA__:', error);
    }
  }

  // Set direction for RTL languages
  function setDirection(locale) {
    if (locale === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
      document.body && document.body.classList.add('rtl');
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = locale;
      document.body && document.body.classList.remove('rtl');
    }
  }

  // Detect and set locale before page renders
  const detectedLocale = detectLocale();
  updateNextData(detectedLocale);
  setDirection(detectedLocale);

  // Redirect to locale path if not already there
  if (window.location.pathname === '/' || window.location.pathname === '') {
    window.location.replace(`/${detectedLocale}/`);
  }
})();
EOL

# Create firebase.json with updated configuration
echo -e "${YELLOW}Creating updated firebase.json...${NC}"
cat > temp_deploy/firebase.json << 'EOL'
{
  "hosting": [
    {
      "target": "default",
      "public": "out",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "cleanUrls": false,
      "trailingSlash": true,
      "headers": [
        {
          "source": "**/*.@(json)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=0, must-revalidate"
            }
          ]
        }
      ],
      "rewrites": [
        {
          "source": "/api/analyze-wine",
          "function": "nextApiHandler"
        },
        {
          "source": "/api/analyze-wine-openai",
          "function": "nextApiHandler"
        },
        {
          "source": "/api/get-analysis-result",
          "function": "nextApiHandler"
        },
        {
          "source": "/api/**",
          "function": "nextApiHandler"
        }
      ],
      "redirects": [
        {
          "source": "/",
          "destination": "/en/",
          "type": 302
        },
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
      ]
    },
    {
      "target": "production",
      "public": "out",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "cleanUrls": false,
      "trailingSlash": true,
      "headers": [
        {
          "source": "**/*.@(json)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=0, must-revalidate"
            }
          ]
        }
      ],
      "rewrites": [
        {
          "source": "/api/analyze-wine",
          "function": "nextApiHandler"
        },
        {
          "source": "/api/analyze-wine-openai",
          "function": "nextApiHandler"
        },
        {
          "source": "/api/get-analysis-result",
          "function": "nextApiHandler"
        },
        {
          "source": "/api/**",
          "function": "nextApiHandler"
        }
      ],
      "redirects": [
        {
          "source": "/",
          "destination": "/en/",
          "type": 302
        },
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
      ]
    }
  ],
  "storage": {
    "rules": "storage.rules"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
EOL

# Copy our files to Firebase public directory
echo -e "${YELLOW}Copying files to public directory...${NC}"
mkdir -p out # Ensure out directory exists
cp temp_deploy/public/fix-locale.js out/
cp temp_deploy/public/force-reload.js out/
cp temp_deploy/public/early-load.js out/
cp temp_deploy/public/manifest.json public/

# Update the firebase.json file
echo -e "${YELLOW}Updating firebase.json...${NC}"
cp temp_deploy/firebase.json ./

# Deploy to Firebase hosting
echo -e "${YELLOW}Deploying to Firebase production hosting...${NC}"
firebase deploy --only hosting:production

echo -e "${GREEN}Manual deployment completed.${NC}"
echo -e "${YELLOW}The language selector fix has been deployed to production.${NC}"
echo -e "${YELLOW}Test languages by visiting:${NC}"
echo -e "${GREEN}https://pickmywine-live.web.app/${NC}"
echo -e "${GREEN}https://pickmywine-live.web.app/en/${NC}"
echo -e "${GREEN}https://pickmywine-live.web.app/fr/${NC}"
echo -e "${GREEN}https://pickmywine-live.web.app/zh/${NC}"
echo -e "${GREEN}https://pickmywine-live.web.app/ar/${NC}"

# Clean up
echo -e "${YELLOW}Cleaning up temporary files...${NC}"
rm -rf temp_deploy