import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { useState, useEffect } from 'react'
import locales from '../locales'

const languages = locales

export default function LanguageSelector() {
  const router = useRouter()
  const { t } = useTranslation('common')
  const [isOpen, setIsOpen] = useState(false)
  const { pathname, asPath, query, locale } = router
  
  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]
  
  // Set document direction based on language
  useEffect(() => {
    if (currentLanguage.dir === 'rtl') {
      document.documentElement.dir = 'rtl'
      document.documentElement.lang = currentLanguage.code
      document.body.classList.add('rtl')
    } else {
      document.documentElement.dir = 'ltr'
      document.documentElement.lang = currentLanguage.code
      document.body.classList.remove('rtl')
    }
  }, [currentLanguage])

  const changeLanguage = (newLocale: string) => {
    // For static exports, we need to handle locale change differently
    const currentUrl = window.location.href
    const baseUrl = window.location.origin
    const currentPath = window.location.pathname
    
    // Check if the URL already has a locale part
    const pathSegments = currentPath.split('/').filter(Boolean)
    const currentLocale = locale || 'en'
    const hasLocaleSegment = pathSegments.length > 0 && ['en', 'fr', 'zh', 'ar'].includes(pathSegments[0])
    
    // Calculate the path without the locale segment if it exists
    let pathWithoutLocale = currentPath
    if (hasLocaleSegment) {
      pathWithoutLocale = '/' + pathSegments.slice(1).join('/')
    }
    
    // Preserve query parameters
    const queryString = window.location.search
    
    // Create the new URL with the correct locale segment
    let newUrl
    if (pathWithoutLocale === '/') {
      // Root path special case
      newUrl = `${baseUrl}/${newLocale}/`
    } else {
      // Regular path
      newUrl = `${baseUrl}/${newLocale}${pathWithoutLocale}${queryString}`
    }
    
    console.log('Language change:', { 
      from: currentLocale, 
      to: newLocale, 
      currentPath,
      pathSegments,
      hasLocaleSegment,
      pathWithoutLocale,
      newUrl
    })
    
    // Navigate to the new URL
    window.location.href = newUrl
    setIsOpen(false)
  }

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => setIsOpen(!isOpen)}
        >
          {currentLanguage.name}
          <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  locale === language.code ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                } hover:bg-gray-100 hover:text-gray-900`}
                role="menuitem"
              >
                {language.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}