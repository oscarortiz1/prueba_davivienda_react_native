import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthNavigator } from './src/presentation/navigation/AuthNavigator';
import { DrawerNavigator } from './src/presentation/navigation/DrawerNavigator';
import { useAuthStore } from './src/presentation/stores/authStore';
import { useAuth } from './src/presentation/hooks/useAuth';
import { Toast } from './src/presentation/components/Toast';
import { useToastStore } from './src/presentation/stores/toastStore';
import { COLORS } from './src/shared/constants/colors';
import { initializeInfrastructure } from './src/infrastructure';

// Initialize infrastructure services
initializeInfrastructure();

// Suppress non-critical React Native Web warnings
if (typeof window !== 'undefined') {
  // Suppress aria-hidden warnings from React Navigation Drawer on web
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('aria-hidden')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

// Ignore specific React Native warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { user } = useAuthStore();
  const { checkAuthStatus } = useAuth();
  const { message, type, visible, hideToast } = useToastStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        await checkAuthStatus();
      } finally {
        setIsCheckingAuth(false);
      }
    };

    initAuth();
  }, []);

  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        
        {user ? <DrawerNavigator /> : <AuthNavigator />}

        <Toast 
          message={message}
          type={type}
          visible={visible}
          onHide={hideToast}
        />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
