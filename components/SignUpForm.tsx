import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useAuth } from '../utils/authContext';

interface SignUpFormProps {
  onSignUp?: () => void;
  onCancel: () => void;
}

export default function SignUpForm({ onSignUp, onCancel }: SignUpFormProps) {
  const { t } = useTranslation('common');
  const { signUpWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate form fields
    if (!displayName.trim()) {
      setError(t('auth.displayNameRequired', 'Display name is required'));
      setIsLoading(false);
      return;
    }

    if (!email.trim()) {
      setError(t('auth.emailRequired', 'Email is required'));
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordTooShort', 'Password must be at least 6 characters'));
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordsMustMatch', 'Passwords must match'));
      setIsLoading(false);
      return;
    }

    try {
      await signUpWithEmail(email, password, displayName);
      if (onSignUp) onSignUp();
    } catch (err: any) {
      console.error('Signup error:', err);
      
      // Handle specific Firebase auth errors
      if (err.code === 'auth/email-already-in-use') {
        setError(t('auth.emailInUse', 'Email already in use. Please sign in instead.'));
      } else if (err.code === 'auth/invalid-email') {
        setError(t('auth.invalidEmail', 'Invalid email address.'));
      } else if (err.code === 'auth/weak-password') {
        setError(t('auth.weakPassword', 'Password is too weak. Please use a stronger password.'));
      } else if (err.code === 'auth/network-request-failed') {
        setError(t('auth.networkError', 'Network error. Please check your internet connection.'));
      } else {
        setError(err.message || t('auth.signUpError', 'Error creating account'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-md shadow-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-medium">
          {t('auth.createAccount', 'Create Account')}
        </h2>
        <button 
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1" htmlFor="displayName">
            {t('auth.displayName', 'Display Name')}
          </label>
          <input
            id="displayName"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1" htmlFor="email">
            {t('auth.email', 'Email')}
          </label>
          <input
            id="email"
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1" htmlFor="password">
            {t('auth.password', 'Password')}
          </label>
          <input
            id="password"
            type="password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            autoComplete="new-password"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {t('auth.passwordTooShort', 'Password must be at least 6 characters')}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">
            {t('auth.confirmPassword', 'Confirm Password')}
          </label>
          <input
            id="confirmPassword"
            type="password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            className="flex-1 btn btn-secondary"
            onClick={onCancel}
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
              t('auth.signUp', 'Sign Up')
            )}
          </button>
        </div>
      </form>
    </div>
  );
}