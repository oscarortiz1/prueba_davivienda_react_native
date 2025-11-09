import React from 'react';
import { View, Text } from 'react-native';
import { homeScreenStyles } from './HomeScreen/homeScreen.styles';
import { CustomButton } from '../components/CustomButton';
import { useAuth } from '../hooks/useAuth';
import { commonStyles } from '../theme/styles';
import { COLORS } from '../../shared/constants/colors';

interface HomeScreenProps {
  onLogout: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onLogout }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  return (
    <View style={commonStyles.container}>
      <View style={homeScreenStyles.header}>
        <View style={homeScreenStyles.iconContainer}>
          <Text style={homeScreenStyles.icon}>🎯</Text>
        </View>
        <Text style={commonStyles.title}>¡Bienvenido!</Text>
        <Text style={homeScreenStyles.userName}>{user?.name}</Text>
        <Text style={homeScreenStyles.userEmail}>{user?.email}</Text>
      </View>

      <View style={homeScreenStyles.content}>
        <View style={homeScreenStyles.card}>
          <Text style={homeScreenStyles.cardIcon}>📊</Text>
          <Text style={homeScreenStyles.cardTitle}>Mis Encuestas</Text>
          <Text style={homeScreenStyles.cardDescription}>
            Crea y gestiona tus encuestas
          </Text>
        </View>

        <View style={homeScreenStyles.card}>
          <Text style={homeScreenStyles.cardIcon}>📝</Text>
          <Text style={homeScreenStyles.cardTitle}>Responder</Text>
          <Text style={homeScreenStyles.cardDescription}>
            Participa en encuestas activas
          </Text>
        </View>

        <View style={homeScreenStyles.card}>
          <Text style={homeScreenStyles.cardIcon}>📈</Text>
          <Text style={homeScreenStyles.cardTitle}>Resultados</Text>
          <Text style={homeScreenStyles.cardDescription}>
            Visualiza estadísticas y análisis
          </Text>
        </View>
      </View>

      <View style={homeScreenStyles.buttonContainer}>
        <CustomButton title="Cerrar Sesión" onPress={handleLogout} />
      </View>
    </View>
  );
};

// ...existing code...
