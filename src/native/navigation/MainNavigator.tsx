import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import WineDetailScreen from '../screens/WineDetailScreen';
import MyListScreen from '../screens/MyListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AuthScreen from '../screens/AuthScreen';

// Import auth context
import { useAuth } from '../../../utils/authContext';

// Create navigator
const Stack = createStackNavigator();

/**
 * MainNavigator handles the primary navigation flow of the app
 * It includes conditional rendering based on authentication state
 */
const MainNavigator: React.FC = () => {
  const { currentUser } = useAuth();
  const isAuthenticated = !!currentUser;

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#8A2BE2',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'MyWine' }} 
      />
      
      <Stack.Screen 
        name="WineDetail" 
        component={WineDetailScreen} 
        options={({ route }: any) => ({ 
          title: route.params?.wine?.name || 'Wine Details' 
        })} 
      />
      
      {/* Screens that require authentication */}
      {isAuthenticated ? (
        <>
          <Stack.Screen 
            name="MyList" 
            component={MyListScreen} 
            options={{ title: 'My Wine List' }} 
          />
          
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ title: 'Profile' }} 
          />
          
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ title: 'Settings' }} 
          />
        </>
      ) : (
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen} 
          options={{ title: 'Sign In' }} 
        />
      )}
    </Stack.Navigator>
  );
};

export default MainNavigator;