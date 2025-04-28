import { useState, useEffect } from 'react';
import { useAuth, UserProfile } from '../utils/authContext';
import { useTranslation } from 'next-i18next';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Country options for profile settings
const COUNTRY_OPTIONS = [
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'FR', name: 'France', currency: 'EUR' },
  { code: 'DE', name: 'Germany', currency: 'EUR' },
  { code: 'IT', name: 'Italy', currency: 'EUR' },
  { code: 'ES', name: 'Spain', currency: 'EUR' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'JP', name: 'Japan', currency: 'JPY' },
  { code: 'CN', name: 'China', currency: 'CNY' },
];

// Language options
const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'zh', name: 'Chinese (简体中文)' },
  { code: 'ar', name: 'Arabic (العربية)' },
];

export default function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { t } = useTranslation('common');
  const { userProfile, updateUserProfile } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState('US');
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize form with user profile data when available
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setCountry(userProfile.country || 'US');
      setCurrency(userProfile.currency || 'USD');
      setLanguage(userProfile.language || 'en');
    }
  }, [userProfile]);

  // Update currency when country changes
  useEffect(() => {
    const selectedCountry = COUNTRY_OPTIONS.find(option => option.code === country);
    if (selectedCountry) {
      setCurrency(selectedCountry.currency);
    }
  }, [country]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile) return;
    
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    
    try {
      await updateUserProfile({
        ...userProfile,
        displayName,
        country,
        currency,
        language
      });
      
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveError(t('profile.errorSaving', 'Error saving profile. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="w-full max-w-lg bg-surface rounded-xl shadow-xl p-6 mx-4 animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-display font-semibold text-text-primary">
            {t('profile.settings', 'Profile Settings')}
          </h2>
          <button
            className="text-text-secondary hover:text-text-primary"
            onClick={onClose}
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-text-secondary mb-1">
                {t('profile.displayName', 'Display Name')}
              </label>
              <input
                type="text"
                id="displayName"
                className="input w-full"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-text-secondary mb-1">
                {t('profile.country', 'Country')}
                <span className="text-xs text-text-muted ml-1">
                  ({t('profile.forPricing', 'for wine pricing')})
                </span>
              </label>
              <select
                id="country"
                className="input w-full"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {COUNTRY_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency (auto-set based on country) */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-text-secondary mb-1">
                {t('profile.currency', 'Currency')}
              </label>
              <input
                type="text"
                id="currency"
                className="input w-full bg-background-alt"
                value={currency}
                disabled
              />
              <p className="text-xs text-text-muted mt-1">
                {t('profile.currencyNote', 'Currency is automatically set based on your country')}
              </p>
            </div>

            {/* Language */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-text-secondary mb-1">
                {t('profile.language', 'Language')}
              </label>
              <select
                id="language"
                className="input w-full"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error message */}
          {saveError && (
            <div className="mt-4 p-3 bg-error/10 text-error rounded-lg text-sm">
              {saveError}
            </div>
          )}

          {/* Success message */}
          {saveSuccess && (
            <div className="mt-4 p-3 bg-success/10 text-success rounded-lg text-sm">
              {t('profile.saveSuccess', 'Profile updated successfully!')}
            </div>
          )}

          {/* Form actions */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                t('common.save', 'Save')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}