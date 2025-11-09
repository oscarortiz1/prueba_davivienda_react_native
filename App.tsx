import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Platform } from 'react-native';
import { LoginScreen } from './src/presentation/screens/LoginScreen';
import { RegisterScreen } from './src/presentation/screens/RegisterScreen';
import { HomeScreen } from './src/presentation/screens/HomeScreen';
import { useAuthStore } from './src/presentation/stores/authStore';
import { Toast } from './src/presentation/components/Toast';
import { useToastStore } from './src/presentation/stores/toastStore';

type Screen = 'login' | 'register' | 'home';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const { user } = useAuthStore();
  const { message, type, visible, hideToast } = useToastStore();

  const renderScreen = () => {
    if (user) {
      return <HomeScreen onLogout={() => setCurrentScreen('login')} />;
    }

    switch (currentScreen) {
      case 'login':
        return (
          <LoginScreen
            onNavigateToRegister={() => setCurrentScreen('register')}
            onLoginSuccess={() => setCurrentScreen('home')}
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onNavigateToLogin={() => setCurrentScreen('login')}
            onRegisterSuccess={() => setCurrentScreen('home')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        {renderScreen()}
        <StatusBar style="auto" />
        
        {/* Global Toast Notifications */}
        <Toast
          message={message}
          type={type}
          visible={visible}
          onHide={hideToast}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
