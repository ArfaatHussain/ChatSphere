import { supabase } from '../db/supabase';

// ─── Users / group creation ──────────────────────────────────────────────────

/**
 * Fetch all users except the given one, for populating a "select members"
 * list when creating a group.
 *
 * NOTE: the schema has no friends/contacts table, so this returns every
 * registered user rather than a real friends list. If you add a `friends`
 * table (e.g. user_id, friend_id, status) later, swap this query to join
 * against it and filter to accepted connections.
 */
export const getAllUsers = async (excludeUserId) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, full_name, avatar_url, is_online')
    .neq('id', excludeUserId)
    .order('full_name', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Create a new group conversation with the given members.
 * The creator is added as 'admin'; everyone else as 'member'.
 */
export const createGroupConversation = async ({ name, avatarUrl, creatorId, memberIds }) => {
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      type: 'group',
      name,
      avatar_url: avatarUrl || null,
      created_by: creatorId,
    })
    .select('id, name, avatar_url, type')
    .single();

  if (convError) throw convError;

  const memberRows = [
    { conversation_id: conversation.id, user_id: creatorId, role: 'admin' },
    ...memberIds
      .filter(id => id !== creatorId)
      .map(id => ({ conversation_id: conversation.id, user_id: id, role: 'member' })),
  ];

  const { error: memberError } = await supabase
    .from('conversation_members')
    .insert(memberRows);

  if (memberError) {
    // Roll back the orphaned conversation if member insertion fails.
    await supabase.from('conversations').delete().eq('id', conversation.id);
    throw memberError;
  }

  return conversation;
};

// ─── Groups list (GroupsScreen) ──────────────────────────────────────────────

/**
 * Fetch all group conversations the given user belongs to, with member info,
 * member avatars, and online counts, sorted by most recent activity.
 */
export const getUserGroups = async (userId) => {
  const { data: memberRows, error: memberError } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', userId);

  if (memberError) throw memberError;

  const conversationIds = (memberRows || []).map(r => r.conversation_id);
  if (conversationIds.length === 0) return [];

  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select(`
      id,
      name,
      avatar_url,
      type,
      last_message,
      last_message_at,
      last_message_sender_id,
      conversation_members (
        user_id,
        users ( id, username, full_name, avatar_url, is_online )
      )
    `)
    .in('id', conversationIds)
    .eq('type', 'group')
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (convError) throw convError;

  return (conversations || []).map(c => {
    const members = (c.conversation_members || [])
      .map(m => m.users)
      .filter(Boolean);
    const onlineCount = members.filter(u => u.is_online).length;

    return {
      id: c.id,
      name: c.name,
      avatar: c.avatar_url,
      lastMessage: c.last_message,
      time: c.last_message_at,
      members: members.length,
      onlineCount,
      memberAvatars: members.slice(0, 3).map(u => u.avatar_url),
      // NOTE: no pinned/muted column exists yet on conversation_members.
      // If you want real pin/mute state, add e.g. `is_pinned boolean`
      // and `is_muted boolean` to conversation_members and select them above.
      pinned: false,
      muted: false,
      sent: c.last_message_sender_id === userId,
    };
  });
};

// ─── Single conversation (GroupChatScreen) ───────────────────────────────────

/**
 * Fetch a group conversation's name/avatar plus its full member list.
 */
export const getConversationDetails = async (conversationId) => {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id,
      name,
      avatar_url,
      type,
      conversation_members (
        user_id,
        role,
        users ( id, username, full_name, avatar_url, is_online, last_seen )
      )
    `)
    .eq('id', conversationId)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    avatar: data.avatar_url,
    members: (data.conversation_members || []).map(m => m.users).filter(Boolean),
  };
};

/**
 * Fetch messages for a conversation, oldest first, with sender info joined in.
 */
export const getMessages = async (conversationId, limit = 100) => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      message,
      message_type,
      file_url,
      created_at,
      sender_id,
      is_edited,
      is_deleted,
      users!messages_sender_id_fkey ( id, username, full_name, avatar_url )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

/**
 * Insert a new message and update the conversation's last-message preview.
 */
export const sendMessage = async (conversationId, senderId, message) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      message,
      message_type: 'text',
    })
    .select(`
      id, message, message_type, created_at, sender_id,
      users!messages_sender_id_fkey ( id, username, full_name, avatar_url )
    `)
    .single();

  if (error) throw error;

  // Fire-and-forget preview update; don't block the send on this.
  supabase
    .from('conversations')
    .update({
      last_message: message,
      last_message_at: new Date().toISOString(),
      last_message_sender_id: senderId,
    })
    .eq('id', conversationId)
    .then(({ error: updateError }) => {
      if (updateError) console.warn('Failed to update conversation preview', updateError);
    });

  return data;
};

// ─── Realtime: messages ──────────────────────────────────────────────────────

/**
 * Subscribe to new messages in a conversation.
 * `onInsert` receives the raw row (no joined sender info) — the caller is
 * expected to resolve sender_id against a locally-held member map.
 */
export const subscribeToMessages = (conversationId, onInsert) => {
  const channel = supabase
    .channel(`messages-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      payload => onInsert(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
};

// ─── Realtime: typing indicators ─────────────────────────────────────────────

/**
 * Upsert this user's typing state for a conversation.
 * Schema has no unique constraint on (conversation_id, user_id), so we do a
 * manual select-then-update/insert instead of relying on onConflict.
 */
export const setTypingStatus = async (conversationId, userId, isTyping) => {
  try {
    const { data: existing, error: selectError } = await supabase
      .from('typing_indicators')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existing) {
      const { error: updateError } = await supabase
        .from('typing_indicators')
        .update({ is_typing: isTyping, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('typing_indicators')
        .insert({ conversation_id: conversationId, user_id: userId, is_typing: isTyping });
      if (insertError) throw insertError;
    }
  } catch (err) {
    // Typing status is best-effort — never let it break the chat experience.
    console.warn('Failed to set typing status', err);
  }
};

/**
 * Subscribe to typing indicator changes in a conversation.
 * `onChange` receives the raw row: { conversation_id, user_id, is_typing, ... }
 */
export const subscribeToTyping = (conversationId, onChange) => {
  const channel = supabase
    .channel(`typing-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `conversation_id=eq.${conversationId}`,
      },
      payload => onChange(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
};