import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🎯</Text>
        </View>
        <Text style={commonStyles.title}>¡Bienvenido!</Text>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardIcon}>📊</Text>
          <Text style={styles.cardTitle}>Mis Encuestas</Text>
          <Text style={styles.cardDescription}>
            Crea y gestiona tus encuestas
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardIcon}>📝</Text>
          <Text style={styles.cardTitle}>Responder</Text>
          <Text style={styles.cardDescription}>
            Participa en encuestas activas
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardIcon}>📈</Text>
          <Text style={styles.cardTitle}>Resultados</Text>
          <Text style={styles.cardDescription}>
            Visualiza estadísticas y análisis
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.buttonContainer}>
        <CustomButton title="Cerrar Sesión" onPress={handleLogout} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    fontSize: 40,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 5,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    marginTop: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.gray,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },
});
