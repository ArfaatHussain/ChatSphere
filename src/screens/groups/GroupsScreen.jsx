import React, { useState } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../theme';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PINNED_GROUPS = [
  {
    id: 'p1',
    name: 'Design Team',
    avatar: 'https://i.pravatar.cc/150?img=12',
    members: 8,
    color: '#4F46E5',
  },
  {
    id: 'p2',
    name: 'Project Phoenix 🔥',
    avatar: 'https://i.pravatar.cc/150?img=60',
    members: 14,
    color: '#EF4444',
  },
  {
    id: 'p3',
    name: 'Dev Squad',
    avatar: 'https://i.pravatar.cc/150?img=22',
    members: 6,
    color: '#10B981',
  },
  {
    id: 'p4',
    name: 'Marketing',
    avatar: 'https://i.pravatar.cc/150?img=35',
    members: 11,
    color: '#F59E0B',
  },
  {
    id: 'p5',
    name: 'All Hands',
    avatar: 'https://i.pravatar.cc/150?img=50',
    members: 42,
    color: '#6366F1',
  },
];

const GROUPS = [
  {
    id: '1',
    name: 'Design Team',
    avatar: 'https://i.pravatar.cc/150?img=12',
    lastMessage: 'James: New Figma link is ready',
    time: '9:15 AM',
    unread: 12,
    members: 8,
    onlineCount: 3,
    muted: false,
    pinned: true,
    memberAvatars: [
      'https://i.pravatar.cc/150?img=5',
      'https://i.pravatar.cc/150?img=33',
      'https://i.pravatar.cc/150?img=44',
    ],
  },
  {
    id: '2',
    name: 'Project Phoenix 🔥',
    avatar: 'https://i.pravatar.cc/150?img=60',
    lastMessage: 'Nina: Deployment is live! 🚀',
    time: 'Yesterday',
    unread: 5,
    members: 14,
    onlineCount: 6,
    muted: false,
    pinned: true,
    memberAvatars: [
      'https://i.pravatar.cc/150?img=68',
      'https://i.pravatar.cc/150?img=47',
      'https://i.pravatar.cc/150?img=12',
    ],
  },
  {
    id: '3',
    name: 'Dev Squad',
    avatar: 'https://i.pravatar.cc/150?img=22',
    lastMessage: 'You: PR is up for review',
    time: 'Yesterday',
    unread: 0,
    members: 6,
    onlineCount: 2,
    muted: false,
    pinned: false,
    sent: true,
    memberAvatars: [
      'https://i.pravatar.cc/150?img=33',
      'https://i.pravatar.cc/150?img=1',
      'https://i.pravatar.cc/150?img=22',
    ],
  },
  {
    id: '4',
    name: 'Marketing',
    avatar: 'https://i.pravatar.cc/150?img=35',
    lastMessage: 'Sara: Campaign analytics are in',
    time: 'Mon',
    unread: 2,
    members: 11,
    onlineCount: 1,
    muted: true,
    pinned: false,
    memberAvatars: [
      'https://i.pravatar.cc/150?img=5',
      'https://i.pravatar.cc/150?img=47',
      'https://i.pravatar.cc/150?img=44',
    ],
  },
  {
    id: '5',
    name: 'All Hands',
    avatar: 'https://i.pravatar.cc/150?img=50',
    lastMessage: 'CEO: Q3 review deck is attached',
    time: 'Mon',
    unread: 0,
    members: 42,
    onlineCount: 18,
    muted: true,
    pinned: false,
    memberAvatars: [
      'https://i.pravatar.cc/150?img=12',
      'https://i.pravatar.cc/150?img=33',
      'https://i.pravatar.cc/150?img=68',
    ],
  },
  {
    id: '6',
    name: 'Weekend Hikers 🏔️',
    avatar: 'https://i.pravatar.cc/150?img=15',
    lastMessage: 'Alex: Trail map for Saturday',
    time: 'Sun',
    unread: 7,
    members: 9,
    onlineCount: 0,
    muted: false,
    pinned: false,
    memberAvatars: [
      'https://i.pravatar.cc/150?img=33',
      'https://i.pravatar.cc/150?img=5',
      'https://i.pravatar.cc/150?img=44',
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const PinnedGroupCard = ({ group, onPress }) => (
  <TouchableOpacity style={styles.pinnedCard} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.pinnedAvatarRing, { borderColor: group.color }]}>
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
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        {item.onlineCount > 0 && (
          <View style={styles.onlineBadge}>
            <Text style={styles.onlineBadgeText}>{item.onlineCount}</Text>
          </View>
        )}
      </View>

      {/* Content */}
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
            {item.time}
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
              {item.lastMessage}
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

        {/* Member stack + count */}
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
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Pinned', 'Muted'];

  const filteredGroups = GROUPS.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
    if (activeFilter === 'Pinned') return matchesSearch && g.pinned;
    if (activeFilter === 'Muted')  return matchesSearch && g.muted;
    return matchesSearch;
  });

  const handleGroupPress = (group) => {
    navigation.navigate('Chat', { chat: { ...group, type: 'group' } });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Groups</Text>
          <Text style={styles.headerSub}>{GROUPS.length} groups joined</Text>
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

      {/* ── Search ── */}
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

      {/* ── Filter Chips ── */}
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

      {/* ── Pinned / Quick Access ── */}
      {activeFilter === 'All' && !search && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pinnedScrollContent}
            style={styles.pinnedScroll}>
            {PINNED_GROUPS.map(g => (
              <PinnedGroupCard
                key={g.id}
                group={g}
                onPress={() => handleGroupPress(g)}
              />
            ))}
          </ScrollView>
        </>
      )}

      {/* ── All Groups Section ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {activeFilter === 'All' ? 'All Groups' : activeFilter}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateGroup')}>
          <Text style={styles.sectionAction}>+ New Group</Text>
        </TouchableOpacity>
      </View>

      {/* ── Group List ── */}
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
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <GroupItem item={item} onPress={() => handleGroupPress(item)} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateGroup')}>
        <Icon name="account-multiple-plus" size={24} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.darkBackground,
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: FontSizes.xs,
    color: Colors.grey,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
  newGroupButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.sm,
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

  // Filter chips
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.lightGrey,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.grey,
  },
  filterTextActive: {
    color: Colors.white,
  },

  // Pinned cards
  pinnedScroll: {
    marginBottom: Spacing.sm,
  },
  pinnedScrollContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginVertical: Spacing.md
  },
  pinnedCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    width: 80,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
  },
  pinnedAvatarRing: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.full,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  pinnedAvatar: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
  },
  pinnedName: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.darkBackground,
    textAlign: 'center',
    marginBottom: 2,
  },
  pinnedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinnedCount: {
    fontSize: FontSizes.xs - 1,
    color: Colors.grey,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.darkGrey,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionAction: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Group list
  listContent: {
    paddingBottom: 100,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.lightGrey,
    marginLeft: 82,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },

  // Avatar
  avatarWrapper: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -4,
    right: -6,
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  onlineBadgeText: {
    fontSize: FontSizes.xs - 2,
    color: Colors.white,
    fontWeight: '700',
  },

  // Group content
  groupContent: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  pinIcon: {
    marginRight: 4,
    transform: [{ rotate: '45deg' }],
  },
  muteIcon: {
    marginLeft: 4,
  },
  groupName: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.darkBackground,
    flex: 1,
  },
  groupNameBold: {
    fontWeight: '700',
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
    marginBottom: Spacing.xs,
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  lastMessage: {
    fontSize: FontSizes.sm,
    color: Colors.grey,
    flex: 1,
  },
  lastMessageBold: {
    color: Colors.darkGrey,
    fontWeight: '600',
  },
  rightMeta: {
    alignItems: 'flex-end',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    fontSize: FontSizes.xs - 1,
    color: Colors.white,
    fontWeight: '700',
  },
  mutedUnreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  mutedUnreadText: {
    fontSize: FontSizes.xs - 1,
    color: Colors.grey,
    fontWeight: '700',
  },

  // Member stack
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberStack: {
    flexDirection: 'row',
    width: 44,
    height: 20,
    position: 'relative',
    marginRight: Spacing.sm,
  },
  stackAvatar: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.background,
    position: 'absolute',
  },
  memberCount: {
    fontSize: FontSizes.xs,
    color: Colors.grey,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
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
    paddingHorizontal: Spacing.xxxl,
    marginBottom: Spacing.xl,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    elevation: 4,
  },
  emptyActionText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.white,
  },

  // FAB
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
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
});

export default GroupsScreen;