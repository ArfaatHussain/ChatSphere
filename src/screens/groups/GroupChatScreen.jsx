import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../theme';
import { StorageKeys, getItem } from '../../utils/storage';
import {
  getConversationDetails,
  getMessages,
  sendMessage,
  subscribeToMessages,
  setTypingStatus,
  subscribeToTyping,
} from '../../services/chatService';

const TYPING_TIMEOUT = 3000;

// ─── Sub-components ───────────────────────────────────────────────────────────

const Avatar = ({ uri, name, size = 34 }) => {
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

const MessageBubble = ({ message, isOwn, showSenderInfo }) => {
  const sender = message.users || {};
  const time = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <View style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}>
      {!isOwn && (
        <View style={styles.messageAvatarSlot}>
          {showSenderInfo && <Avatar uri={sender.avatar_url} name={sender.full_name} size={28} />}
        </View>
      )}

      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn && showSenderInfo && (
          <Text style={styles.senderName}>{sender.full_name || sender.username}</Text>
        )}
        <Text style={[styles.messageText, isOwn ? styles.messageTextOwn : styles.messageTextOther]}>
          {message.message}
        </Text>
        <Text style={[styles.messageTime, isOwn ? styles.messageTimeOwn : styles.messageTimeOther]}>
          {time}
        </Text>
      </View>
    </View>
  );
};

const TypingIndicator = ({ users }) => {
  if (!users.length) return null;
  const label =
    users.length === 1
      ? `${users[0].full_name || users[0].username} is typing`
      : users.length === 2
      ? `${users[0].full_name || users[0].username} and ${users[1].full_name || users[1].username} are typing`
      : `${users.length} people are typing`;

  return (
    <View style={[styles.messageRow, styles.messageRowOther]}>
      <View style={styles.messageAvatarSlot}>
        <Avatar uri={users[0].avatar_url} name={users[0].full_name} size={28} />
      </View>
      <View style={[styles.bubble, styles.bubbleOther, styles.typingBubble]}>
        <View style={styles.typingDots}>
          <View style={styles.typingDot} />
          <View style={[styles.typingDot, styles.typingDotMid]} />
          <View style={styles.typingDot} />
        </View>
        <Text style={styles.typingText}>{label}</Text>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const GroupChatScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const currentUser = useMemo(() => getItem(StorageKeys.USER_DATA), []);

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  const membersRef = useRef({});
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    let unsubscribeMessages;
    let unsubscribeTyping;
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const details = await getConversationDetails(groupId);
        if (!isMounted) return;

        setGroup(details);
        details.members.forEach(m => {
          membersRef.current[m.id] = m;
        });

        const msgs = await getMessages(groupId);
        if (!isMounted) return;
        setMessages(msgs);

        unsubscribeMessages = subscribeToMessages(groupId, newMessage => {
          // Skip echoing our own message back in (we already appended it optimistically on send)
          if (newMessage.sender_id === currentUser.id) return;
          const sender = membersRef.current[newMessage.sender_id];
          setMessages(prev => [...prev, { ...newMessage, users: sender }]);
        });

        unsubscribeTyping = subscribeToTyping(groupId, row => {
          if (row.user_id === currentUser.id) return;
          setTypingUsers(prev => {
            const withoutUser = prev.filter(u => u.id !== row.user_id);
            if (row.is_typing) {
              const user = membersRef.current[row.user_id];
              if (user) return [...withoutUser, user];
            }
            return withoutUser;
          });
        });
      } catch (err) {
        console.warn('Failed to load group chat', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
      unsubscribeMessages && unsubscribeMessages();
      unsubscribeTyping && unsubscribeTyping();
      if (isTypingRef.current) {
        setTypingStatus(groupId, currentUser.id, false);
      }
      clearTimeout(typingTimeoutRef.current);
    };
  }, [groupId, currentUser.id]);

  const handleChangeText = text => {
    setInputText(text);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      setTypingStatus(groupId, currentUser.id, true);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      setTypingStatus(groupId, currentUser.id, false);
    }, TYPING_TIMEOUT);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    setInputText('');
    clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    setTypingStatus(groupId, currentUser.id, false);

    try {
      const sent = await sendMessage(groupId, currentUser.id, text);
      setMessages(prev => [...prev, { ...sent, users: currentUser }]);
    } catch (err) {
      console.warn('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  const memberNames = group
    ? group.members
        .map(m => (m.id === currentUser.id ? 'You' : m.full_name || m.username))
        .join(', ')
    : '';

  const renderItem = ({ item, index }) => {
    const isOwn = item.sender_id === currentUser.id;
    const prevItem = messages[index - 1];
    const showSenderInfo = !isOwn && (!prevItem || prevItem.sender_id !== item.sender_id);
    return <MessageBubble message={item} isOwn={isOwn} showSenderInfo={showSenderInfo} />;
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={Colors.darkBackground} />
        </TouchableOpacity>

        <Avatar uri={group?.avatar} name={group?.name} size={40} />

        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {group?.name}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {memberNames}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => navigation.navigate('GroupDetail', { groupId })}>
          <Icon name="dots-vertical" size={22} color={Colors.darkBackground} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={<TypingIndicator users={typingUsers} />}
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message"
            placeholderTextColor={Colors.grey}
            value={inputText}
            onChangeText={handleChangeText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}>
            <Icon name="send" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
  },
  backButton: {
    marginRight: Spacing.sm,
    padding: Spacing.xs,
  },
  headerText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.darkBackground,
  },
  headerSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.grey,
    marginTop: 2,
  },
  headerIcon: {
    padding: Spacing.xs,
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

  // Message list
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    maxWidth: '85%',
  },
  messageRowOwn: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
  },
  messageAvatarSlot: {
    width: 28,
    marginRight: Spacing.sm,
    justifyContent: 'flex-end',
  },

  // Bubbles
  bubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  bubbleOwn: {
    backgroundColor: Colors.ownMessage,
    borderBottomRightRadius: BorderRadius.sm,
  },
  bubbleOther: {
    backgroundColor: Colors.receivedMessage,
    borderBottomLeftRadius: BorderRadius.sm,
  },
  senderName: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 2,
  },
  messageText: {
    fontSize: FontSizes.md,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: Colors.ownMessageText,
  },
  messageTextOther: {
    color: Colors.receivedMessageText,
  },
  messageTime: {
    fontSize: FontSizes.xs,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  messageTimeOther: {
    color: Colors.grey,
  },

  // Typing indicator
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: Spacing.sm,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.grey,
    marginHorizontal: 1,
  },
  typingDotMid: {
    opacity: 0.6,
  },
  typingText: {
    fontSize: FontSizes.sm,
    color: Colors.darkGrey,
    fontStyle: 'italic',
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGrey,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
    fontSize: FontSizes.md,
    color: Colors.darkBackground,
    marginRight: Spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.lightGrey,
  },
});

export default GroupChatScreen;