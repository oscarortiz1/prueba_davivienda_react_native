import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword, validateName } from '../../../shared/utils/validations';
import { COLORS } from '../../../shared/constants/colors';
import { AuthStackParamList } from '../../navigation/types';
import { styles } from './RegisterScreen.styles';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ name: '', email: '', password: '' });

  const { register, isLoading } = useAuth();

  const validate = (): boolean => {
    const newErrors = { name: '', email: '', password: '' };
    let isValid = true;

    if (!name) {
      newErrors.name = 'El nombre es requerido';
      isValid = false;
    } else if (!validateName(name)) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
      isValid = false;
    }

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

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      await register(name, email, password);
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
            <Text style={styles.icon}>📝</Text>
            <Text style={styles.title}>Registro</Text>
            <Text style={styles.subtitle}>Davivienda</Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            <CustomInput
              placeholder="Nombre completo"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              error={errors.name}
            />

            <CustomInput
              placeholder="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <CustomInput
              placeholder="Contraseña (min. 6 caracteres)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />

            <CustomButton
              title="Registrarse"
              onPress={handleRegister}
              loading={isLoading}
            />
          </View>

          {/* Link de login */}
          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>
              ¿Ya tienes cuenta? Inicia sesión
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
