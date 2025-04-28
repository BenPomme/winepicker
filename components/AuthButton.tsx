import { useState } from 'react';
import { useAuth } from '../utils/authContext';
import { useTranslation } from 'next-i18next';

interface AuthButtonProps {
  className?: string;
}

// Simple button component for login/logout
export default function AuthButton({ className }: AuthButtonProps) {
  const { t } = useTranslation('common');
  const { currentUser, signInWithGoogle, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    setIsLoading(true);
    try {
      if (currentUser) {
        await signOut();
      } else {
        await signInWithGoogle();
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleAuth}
      disabled={isLoading}
      className={`btn btn-sm ${
        currentUser ? 'btn-secondary' : 'btn-primary'
      } transition-all ${className || ''}`}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      ) : currentUser ? (
        <>
          <svg className="w-4 h-4 mr-1" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          {t('auth.signOut', 'Sign Out')}
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-1" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
          {t('auth.signIn', 'Sign In')}
        </>
      )}
    </button>
  );
}