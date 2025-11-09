import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { LoginScreen } from './src/presentation/screens/LoginScreen';
import { RegisterScreen } from './src/presentation/screens/RegisterScreen';
import { HomeScreen } from './src/presentation/screens/HomeScreen';
import MySurveysScreen from './src/presentation/screens/MySurveysScreen';
import SurveyEditorScreen from './src/presentation/screens/SurveyEditorScreen';
import SurveyResultsScreen from './src/presentation/screens/SurveyResultsScreen';
import { Navbar } from './src/presentation/components/Navbar';
import { Sidebar } from './src/presentation/components/Sidebar';
import { useAuthStore } from './src/presentation/stores/authStore';
import { useAuth } from './src/presentation/hooks/useAuth';
import { Toast } from './src/presentation/components/Toast';
import { useToastStore } from './src/presentation/stores/toastStore';
import { COLORS } from './src/shared/constants/colors';
import { initializeInfrastructure } from './src/infrastructure';

// Initialize infrastructure services
initializeInfrastructure();

type Screen = 
  | 'login' 
  | 'register' 
  | 'home' 
  | 'mySurveys' 
  | 'surveyEditor' 
  | 'surveyResults';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [screenParams, setScreenParams] = useState<any>({});
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
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

  // Auto-navigate when user logs in/out
  useEffect(() => {
    if (user) {
      setCurrentScreen('mySurveys');
    } else {
      setCurrentScreen('login');
      setScreenParams({});
    }
  }, [user]);

  // Simple navigation helper
  const navigation = {
    navigate: (screen: string, params?: any) => {
      setCurrentScreen(screen as Screen);
      setScreenParams(params || {});
    },
    goBack: () => {
      setCurrentScreen('mySurveys');
      setScreenParams({});
    },
  };

  // Get screen title for navbar
  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'mySurveys':
        return 'Mis Encuestas';
      case 'surveyEditor':
        return screenParams?.surveyId === 'new' ? 'Nueva Encuesta' : 'Editar Encuesta';
      case 'surveyResults':
        return 'Resultados';
      default:
        return 'Davivienda';
    }
  };

  // Check if current screen should show back button
  const shouldShowBackButton = () => {
    return currentScreen === 'surveyEditor' || currentScreen === 'surveyResults';
  };

  if (isCheckingAuth) {
    return (
      <View style={[styles.outerContainer, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const renderScreen = () => {
    if (user) {
      switch (currentScreen) {
        case 'mySurveys':
          return <MySurveysScreen navigation={navigation} />;
        case 'surveyEditor':
          return (
            <SurveyEditorScreen 
              route={{ params: screenParams }} 
              navigation={navigation} 
            />
          );
        case 'surveyResults':
          return (
            <SurveyResultsScreen 
              route={{ params: screenParams }} 
              navigation={navigation} 
            />
          );
        case 'home':
        default:
          return <HomeScreen onLogout={() => setCurrentScreen('login')} />;
      }
    }

    switch (currentScreen) {
      case 'login':
        return (
          <LoginScreen
            onNavigateToRegister={() => setCurrentScreen('register')}
            onLoginSuccess={() => setCurrentScreen('mySurveys')}
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onNavigateToLogin={() => setCurrentScreen('login')}
            onRegisterSuccess={() => setCurrentScreen('mySurveys')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        {/* Navbar - Only show when user is logged in */}
        {user && (
          <Navbar
            title={getScreenTitle()}
            onMenuPress={() => setSidebarVisible(true)}
            showBackButton={shouldShowBackButton()}
            onBackPress={navigation.goBack}
          />
        )}

        {/* Main Content */}
        <View style={styles.content}>
          {renderScreen()}
        </View>

        {/* Sidebar - Only show when user is logged in */}
        {user && (
          <Sidebar
            visible={sidebarVisible}
            onClose={() => setSidebarVisible(false)}
            currentScreen={currentScreen}
            onNavigate={navigation.navigate}
          />
        )}

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
  content: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
