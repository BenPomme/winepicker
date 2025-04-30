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