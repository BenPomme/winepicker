import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import Head from 'next/head';

export default function Offline() {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>{t('offline.title') || 'MyWine - Offline'}</title>
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">
          {t('offline.heading') || 'You are offline'}
        </h1>
        <p className="mb-6">
          {t('offline.message') || 
           'The requested page is not available offline. Please reconnect to the internet.'}
        </p>
        <img 
          src="/placeholder-wine.jpg" 
          alt="Wine" 
          className="w-32 h-32 object-contain opacity-50 mb-4" 
        />
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale = 'en' }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
};