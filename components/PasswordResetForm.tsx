import React, { useState } from 'react';
import { useAuth } from '../utils/authContext';
import { useTranslation } from 'next-i18next';

interface PasswordResetFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PasswordResetForm({ onClose, onSuccess }: PasswordResetFormProps) {
  const { t } = useTranslation('common');
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError(t('auth.emailRequired', 'Email is required'));
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      await resetPassword(email);
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Password reset error:', err);
      
      // Handle specific Firebase auth errors
      if (err.code === 'auth/user-not-found') {
        setError(t('auth.userNotFound', 'User not found. Please check your email.'));
      } else if (err.code === 'auth/invalid-email') {
        setError(t('auth.invalidEmail', 'Invalid email address.'));
      } else if (err.code === 'auth/too-many-requests') {
        setError(t('auth.tooManyRequests', 'Too many requests. Please try again later.'));
      } else {
        setError(err.message || t('auth.resetPasswordError', 'Error sending reset email'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-md shadow-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-medium">
          {t('auth.resetPassword', 'Reset Password')}
        </h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {success ? (
        <div className="text-center py-4">
          <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-green-600 mb-4">
            {t('auth.resetPasswordSent', 'Password reset email sent!')}
          </p>
          <p className="text-gray-600 text-sm">
            {t('auth.checkInbox', 'Please check your inbox and follow the instructions in the email to reset your password.')}
          </p>
          <button
            onClick={onClose}
            className="mt-4 btn btn-primary"
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="reset-email">
                {t('auth.email', 'Email')}
              </label>
              <input
                id="reset-email"
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('auth.resetPasswordInstructions', 'Enter the email address associated with your account to receive a password reset link.')}
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                className="flex-1 btn btn-secondary"
                onClick={onClose}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  t('auth.sendResetLink', 'Send Reset Link')
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}