import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../../shared/utils/validations';
import { COLORS } from '../../../shared/constants/colors';
import { AuthStackParamList } from '../../navigation/types';
import { styles } from './LoginScreen.styles';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });

  const { login, isLoading } = useAuth();

  const validate = (): boolean => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    if (!email) {
      newErrors.email = 'El email es requerido';
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = 'Email inválido';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
      isValid = false;
    } else if (!validatePassword(password)) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      await login(email, password);
    } catch (error) {
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: COLORS.white }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          {/* Header simple */}
          <View style={styles.header}>
            <Text style={styles.icon}>📊</Text>
            <Text style={styles.title}>Encuestas</Text>
            <Text style={styles.subtitle}>Davivienda</Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            <CustomInput
              placeholder="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <CustomInput
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />

            <CustomButton
              title="Iniciar Sesión"
              onPress={handleLogin}
              loading={isLoading}
            />
          </View>

          {/* Link de registro */}
          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>
              ¿No tienes cuenta? Regístrate
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
