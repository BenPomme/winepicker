import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../utils/authContext';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import ProfileSettingsModal from './ProfileSettingsModal';

export default function UserProfileDropdown() {
  const { t } = useTranslation('common');
  const { currentUser, userProfile, signOut, updateUserProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle profile edit - open the settings modal
  const handleEditProfile = () => {
    setIsOpen(false);
    setIsProfileModalOpen(true);
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // If no user, don't render anything
  if (!currentUser || !userProfile) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center space-x-2 rounded-full hover:opacity-80 transition-opacity focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        {userProfile.photoURL ? (
          <img
            src={userProfile.photoURL}
            alt={userProfile.displayName || 'User'}
            className="w-8 h-8 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
            {userProfile.displayName?.charAt(0) || userProfile.email?.charAt(0) || 'U'}
          </div>
        )}
        <span className="font-medium text-text-primary hidden md:block">
          {userProfile.displayName || t('auth.user', 'User')}
        </span>
        <svg
          className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-surface border border-border z-50 animate-fade-in">
          <div className="p-3 border-b border-border">
            <p className="text-text-primary font-medium">{userProfile.displayName}</p>
            <p className="text-text-secondary text-sm truncate">{userProfile.email}</p>
          </div>
          <div className="p-2">
            <Link
              href="/my-list"
              className="flex items-center px-4 py-2 text-text-secondary hover:bg-background-alt rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              {t('myList.viewList', 'My Wine List')}
            </Link>
            <button
              className="w-full flex items-center px-4 py-2 text-text-secondary hover:bg-background-alt rounded-lg transition-colors"
              onClick={handleEditProfile}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t('profile.settings', 'Profile Settings')}
            </button>
          </div>
          <div className="p-2 border-t border-border">
            <button
              className="w-full flex items-center px-4 py-2 text-error hover:bg-error/10 rounded-lg transition-colors"
              onClick={handleSignOut}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              {t('auth.signOut', 'Sign Out')}
            </button>
          </div>
        </div>
      )}
      
      {/* Profile Settings Modal */}
      <ProfileSettingsModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
}