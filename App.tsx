import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AppProvider, useApp } from './src/contexts/AppContext';
import { RootStackParamList } from './src/types';
import Logo from './src/components/Logo';
import SplashScreen from './src/components/SplashScreen';

// Import screens (we'll create these next)
import HomeScreen from './src/screens/HomeScreen';
import NewEntryScreen from './src/screens/NewEntryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MoodGraphScreen from './src/screens/MoodGraphScreen';
import MintNFTScreen from './src/screens/MintNFTScreen';

const Stack = createStackNavigator<RootStackParamList>();

// Enhanced Loading component with logo
function LoadingScreen() {
  return <SplashScreen />;
}

// Enhanced Error component with logo
function ErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <Logo size="large" variant="dark" />
      <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <Text style={styles.retryButton} onPress={onRetry}>
        🔄 Tap to retry
      </Text>
    </View>
  );
}

// Custom Header Title Component
function HeaderTitle() {
  return <Logo size="small" variant="light" showText={false} />;
}

// Main navigation component
function AppNavigator() {
  const { initialized, loading, error, clearError } = useApp();

  if (!initialized || loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={clearError} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a2e',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
          cardStyle: {
            backgroundColor: '#f8fafc',
          },
          headerTitleAlign: 'center',
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerTitle: () => <HeaderTitle />,
            headerStyle: {
              backgroundColor: '#1a1a2e',
              elevation: 4,
              shadowOpacity: 0.1,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 8,
            },
          }}
        />
        <Stack.Screen
          name="NewEntry"
          component={NewEntryScreen}
          options={{
            title: 'New Journal Entry',
            presentation: 'modal',
            headerStyle: {
              backgroundColor: '#6366f1',
            },
          }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: 'Your Profile',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
          }}
        />
        <Stack.Screen
          name="MoodGraph"
          component={MoodGraphScreen}
          options={{
            title: 'Mood Insights',
          }}
        />
        <Stack.Screen
          name="MintNFT"
          component={MintNFTScreen}
          options={{
            title: 'Mint as NFT',
            presentation: 'modal',
            headerStyle: {
              backgroundColor: '#059669',
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Main app component
export default function App() {
  return (
    <AppProvider>
      <StatusBar style="light" backgroundColor="#1a1a2e" />
      <AppNavigator />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 32,
  },
  loadingSpinner: {
    marginVertical: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  retryButton: {
    fontSize: 18,
    color: '#6366f1',
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#e0e7ff',
    borderRadius: 12,
    overflow: 'hidden',
  },
});
