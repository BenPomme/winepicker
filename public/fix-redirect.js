/**
 * Fix for Firebase hosting redirect loops
 * This script helps resolve issues with i18n static exports
 */
(function() {
  // Get current URL
  const currentUrl = window.location.href;
  const currentPath = window.location.pathname;
  
  // Only run on root path
  if (currentPath === '/') {
    // Redirect to English version
    window.location.replace('/en/');
  }
  
  // Check for locale in URL
  const localeMatch = currentPath.match(/^\/(en|fr|zh|ar)\/$/);
  if (localeMatch) {
    // This is a valid locale path, no need to redirect
    console.log('Valid locale path detected:', localeMatch[1]);
  } else if (!currentPath.includes('/_next/') && !currentPath.includes('/static/') && !currentPath.includes('/icons/') && 
             !currentPath.includes('/locales/') && !currentPath.includes('.js') && !currentPath.includes('.json') && 
             !currentPath.includes('.css') && !currentPath.includes('.ico') && !currentPath.includes('.png') && 
             !currentPath.includes('.jpg') && currentPath !== '/sw.js' && !currentPath.includes('manifest.json')) {
    
    // Detect browser language
    const browserLang = navigator.language || navigator.userLanguage;
    let targetLocale = 'en';
    
    // Map browser language to app locales
    if (browserLang.startsWith('fr')) {
      targetLocale = 'fr';
    } else if (browserLang.startsWith('zh')) {
      targetLocale = 'zh';
    } else if (browserLang.startsWith('ar')) {
      targetLocale = 'ar';
    }
    
    // Redirect to localized page
    if (!currentPath.startsWith(`/${targetLocale}/`)) {
      // Add the locale prefix to the path
      let newPath = `/${targetLocale}${currentPath}`;
      if (!newPath.endsWith('/')) {
        newPath += '/';
      }
      console.log('Redirecting to localized path:', newPath);
      window.location.replace(newPath);
    }
  }
})();