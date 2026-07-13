import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../theme';
import { getItem, StorageKeys, removeItem } from '../../utils/storage';
import { setUserOffline } from '../../services/userService';
import ConfirmModal from '../../components/ConfirmModal';

const ProfileScreen = ({ navigation }) => {
  const user = getItem(StorageKeys.USER_DATA);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);

    const userData = getItem(StorageKeys.USER_DATA);

    if (userData?.id) {
      await setUserOffline(userData.id);
    }

    removeItem(StorageKeys.USER_DATA);
    navigation.replace('login');
  };

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrapper}>
        <Icon name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.infoTextWrapper}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <ConfirmModal
        visible={showLogoutModal}
        title="Log out"
        message="Are you sure you want to log out?"
        confirmText="Log out"
        cancelText="Cancel"
        icon="log-out"
        destructive
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Avatar + Name Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="account" size={40} color={Colors.white} />
              </View>
            )}
          </View>
          <Text style={styles.fullName}>{user?.full_name || 'Unnamed User'}</Text>
          <Text style={styles.username}>@{user?.username || 'username'}</Text>
        </View>

        {/* Bio Card */}
        {user?.bio ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>About</Text>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        ) : null}

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Account Info</Text>
          <InfoRow icon="email-outline" label="Email" value={user?.email} />
          <InfoRow icon="account-outline" label="Full Name" value={user?.full_name} />
          <InfoRow icon="at" label="Username" value={user?.username} />
        </View>

        {/* Actions Card */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow}>
            <Icon name="pencil-outline" size={20} color={Colors.darkGrey} />
            <Text style={styles.actionText}>Edit Profile</Text>
            <Icon name="chevron-right" size={20} color={Colors.grey} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow}>
            <Icon name="lock-outline" size={20} color={Colors.darkGrey} />
            <Text style={styles.actionText}>Privacy & Security</Text>
            <Icon name="chevron-right" size={20} color={Colors.grey} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow}>
            <Icon name="theme-light-dark" size={20} color={Colors.darkGrey} />
            <Text style={styles.actionText}>Appearance</Text>
            <Icon name="chevron-right" size={20} color={Colors.grey} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    borderWidth: 3,
    borderColor: Colors.white,
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullName: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.darkBackground,
    marginTop: Spacing.sm,
  },
  username: {
    fontSize: FontSizes.md,
    color: Colors.grey,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.grey,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  bioText: {
    fontSize: FontSizes.md,
    color: Colors.darkBackground,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  infoIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FontSizes.xs,
    color: Colors.grey,
  },
  infoValue: {
    fontSize: FontSizes.md,
    color: Colors.darkBackground,
    fontWeight: '500',
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  actionText: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.darkBackground,
    marginLeft: Spacing.sm,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGrey,
    marginVertical: Spacing.xs,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.error}30`,
  },
  logoutText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.error,
    marginLeft: Spacing.sm,
  },
});

export default ProfileScreen;