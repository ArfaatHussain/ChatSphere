import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../theme';
import { StorageKeys, getItem } from '../../utils/storage';
import { getUserGroups } from '../../services/chatService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = isoString => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'short' });
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const PinnedGroupCard = ({ group, onPress }) => (
  <TouchableOpacity style={styles.pinnedCard} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.pinnedAvatarRing, { borderColor: Colors.primary }]}>
      <Image source={{ uri: group.avatar }} style={styles.pinnedAvatar} />
    </View>
    <Text style={styles.pinnedName} numberOfLines={1}>{group.name}</Text>
    <View style={styles.pinnedMeta}>
      <Icon name="account-multiple" size={11} color={Colors.grey} />
      <Text style={styles.pinnedCount}> {group.members}</Text>
    </View>
  </TouchableOpacity>
);

const MemberStack = ({ avatars }) => (
  <View style={styles.memberStack}>
    {avatars.slice(0, 3).map((uri, index) => (
      <Image
        key={index}
        source={{ uri }}
        style={[styles.stackAvatar, { left: index * 14, zIndex: 3 - index }]}
      />
    ))}
  </View>
);

const GroupItem = ({ item, onPress }) => {
  const hasUnread = item.unread > 0;

  return (
    <TouchableOpacity style={styles.groupItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        {item.onlineCount > 0 && (
          <View style={styles.onlineBadge}>
            <Text style={styles.onlineBadgeText}>{item.onlineCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.groupContent}>
        <View style={styles.groupHeader}>
          <View style={styles.groupNameRow}>
            {item.pinned && (
              <Icon name="pin" size={12} color={Colors.accent} style={styles.pinIcon} />
            )}
            <Text style={[styles.groupName, hasUnread && styles.groupNameBold]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.muted && (
              <Icon name="bell-off-outline" size={13} color={Colors.grey} style={styles.muteIcon} />
            )}
          </View>
          <Text style={[styles.groupTime, hasUnread && styles.groupTimeUnread]}>
            {formatTime(item.time)}
          </Text>
        </View>

        <View style={styles.groupFooter}>
          <View style={styles.lastMessageRow}>
            {item.sent && (
              <Icon name="check-all" size={14} color={Colors.primary} style={{ marginRight: 3 }} />
            )}
            <Text
              style={[styles.lastMessage, hasUnread && styles.lastMessageBold]}
              numberOfLines={1}>
              {item.lastMessage || 'No messages yet'}
            </Text>
          </View>

          <View style={styles.rightMeta}>
            {hasUnread && !item.muted ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread > 99 ? '99+' : item.unread}</Text>
              </View>
            ) : hasUnread && item.muted ? (
              <View style={styles.mutedUnreadBadge}>
                <Text style={styles.mutedUnreadText}>{item.unread}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.memberRow}>
          <MemberStack avatars={item.memberAvatars} />
          <Text style={styles.memberCount}>
            {item.members} members
            {item.onlineCount > 0 ? ` · ${item.onlineCount} online` : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const GroupsScreen = ({ navigation }) => {
  const currentUser = getItem(StorageKeys.USER_DATA);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const filters = ['All', 'Pinned', 'Muted'];

  const loadGroups = useCallback(async ({ isRefresh = false } = {}) => {
    if (!currentUser?.id) return;
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const data = await getUserGroups(currentUser.id);
      setGroups(data);
    } catch (err) {
      console.warn('Failed to load groups', err);
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, [currentUser?.id]);

  // Refetch every time the screen comes into focus (e.g. after leaving a chat)
  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups])
  );

  // "Quick Access" stand-in for real pinning: top 5 most recently active groups.
  // See services/chatService.js for a note on adding a real is_pinned column.
  const pinnedGroups = [...groups]
    .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
    .slice(0, 5);

  const filteredGroups = groups.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
    if (activeFilter === 'Pinned') return matchesSearch && g.pinned;
    if (activeFilter === 'Muted') return matchesSearch && g.muted;
    return matchesSearch;
  });

  const handleGroupPress = group => {
    navigation.navigate('GroupChatScreen', { groupId: group.id, groupName: group.name });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Groups</Text>
          <Text style={styles.headerSub}>{groups.length} groups joined</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="magnify" size={22} color={Colors.darkBackground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newGroupButton}
            onPress={() => navigation.navigate('CreateGroup')}>
            <Icon name="account-multiple-plus" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color={Colors.grey} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups..."
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

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}>
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Access */}
      {activeFilter === 'All' && !search && pinnedGroups.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pinnedScrollContent}
            style={styles.pinnedScroll}>
            {pinnedGroups.map(g => (
              <PinnedGroupCard key={g.id} group={g} onPress={() => handleGroupPress(g)} />
            ))}
          </ScrollView>
        </>
      )}

      {/* All Groups Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {activeFilter === 'All' ? 'All Groups' : activeFilter}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateGroup')}>
          <Text style={styles.sectionAction}>+ New Group</Text>
        </TouchableOpacity>
      </View>

      {/* Group List */}
      {filteredGroups.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="account-group-outline" size={60} color={Colors.lightGrey} />
          <Text style={styles.emptyTitle}>No groups found</Text>
          <Text style={styles.emptySubtitle}>
            Try a different search or create a new group
          </Text>
          <TouchableOpacity
            style={styles.emptyAction}
            onPress={() => navigation.navigate('CreateGroup')}>
            <Icon name="plus" size={16} color={Colors.white} style={{ marginRight: 6 }} />
            <Text style={styles.emptyActionText}>Create Group</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <GroupItem item={item} onPress={() => handleGroupPress(item)} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadGroups({ isRefresh: true })}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateGroup')}>
        <Icon name="account-multiple-plus" size={24} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
};

// ─── Styles (unchanged from static version) ───────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.darkBackground,
  },
  headerSub: {
    fontSize: FontSizes.sm,
    color: Colors.grey,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
  newGroupButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSizes.sm,
    color: Colors.darkGrey,
    fontWeight: '600',
  },
  filterTextActive: {
    color: Colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.darkBackground,
  },
  sectionAction: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  pinnedScroll: {
    flexGrow: 0,
  },
  pinnedScrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  pinnedCard: {
    width: 76,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  pinnedAvatarRing: {
    width: 58,
    height: 58,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  pinnedAvatar: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
  },
  pinnedName: {
    fontSize: FontSizes.xs,
    color: Colors.darkBackground,
    fontWeight: '600',
  },
  pinnedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  pinnedCount: {
    fontSize: FontSizes.xs,
    color: Colors.grey,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.lightGrey,
    marginVertical: Spacing.sm,
  },
  groupItem: {
    flexDirection: 'row',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
    paddingHorizontal: 3,
  },
  onlineBadgeText: {
    fontSize: 9,
    color: Colors.white,
    fontWeight: '700',
  },
  groupContent: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pinIcon: {
    marginRight: 4,
  },
  groupName: {
    fontSize: FontSizes.lg,
    color: Colors.darkBackground,
    flexShrink: 1,
  },
  groupNameBold: {
    fontWeight: '700',
  },
  muteIcon: {
    marginLeft: 4,
  },
  groupTime: {
    fontSize: FontSizes.xs,
    color: Colors.grey,
  },
  groupTimeUnread: {
    color: Colors.primary,
    fontWeight: '600',
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lastMessage: {
    fontSize: FontSizes.sm,
    color: Colors.grey,
    flexShrink: 1,
  },
  lastMessageBold: {
    color: Colors.darkGrey,
    fontWeight: '600',
  },
  rightMeta: {
    marginLeft: Spacing.sm,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    fontSize: FontSizes.xs,
    color: Colors.white,
    fontWeight: '700',
  },
  mutedUnreadBadge: {
    backgroundColor: Colors.lightGrey,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  mutedUnreadText: {
    fontSize: FontSizes.xs,
    color: Colors.darkGrey,
    fontWeight: '700',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  memberStack: {
    flexDirection: 'row',
    width: 50,
    height: 20,
  },
  stackAvatar: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  memberCount: {
    fontSize: FontSizes.xs,
    color: Colors.grey,
    marginLeft: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.darkBackground,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.grey,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  emptyActionText: {
    color: Colors.white,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xxl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default GroupsScreen;