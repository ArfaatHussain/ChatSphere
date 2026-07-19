import React, { useEffect, useState, useRef, useMemo, } from 'react';
import {
    View, Text, Image, StyleSheet, FlatList, TouchableOpacity,
    TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../theme/index';
import useMessages from '../../hooks/useMessages';
import { sendMessage } from '../../services/messageService';
import { getItem, StorageKeys } from '../../utils/storage';
import { fetchDirectChatUser, markConversationAsRead } from '../../services/conversationService';

// Module-level cache — persists across screen mounts/unmounts
const otherUserCache = new Map();

export default function ChatScreen({ navigation, route }) {
    const { conversation } = route.params;
    const currentUser = getItem(StorageKeys.USER_DATA);
    const currentUserId = currentUser?.id;

    const [otherUser, setOtherUser] = useState(otherUserCache.get(conversation.id) || null);

    const [inputText, setInputText] = useState('');

    const scrollViewRef = useRef(null);

    useEffect(() => {
        fetchDirectChatUser(conversation.id, currentUserId)
            .then((user) => {
                otherUserCache.set(conversation.id, user); // update cache
                setOtherUser(user);
            })
            .catch((err) => console.error('Failed to load user status:', err));
    }, [conversation.id, currentUserId]);

    const { messages, loading, error } = useMessages(conversation.id, currentUserId);

    useEffect(() => {
        if (conversation.id && currentUserId) {
            markConversationAsRead(conversation.id, currentUserId).catch((err) =>
                console.error('Failed to mark as read:', err)
            );
        }
    }, [conversation.id, currentUserId, messages.length]);

    useEffect(() => {
        if (!loading && messages.length > 0) {
            // small timeout lets layout settle before scrolling
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: false });
            }, 50);
        }
    }, [loading, messages.length]);

    // Reverse once, memoized — FlatList `inverted` expects newest-first order
    const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

    const formatLastSeen = (lastSeen) => {
        if (!lastSeen) return 'Offline';

        const date = new Date(lastSeen);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Last seen just now';
        if (diffMins < 60) return `Last seen ${diffMins}m ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Last seen ${diffHours}h ago`;

        return `Last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
    };

    const handleSend = async () => {
        const trimmed = inputText.trim();
        if (!trimmed) return;

        setInputText(''); // clear immediately for a snappy feel

        try {
            await sendMessage({
                conversationId: conversation.id,
                senderId: currentUserId,
                message: trimmed,
                messageType: 'text',
            });
        } catch (err) {
            console.error('Failed to send message:', err);
            setInputText(trimmed); // restore text if the send failed
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={{ flex: 1 }} >


                <View style={styles.header}>
                    <TouchableOpacity style={styles.iconBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <AntDesign name="left" size={22} color={Colors.primary} />
                    </TouchableOpacity>

                    <View style={styles.avatarWrapper}>
                        <Image source={{ uri: conversation.avatar_url }} style={styles.avatar} />
                        {otherUser?.is_online && <View style={styles.onlineDot} />}
                    </View>

                    <View style={styles.headerTextWrapper}>
                        <Text style={styles.headerName} numberOfLines={1}>
                            {conversation.name}
                        </Text>
                        <Text style={styles.headerStatus}>
                            {otherUser?.is_online ? 'Active now' : formatLastSeen(otherUser?.last_seen)}
                        </Text>
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity style={[styles.iconBtn, { marginRight: Spacing.xl }]}>
                            <AntDesign name="phone" size={20} color={Colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn}>
                            <AntDesign name="videocamera" size={20} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ---------- Messages ---------- */}
                {loading ? (
                    <View style={styles.centerState}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                    </View>
                ) : error ? (
                    <View style={styles.centerState}>
                        <Text style={{ color: Colors.error }}>{error}</Text>
                    </View>
                ) : (
                    <FlatList
                        data={invertedMessages}
                        keyExtractor={(item) => String(item.id)}
                        inverted
                        style={styles.messagesArea}
                        contentContainerStyle={styles.messagesContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        renderItem={({ item }) => (
                            <MessageBubble message={item} avatar={conversation.avatar_url} />
                        )}

                        initialNumToRender={15}
                        maxToRenderPerBatch={10}
                        windowSize={10}
                    />
                )}

                {/* ---------- Input Bar ---------- */}
                <View style={styles.inputBar}>
                    <TouchableOpacity style={styles.inputIconBtn}>
                        <Feather name="image" size={24} color={Colors.grey} />
                    </TouchableOpacity>

                    <View style={styles.textInputWrapper}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Type a message..."
                            placeholderTextColor={Colors.grey}
                            value={inputText}
                            onChangeText={setInputText}
                        />
                    </View>

                    <TouchableOpacity style={styles.inputIconBtn}>
                        <Feather name="mic" size={24} color={Colors.grey} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <Feather name="send" size={18} color={Colors.white} />
                    </TouchableOpacity>
                </View>
            </View>

        </KeyboardAvoidingView>
    );
}

// ---------- Message bubble sub-component ----------
function MessageBubble({ message, avatar }) {
    const { isOwn, type, time } = message;

    return (
        <View
            style={[
                styles.messageRow,
                { justifyContent: isOwn ? 'flex-end' : 'flex-start' },
            ]}
        >
            {!isOwn && (
                <Image source={{ uri: avatar }} style={styles.messageAvatar} />
            )}

            <View
                style={[
                    styles.bubble,
                    isOwn ? styles.ownBubble : styles.receivedBubble,
                    type === 'image' && styles.imageBubble,
                ]}
            >
                {message.isDeleted ? (
                    <Text style={[styles.messageText, { fontStyle: 'italic', color: Colors.grey }]}>
                        This message was deleted
                    </Text>
                ) : (
                    <>
                        {type === 'text' && (
                            <Text
                                style={[
                                    styles.messageText,
                                    { color: isOwn ? Colors.ownMessageText : Colors.receivedMessageText },
                                ]}
                            >
                                {message.text}
                            </Text>
                        )}

                        {type === 'image' && (
                            <Image source={{ uri: message.image }} style={styles.messageImage} />
                        )}

                        {type === 'voice' && (
                            <View style={styles.voiceRow}>
                                <TouchableOpacity style={styles.playBtn}>
                                    <AntDesign
                                        name="play"
                                        size={14}
                                        color={isOwn ? Colors.primary : Colors.white}
                                    />
                                </TouchableOpacity>
                                <View style={styles.voiceWaveform}>
                                    {[4, 8, 6, 12, 5, 9, 3, 10, 6, 4].map((h, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.waveBar,
                                                {
                                                    height: h,
                                                    backgroundColor: isOwn
                                                        ? Colors.ownMessageText
                                                        : Colors.primary,
                                                },
                                            ]}
                                        />
                                    ))}
                                </View>
                                <Text
                                    style={[
                                        styles.voiceDuration,
                                        { color: isOwn ? Colors.ownMessageText : Colors.receivedMessageText },
                                    ]}
                                >
                                    {message.duration}
                                </Text>
                            </View>
                        )}
                    </>
                )}

                <Text
                    style={[
                        styles.timeText,
                        {
                            color: isOwn
                                ? 'rgba(255,255,255,0.7)'
                                : Colors.grey,
                        },
                    ]}
                >
                    {message.isEdited && !message.isDeleted && 'edited · '}
                    {time}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGrey,
    },
    iconBtn: {
        padding: Spacing.xs,
    },
    avatarWrapper: {
        marginLeft: Spacing.xs,
        marginRight: Spacing.sm,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.full,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 11,
        height: 11,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.success,
        borderWidth: 2,
        borderColor: Colors.white,
    },
    headerTextWrapper: {
        flex: 1,
    },
    headerName: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.black,
    },
    headerStatus: {
        fontSize: FontSizes.xs,
        color: Colors.success,
        marginTop: 1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // Messages
    messagesArea: {
        flex: 1,
    },
    messagesContent: {
        padding: Spacing.md,
        paddingBottom: Spacing.lg,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: Spacing.md,
    },
    messageAvatar: {
        width: 28,
        height: 28,
        borderRadius: BorderRadius.full,
        marginRight: Spacing.sm,
    },
    bubble: {
        maxWidth: '72%',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
    },
    ownBubble: {
        backgroundColor: Colors.ownMessage,
        borderBottomRightRadius: BorderRadius.sm,
    },
    receivedBubble: {
        backgroundColor: Colors.receivedMessage,
        borderBottomLeftRadius: BorderRadius.sm,
    },
    imageBubble: {
        padding: Spacing.xs,
    },
    messageText: {
        fontSize: FontSizes.md,
        lineHeight: 20,
    },
    messageImage: {
        width: 220,
        height: 160,
        borderRadius: BorderRadius.md,
    },
    timeText: {
        fontSize: FontSizes.xs,
        marginTop: Spacing.xs,
        alignSelf: 'flex-end',
    },

    // Voice message
    voiceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 160,
    },
    playBtn: {
        width: 26,
        height: 26,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(0,0,0,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    voiceWaveform: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 2,
    },
    waveBar: {
        width: 2.5,
        borderRadius: BorderRadius.sm,
        marginRight: 2,
    },
    voiceDuration: {
        fontSize: FontSizes.xs,
        marginLeft: Spacing.sm,
    },

    // Input bar
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.lightGrey,
    },
    inputIconBtn: {
        padding: Spacing.xs,
    },
    textInputWrapper: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.md,
        marginHorizontal: Spacing.sm,
    },
    textInput: {
        fontSize: FontSizes.md,
        color: Colors.black,
        paddingVertical: Spacing.sm,
    },
    sendBtn: {
        width: 38,
        height: 38,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },

    centerState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});