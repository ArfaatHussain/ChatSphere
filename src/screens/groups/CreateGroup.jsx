import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../theme';
import { StorageKeys, getItem } from '../../utils/storage';
import { getAllUsers, createGroupConversation } from '../../services/chatService';

// ─── Sub-components ───────────────────────────────────────────────────────────

const Avatar = ({ uri, name, size = 44 }) => {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.avatarImg, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }
  const initials = (name || '?')
    .trim()
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.avatarFallbackText}>{initials}</Text>
    </View>
  );
};

const SelectedChip = ({ user, onRemove }) => (
  <View style={styles.chip}>
    <Avatar uri={user.avatar_url} name={user.full_name} size={28} />
    <Text style={styles.chipName} numberOfLines={1}>
      {(user.full_name || user.username).split(' ')[0]}
    </Text>
    <TouchableOpacity onPress={() => onRemove(user.id)} style={styles.chipRemove}>
      <Icon name="close" size={12} color={Colors.white} />
    </TouchableOpacity>
  </View>
);

const UserRow = ({ user, selected, onToggle }) => (
  <TouchableOpacity style={styles.userRow} onPress={() => onToggle(user)} activeOpacity={0.7}>
    <View style={styles.userAvatarWrapper}>
      <Avatar uri={user.avatar_url} name={user.full_name} />
      {user.is_online && <View style={styles.onlineDot} />}
    </View>
    <View style={styles.userInfo}>
      <Text style={styles.userName} numberOfLines={1}>{user.full_name}</Text>
      <Text style={styles.userHandle} numberOfLines={1}>@{user.username}</Text>
    </View>
    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
      {selected && <Icon name="check" size={14} color={Colors.white} />}
    </View>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const CreateGroup = ({ navigation }) => {
  const currentUser = useMemo(() => getItem(StorageKeys.USER_DATA), []);

  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const data = await getAllUsers(currentUser.id);
        setUsers(data);
      } catch (err) {
        console.warn('Failed to load users', err);
        setError('Could not load users. Pull down to try again.');
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, [currentUser.id]);

  const selectedUsers = users.filter(u => selectedIds.includes(u.id));

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q)
    );
  });

  const toggleUser = useCallback(user => {
    setSelectedIds(prev =>
      prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id]
    );
  }, []);

  const removeSelected = useCallback(userId => {
    setSelectedIds(prev => prev.filter(id => id !== userId));
  }, []);

  const canCreate = groupName.trim().length > 0 && selectedIds.length > 0 && !creating;

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreating(true);
    setError(null);
    try {
      const conversation = await createGroupConversation({
        name: groupName.trim(),
        creatorId: currentUser.id,
        memberIds: selectedIds,
      });
      navigation.replace('GroupChatScreen', {
        groupId: conversation.id,
        groupName: conversation.name,
      });
    } catch (err) {
      console.warn('Failed to create group', err);
      setError('Something went wrong creating the group. Please try again.');
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Icon name="arrow-left" size={22} color={Colors.darkBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Group</Text>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={!canCreate}
          style={[styles.createButton, !canCreate && styles.createButtonDisabled]}>
          {creating ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.createButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Group name */}
      <View style={styles.nameContainer}>
        <View style={styles.nameIconWrap}>
          <Icon name="account-multiple" size={20} color={Colors.primary} />
        </View>
        <TextInput
          style={styles.nameInput}
          placeholder="Group name"
          placeholderTextColor={Colors.grey}
          value={groupName}
          onChangeText={setGroupName}
          maxLength={60}
        />
      </View>

      {/* Selected members */}
      {selectedUsers.length > 0 && (
        <View style={styles.selectedSection}>
          <Text style={styles.selectedLabel}>
            {selectedUsers.length} selected
          </Text>
          <FlatList
            data={selectedUsers}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.chipRow}
            renderItem={({ item }) => <SelectedChip user={item} onRemove={removeSelected} />}
          />
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color={Colors.grey} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people..."
          placeholderTextColor={Colors.grey}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close-circle" size={18} color={Colors.grey} />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle-outline" size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* User list */}
      {loadingUsers ? (
        <View style={[styles.centered, styles.flex]}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={[styles.centered, styles.flex]}>
          <Icon name="account-search-outline" size={56} color={Colors.lightGrey} />
          <Text style={styles.emptyTitle}>No people found</Text>
          <Text style={styles.emptySubtitle}>Try a different search</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <UserRow
              user={item}
              selected={selectedIds.includes(item.id)}
              onToggle={toggleUser}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.darkBackground,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    minWidth: 76,
    alignItems: 'center',
    elevation: 3,
  },
  createButtonDisabled: {
    backgroundColor: Colors.lightGrey,
    elevation: 0,
  },
  createButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSizes.sm,
  },

  // Group name input
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
  },
  nameIconWrap: {
    marginRight: Spacing.sm,
  },
  nameInput: {
    flex: 1,
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.darkBackground,
  },

  // Selected members
  selectedSection: {
    marginTop: Spacing.md,
  },
  selectedLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.darkGrey,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  chipRow: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingLeft: Spacing.xs,
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    marginRight: Spacing.sm,
  },
  chipName: {
    fontSize: FontSizes.sm,
    color: Colors.darkBackground,
    fontWeight: '600',
    marginLeft: Spacing.xs,
    maxWidth: 70,
  },
  chipRemove: {
    width: 18,
    height: 18,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 46,
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

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.xs,
    marginLeft: Spacing.xs,
    flexShrink: 1,
  },

  // User list
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  userAvatarWrapper: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.darkBackground,
  },
  userHandle: {
    fontSize: FontSizes.xs,
    color: Colors.grey,
    marginTop: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  // Avatars
  avatarImg: {
    backgroundColor: Colors.lightGrey,
  },
  avatarFallback: {
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },

  // Empty state
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
  },
});

export default CreateGroup;