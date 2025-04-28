import { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import { useAuth } from '../utils/authContext';
import SignUpForm from '../components/SignUpForm';
import type { GetStaticProps } from 'next';

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
};

export default function SignUpPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { currentUser } = useAuth();
  const [isSignedUp, setIsSignedUp] = useState(false);

  // If user is already signed in, redirect to home
  if (currentUser) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="py-6 px-4 md:px-8 bg-surface shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-display font-bold text-primary">
            {t('appName', 'PickMyWine')}
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface rounded-xl shadow-lg p-6 md:p-8">
          {isSignedUp ? (
            <div className="text-center py-8">
              <svg className="w-20 h-20 text-green-500 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-display font-semibold text-text-primary mb-4">
                {t('auth.accountCreated', 'Account created successfully!')}
              </h2>
              <p className="text-text-secondary mb-6">
                {t('auth.redirectingToLogin', 'You can now sign in with your new account')}
              </p>
              <Link href="/" className="btn btn-primary">
                {t('common.continue', 'Continue')}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-display font-semibold text-text-primary mb-6">
                {t('auth.createAccount', 'Create Account')}
              </h1>
              
              <SignUpForm 
                onSignUp={() => {
                  setIsSignedUp(true);
                  setTimeout(() => {
                    router.push('/');
                  }, 3000);
                }}
                onCancel={() => router.push('/')}
              />
              
              <div className="mt-8 text-center text-text-secondary text-sm">
                <span>{t('auth.alreadyHaveAccount', 'Already have an account?')}</span>{' '}
                <Link href="/" className="text-primary hover:underline">
                  {t('auth.signIn', 'Sign In')}
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 md:px-8 bg-surface border-t border-border">
        <div className="container mx-auto text-center text-text-secondary text-sm">
          &copy; {new Date().getFullYear()} {t('appName', 'PickMyWine')}. {t('footer.allRightsReserved', 'All rights reserved')}.
        </div>
      </footer>
    </div>
  );
}