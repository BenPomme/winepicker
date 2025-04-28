import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import { useAuth } from '../utils/authContext';
import PasswordResetForm from '../components/PasswordResetForm';
import type { GetStaticProps } from 'next';

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
};

export default function ResetPasswordPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { currentUser } = useAuth();

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
          <h1 className="text-2xl font-display font-semibold text-text-primary mb-6">
            {t('auth.resetPassword', 'Reset Password')}
          </h1>
          
          <PasswordResetForm 
            onSuccess={() => {
              setTimeout(() => {
                router.push('/');
              }, 3000);
            }}
            onClose={() => router.push('/')}
          />
          
          <div className="mt-8 text-center text-text-secondary text-sm">
            <Link href="/" className="text-primary hover:underline">
              {t('auth.backToSignIn', 'Back to Sign In')}
            </Link>
          </div>
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