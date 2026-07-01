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
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../theme';
import { supabase } from '../../db/supabase';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null); // { uri, type, fileName }
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    else if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim()))
      newErrors.username = '3-20 chars, letters/numbers/underscore only';
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

  const handlePickAvatar = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
        includeBase64: false,
      },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Could not open gallery');
          return;
        }
        const asset = response.assets && response.assets[0];
        if (asset) {
          setAvatar({
            uri: asset.uri,
            type: asset.type,
            fileName: asset.fileName || `avatar_${Date.now()}.jpg`,
          });
        }
      },
    );
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace('login');
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
    multiline,
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          multiline && styles.inputContainerMultiline,
          errors[errorKey] && styles.inputError,
        ]}>
        <Icon
          name={icon}
          size={20}
          color={Colors.grey}
          style={[styles.inputIcon, multiline && styles.inputIconMultiline]}
        />
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
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
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
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

            {/* Avatar Picker */}
            <View style={styles.avatarSection}>
              <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarWrapper}>
                {avatar ? (
                  <Image source={{ uri: avatar.uri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Icon name="account-outline" size={36} color={Colors.grey} />
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  <Icon name="camera" size={14} color={Colors.white} />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHelperText}>
                {avatar ? 'Tap to change photo' : 'Add a profile photo'}
              </Text>
            </View>

            {renderInput({
              label: 'Username',
              value: username,
              onChangeText: setUsername,
              placeholder: 'Choose a username',
              icon: 'at',
              errorKey: 'username',
              autoCapitalize: 'none',
            })}

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
              label: 'Bio',
              value: bio,
              onChangeText: setBio,
              placeholder: 'Tell us a little about yourself (optional)',
              icon: 'text-account',
              errorKey: 'bio',
              multiline: true,
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarWrapper: {
    width: 90,
    height: 90,
    borderRadius: BorderRadius.full,
    position: 'relative',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: BorderRadius.full,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: Colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarHelperText: {
    fontSize: FontSizes.xs,
    color: Colors.grey,
    marginTop: Spacing.xs,
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
  inputContainerMultiline: {
    height: 80,
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  inputIconMultiline: {
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.darkBackground,
  },
  inputMultiline: {
    height: '100%',
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