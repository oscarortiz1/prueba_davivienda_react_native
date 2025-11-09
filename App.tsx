import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
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
