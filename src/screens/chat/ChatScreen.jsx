import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../theme/index'; // adjust path to your theme file

// ---- Static dummy data (replace with real data later) ----
const CHAT_USER = {
  name: 'Sarah Mitchell',
  avatar: 'https://i.pravatar.cc/150?img=47',
  isOnline: true,
};

const MESSAGES = [
  {
    id: '1',
    type: 'text',
    text: 'Hey! How are you doing today?',
    isOwn: false,
    time: '9:41 AM',
  },
  {
    id: '2',
    type: 'text',
    text: "I'm good, just finished a workout. You?",
    isOwn: true,
    time: '9:42 AM',
  },
  {
    id: '3',
    type: 'text',
    text: 'Nice! I was just about to head out for a walk.',
    isOwn: false,
    time: '9:43 AM',
  },
  {
    id: '4',
    type: 'image',
    image: 'https://picsum.photos/seed/chatsphere1/300/220',
    isOwn: true,
    time: '9:45 AM',
  },
  {
    id: '5',
    type: 'voice',
    duration: '0:24',
    isOwn: false,
    time: '9:46 AM',
  },
  {
    id: '6',
    type: 'text',
    text: 'That looks amazing! Where is that?',
    isOwn: false,
    time: '9:47 AM',
  },
  {
    id: '7',
    type: 'voice',
    duration: '0:12',
    isOwn: true,
    time: '9:48 AM',
  },
];

export default function ChatScreen({navigation}) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* ---------- Header ---------- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn}
        onPress={()=>navigation.goBack()}
        >
         <AntDesign name="left" size={22} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.avatarWrapper}>
          <Image source={{ uri: CHAT_USER.avatar }} style={styles.avatar} />
          {CHAT_USER.isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.headerTextWrapper}>
          <Text style={styles.headerName} numberOfLines={1}>
            {CHAT_USER.name}
          </Text>
          <Text style={styles.headerStatus}>
            {CHAT_USER.isOnline ? 'Active now' : 'Offline'}
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
      <ScrollView
        style={styles.messagesArea}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {MESSAGES.map((msg) => (
          <MessageBubble key={msg.id} message={msg} avatar={CHAT_USER.avatar} />
        ))}
      </ScrollView>

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
            editable={false}
          />
        </View>

        <TouchableOpacity style={styles.inputIconBtn}>
          <Feather name="mic" size={24} color={Colors.grey} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.sendBtn}>
          <Feather name="send" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
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
});