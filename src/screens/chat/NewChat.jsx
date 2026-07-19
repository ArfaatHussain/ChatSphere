import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  SectionList,
  Animated,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../theme';
import { getItem, StorageKeys } from '../../utils/storage';
import {
  fetchAvailableUsers,
  createDirectConversation,
} from '../../services/conversationService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const groupByFirstLetter = (users) => {
  const groups = {};
  users.forEach((u) => {
    const letter = u.full_name[0].toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(u);
  });
  return Object.keys(groups)
    .sort()
    .map((letter) => ({ title: letter, data: groups[letter] }));
};

// ─── Add button with its own animation state ────────────────────────────────
// status: 'idle' | 'loading' | 'added'
const AddButton = ({ status, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'added') {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.25, duration: 140, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
    }
  }, [status]);

  return (
    <TouchableOpacity
      style={[styles.addBtn, status === 'added' && styles.addBtnSuccess]}
      onPress={onPress}
      disabled={status !== 'idle'}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {status === 'loading' ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : status === 'added' ? (
          <Icon name="check" size={18} color={Colors.white} />
        ) : (
          <Icon name="account-plus" size={18} color={Colors.white} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const UserItem = ({ user, status, onAddPress }) => (
  <View style={styles.userItem}>
    <View style={styles.avatarWrapper}>
      <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
      {user.is_online && <View style={styles.onlineDot} />}
    </View>

    <View style={styles.userContent}>
      <Text style={styles.userName} numberOfLines={1}>{user.full_name}</Text>
      <Text style={styles.userSub} numberOfLines={1}>
        @{user.username}
        {user.bio ? `  ·  ${user.bio}` : ''}
      </Text>
    </View>

    <AddButton status={status} onPress={onAddPress} />
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

const availableUsersCache = { data: null };
const NewChat = ({ navigation }) => {
  const currentUser = getItem(StorageKeys.USER_DATA);

  const [search, setSearch] = useState('');
  const [users, setUsers] = useState(availableUsersCache.data || []);
  const [loading, setLoading] = useState(!availableUsersCache.data);
  const [statusMap, setStatusMap] = useState({}); // { [userId]: 'idle' | 'loading' | 'added' }

  useEffect(() => {
    const load = async () => {
      try {
        if (!availableUsersCache.data) {
          setLoading(true);
        }
        const data = await fetchAvailableUsers(currentUser?.id);
        availableUsersCache.data = data;
        setUsers(data);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser?.id]);

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  const sections = groupByFirstLetter(filteredUsers);

  const handleAddPress = async (user) => {
    if (statusMap[user.id] && statusMap[user.id] !== 'idle') return;

    setStatusMap((prev) => ({ ...prev, [user.id]: 'loading' }));

    try {
      await createDirectConversation(currentUser.id, user);
      setStatusMap((prev) => ({ ...prev, [user.id]: 'added' }));

      // Give the tick animation a moment to play, then drop them from the list
      setTimeout(() => {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
      }, 700);
    } catch (err) {
      console.error('Failed to start chat:', err);
      setStatusMap((prev) => ({ ...prev, [user.id]: 'idle' }));
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={Colors.darkBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Chat</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color={Colors.grey} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or username..."
          placeholderTextColor={Colors.grey}
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close-circle" size={18} color={Colors.grey} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.listLabel}>Contacts</Text>

      {/* User list */}
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="account-search-outline" size={56} color={Colors.lightGrey} />
          <Text style={styles.emptyTitle}>No users found</Text>
          <Text style={styles.emptySubtitle}>Try a different name or username</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <UserItem
              user={item}
              status={statusMap[item.id] || 'idle'}
              onAddPress={() => handleAddPress(item)}
            />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionLetter}>{title}</Text>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.darkBackground,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 46,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.darkBackground,
  },

  listLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.darkGrey,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },

  sectionLetter: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  listContent: {
    paddingBottom: 40,
  },

  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  userContent: {
    flex: 1,
  },
  userName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.darkBackground,
  },
  userSub: {
    fontSize: FontSizes.sm,
    color: Colors.grey,
    marginTop: 2,
  },

  addBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnSuccess: {
    backgroundColor: Colors.success,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
    paddingHorizontal: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.darkGrey,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.grey,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});

export default NewChat;