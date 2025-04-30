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