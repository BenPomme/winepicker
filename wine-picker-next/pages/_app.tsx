import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { Inter } from 'next/font/google'
import { appWithTranslation } from 'next-i18next'

const inter = Inter({ subsets: ['latin'] })

function App({ Component, pageProps }: AppProps) {
  return (
    <main className={`${inter.className} min-h-screen flex flex-col`}>
      <Component {...pageProps} />
    </main>
  )
}

export default appWithTranslation(App) 