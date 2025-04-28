import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

// Import the main navigator
import MainNavigator from './native/navigation/MainNavigator';

// Firebase setup and context providers
import { AuthProvider } from '../utils/authContext';

/**
 * NativeApp serves as the entry point for the React Native version of the app
 * It sets up navigation, authentication, and other global providers
 */
const NativeApp: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default NativeApp;
