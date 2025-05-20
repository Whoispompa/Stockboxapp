import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://193.203.165.112:4000';

export default function LoginScreen({ navigation, setIsLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('El correo es requerido');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Ingrese un correo válido');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password) => {
    if (!password) {
      setPasswordError('La contraseña es requerida');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    if (!isEmailValid || !isPasswordValid) return;

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email: email.trim(),
        password: password
      });

      if (response.status === 201) {
        const { token, id, email: userEmail, first_name, last_name, role } = response.data.data;

        await AsyncStorage.setItem('authToken', token);

        const userData = JSON.stringify({ id, email: userEmail, first_name, last_name, role });
        await AsyncStorage.setItem('userData', userData);

        Alert.alert('Bienvenido', `Hola, ${first_name} ${last_name}`);

        setIsLoggedIn(true);
        navigation.replace('Home');
      } else {
        Alert.alert('Error', response.data.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      let errorMessage = 'Error al iniciar sesión';
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Tiempo de espera agotado. Intente nuevamente.';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Error de conexión. Verifica tu internet.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="package-variant-closed" size={80} color="#2563eb" />
          <Text style={styles.logoText}>StockBox</Text>
          <Text style={styles.subtitle}>Gestión de Refacciones</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="email-outline" size={24} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                validateEmail(text);
              }}
            />
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-outline" size={24} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                validatePassword(text);
              }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showPasswordButton}>
              <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
            <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.loginButtonText}>{isLoading ? 'Cargando...' : 'Iniciar Sesión'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginBottom: 10,
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  showPasswordButton: {
    padding: 5,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  forgotPasswordText: {
    alignSelf: 'flex-end',
    color: '#2563eb',
    fontSize: 14,
    marginBottom: 20,
  },
  loginButton: {
    width: '100%',
    height: 55,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});