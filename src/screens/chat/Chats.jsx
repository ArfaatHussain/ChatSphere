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
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../theme';
import useConversations from '../../hooks/useConversations';
import { supabase } from '../../db/supabase';
import { getItem, StorageKeys } from '../../utils/storage';


// ─── Sub-components ───────────────────────────────────────────────────────────

const ActiveUserBubble = ({ user }) => (
  <TouchableOpacity style={styles.activeUserItem}>
    <View style={styles.activeAvatarWrapper}>
      <Image source={{ uri: user.avatar }} style={styles.activeAvatar} />
      {user.isYou ? (
        <View style={styles.addBadge}>
          <Icon name="plus" size={10} color={Colors.white} />
        </View>
      ) : (
        <View style={styles.onlineDotActive} />
      )}
    </View>
    <Text style={styles.activeUserName} numberOfLines={1}>
      {user.isYou ? 'My Story' : user.name}
    </Text>
  </TouchableOpacity>
);

const ChatItem = ({ item, onPress }) => {
  const hasUnread = item.unread > 0;

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  return (
    <TouchableOpacity style={[styles.chatItem, { backgroundColor: Colors.background }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarWrapper}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Icon name={item.type === 'group' ? 'account-group' : 'account'} size={24} color={Colors.white} />
          </View>
        )}
        {item.is_online && <View style={styles.onlineDot} />}
        {item.type === 'group' && (
          <View style={styles.groupBadge}>
            <Icon name="account-group" size={9} color={Colors.white} />
          </View>
        )}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatName, hasUnread && styles.chatNameBold]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.chatTime, hasUnread && styles.chatTimeUnread]}>
            {formatTime(item.last_message_at)}
          </Text>
        </View>
        <View style={styles.chatFooter}>
          <View style={styles.lastMessageRow}>
            {item.sent && (
              <Icon name="check-all" size={14} color={Colors.primary} style={{ marginRight: 3 }} />
            )}
            <Text style={[styles.lastMessage, hasUnread && styles.lastMessageBold]} numberOfLines={1}>
              {item.last_message || 'No messages yet'}
            </Text>
          </View>
          {hasUnread ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread > 99 ? '99+' : item.unread}</Text>
            </View>
          ) : (
            <View style={styles.unreadPlaceholder} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const Chats = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const user = getItem(StorageKeys.USER_DATA);


  const { conversations, loading, refetch } = useConversations(user?.id);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };


  const filters = ['All', 'Unread'];

  const filteredChats = conversations.filter(chat => {
    const matchesSearch = chat.name?.toLowerCase().includes(search.toLowerCase());
    if (activeFilter === 'Unread') return matchesSearch && chat.unread > 0;
    return matchesSearch;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>ChatSphere</Text>
          <Text style={styles.headerSub}>12 active contacts</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="qrcode-scan" size={22} color={Colors.darkBackground} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <View style={styles.notifDot} />
            <Icon name="bell-outline" size={22} color={Colors.darkBackground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={() => navigation.navigate('NewChat')}>
            <Icon name="pencil-plus" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color={Colors.grey} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
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

      {/* ── Filter Tabs ── */}
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

      {/* ── Section Label ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {activeFilter === 'All' ? 'Recent' : activeFilter}
        </Text>
        <TouchableOpacity>
          <Text style={styles.sectionAction}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* ── Chat List ── */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filteredChats.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="chat-sleep-outline" size={56} color={Colors.lightGrey} />
          <Text style={styles.emptyTitle}>No conversations found</Text>
          <Text style={styles.emptySubtitle}>Try a different search or start a new chat</Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={item => item.id}
          renderItem={({ item }) =>
            <ChatItem
              item={item}
              onPress={() => navigation.navigate('Chat', { conversation: item })}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        />
      )}

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewChat')}>
        <Icon name="message-plus" size={24} color={Colors.white} />
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

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallback: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.error,
    zIndex: 1,
  },
  newChatButton: {
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

  // Filter tabs
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

  // Active users row
  activeSection: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  activeScrollContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  activeUserItem: {
    alignItems: 'center',
    width: 62,
  },
  activeAvatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.xs,
  },
  activeAvatar: {
    width: 54,
    height: 54,
    borderRadius: BorderRadius.full,
    borderWidth: 2.5,
    borderColor: Colors.primary,
  },
  onlineDotActive: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 13,
    height: 13,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  addBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  activeUserName: {
    fontSize: FontSizes.xs,
    color: Colors.darkGrey,
    textAlign: 'center',
    fontWeight: '500',
    width: 60,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xs,
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

  // Chat list
  listContent: {
    paddingBottom: 100,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.lightGrey,
    marginLeft: 82,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderRadius: BorderRadius.full,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  groupBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.background,
  },

  // Chat row content
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs - 2,
  },
  chatName: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.darkBackground,
    flex: 1,
    marginRight: Spacing.sm,
  },
  chatNameBold: {
    fontWeight: '700',
  },
  chatTime: {
    fontSize: FontSizes.xs,
    color: Colors.grey,
  },
  chatTimeUnread: {
    color: Colors.primary,
    fontWeight: '600',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  unreadPlaceholder: {
    width: 20,
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

export default Chats;