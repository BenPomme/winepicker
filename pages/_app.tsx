import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { appWithTranslation } from 'next-i18next'
import { AuthProvider } from '../utils/authContext'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import InstallPWA from '../components/InstallPWA'
import dynamic from 'next/dynamic'

// Only load ResourceWarning in development mode
const ResourceWarning = process.env.NODE_ENV === 'development' 
  ? dynamic(() => import('../components/ResourceWarning'), { ssr: false }) 
  : () => null

function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <meta name="application-name" content="MyWine App" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MyWine App" />
        <meta name="description" content="Your personal wine companion" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#5a2327" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#5a2327" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/app-icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/app-icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/app-icon-192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/app-icon-192.png" />
      </Head>
      <main className="min-h-screen flex flex-col">
        <Component {...pageProps} />
        <InstallPWA />
        {process.env.NODE_ENV === 'development' && (
          <ResourceWarning resourceType="icon" />
        )}
      </main>
    </AuthProvider>
  )
}

export default appWithTranslation(App)