import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../theme';

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password.trim()) newErrors.password = 'Password is required';
    else if (password.length < 4) newErrors.password = 'Minimum 4 characters';
    if (!confirmPassword.trim()) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace('Main');
    }, 1500);
  };

  const renderInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    errorKey,
    secureTextEntry,
    toggleSecure,
    keyboardType,
    autoCapitalize,
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, errors[errorKey] && styles.inputError]}>
        <Icon name={icon} size={20} color={Colors.grey} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.grey}
          value={value}
          onChangeText={text => {
            onChangeText(text);
            if (errors[errorKey]) setErrors(prev => ({ ...prev, [errorKey]: null }));
          }}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'sentences'}
        />
        {toggleSecure && (
          <TouchableOpacity onPress={toggleSecure}>
            <Icon
              name={!secureTextEntry ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.grey}
            />
          </TouchableOpacity>
        )}
      </View>
      {errors[errorKey] && <Text style={styles.errorText}>{errors[errorKey]}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkBackground} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Icon name="chat-processing" size={40} color={Colors.white} />
            </View>
            <Text style={styles.appName}>ChatSphere</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create Account</Text>
            <Text style={styles.cardSubtitle}>Join the conversation today</Text>

            {renderInput({
              label: 'Full Name',
              value: fullName,
              onChangeText: setFullName,
              placeholder: 'Enter your full name',
              icon: 'account-outline',
              errorKey: 'fullName',
            })}

            {renderInput({
              label: 'Email',
              value: email,
              onChangeText: setEmail,
              placeholder: 'Enter your email',
              icon: 'email-outline',
              errorKey: 'email',
              keyboardType: 'email-address',
              autoCapitalize: 'none',
            })}

            {renderInput({
              label: 'Password',
              value: password,
              onChangeText: setPassword,
              placeholder: 'Create a password',
              icon: 'lock-outline',
              errorKey: 'password',
              secureTextEntry: !showPassword,
              toggleSecure: () => setShowPassword(!showPassword),
              autoCapitalize: 'none',
            })}

            {renderInput({
              label: 'Confirm Password',
              value: confirmPassword,
              onChangeText: setConfirmPassword,
              placeholder: 'Confirm your password',
              icon: 'lock-check-outline',
              errorKey: 'confirmPassword',
              secureTextEntry: !showConfirmPassword,
              toggleSecure: () => setShowConfirmPassword(!showConfirmPassword),
              autoCapitalize: 'none',
            })}

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity
              style={styles.loginContainer}
              onPress={() => navigation.goBack()}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoContainer: {
    width: 75,
    height: 75,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    elevation: 10,
  },
  appName: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    elevation: 15,
  },
  cardTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.darkBackground,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.grey,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.darkGrey,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.lightGrey,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 52,
    backgroundColor: '#FAFAFA',
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.darkBackground,
  },
  errorText: {
    fontSize: FontSizes.xs,
    color: Colors.error,
    marginTop: 4,
  },
  registerButton: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: FontSizes.md,
    color: Colors.darkGrey,
  },
  loginLink: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: '700',
  },
});