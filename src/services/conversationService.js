import { supabase } from "../db/supabase";

// Fetch all direct conversations for the logged in user
export const fetchDirectConversations = async (userId) => {
  const { data, error } = await supabase
    .from('conversation_members')
    .select(`
      conversation_id,
      last_read_at,
      conversations!inner (
        id,
        type,
        name,
        avatar_url,
        last_message,
        last_message_at,
        last_message_sender_id
      )
    `)
    .eq('user_id', userId)
    .eq('conversations.type', 'direct')
    .is('deleted_at', null)
    .order('conversation_id', { ascending: false });

  if (error) throw error;
  return data;
};

// Fetch the other participant's info for direct chats
export const fetchDirectChatUser = async (conversationId, currentUserId) => {
  const { data, error } = await supabase
    .from('conversation_members')
    .select(`
      user_id,
      users (
        id,
        full_name,
        username,
        avatar_url,
        is_online,
        last_seen
      )
    `)
    .eq('conversation_id', conversationId)
    .neq('user_id', currentUserId)
    .single();

  if (error) throw error;
  return data?.users;
};

// Get unread count for a conversation
export const fetchUnreadCount = async (conversationId, userId, lastReadAt) => {
  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .gt('created_at', lastReadAt);

  if (error) throw error;
  return count ?? 0;
};

export const markConversationAsRead = async (conversationId, userId) => {
  const { error } = await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) throw error;
};



/**
 * Returns all users except the current user and anyone the current user
 * already has a direct conversation with.
 */
export const fetchAvailableUsers = async (currentUserId) => {
  // Direct conversation IDs the current user belongs to
  const { data: myConvos, error: myConvosError } = await supabase
    .from('conversation_members')
    .select('conversation_id, conversations!inner(type)')
    .eq('user_id', currentUserId)
    .eq('conversations.type', 'direct')
    .is('deleted_at', null);

  if (myConvosError) throw myConvosError;

  const myConvoIds = (myConvos || []).map((c) => c.conversation_id);

  let excludeUserIds = [];
  if (myConvoIds.length > 0) {
    const { data: members, error: membersError } = await supabase
      .from('conversation_members')
      .select('user_id')
      .in('conversation_id', myConvoIds)
      .neq('user_id', currentUserId);

    if (membersError) throw membersError;
    excludeUserIds = (members || []).map((m) => m.user_id);
  }

  let query = supabase
    .from('users')
    .select('id, username, full_name, avatar_url, bio, is_online')
    .neq('id', currentUserId)
    .order('full_name', { ascending: true });

  if (excludeUserIds.length > 0) {
    query = query.not('id', 'in', `(${excludeUserIds.join(',')})`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};


/**
 * Creates a direct conversation between currentUserId and otherUser, OR
 * revives a previously-deleted one if it already exists (avoids duplicates
 * when a user re-adds someone they'd deleted before).
 */
export const createDirectConversation = async (currentUserId, otherUser) => {
  // 1. Check if ANY direct conversation already exists between these two users
  //    (including ones the current user had previously deleted)
  const { data: myConvos, error: myConvosError } = await supabase
    .from('conversation_members')
    .select('conversation_id, conversations!inner(type)')
    .eq('user_id', currentUserId)
    .eq('conversations.type', 'direct');

  if (myConvosError) throw myConvosError;

  const myConvoIds = (myConvos || []).map((c) => c.conversation_id);

  if (myConvoIds.length > 0) {
    const { data: sharedConvo, error: sharedError } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', otherUser.id)
      .in('conversation_id', myConvoIds)
      .maybeSingle();

    if (sharedError) throw sharedError;

    if (sharedConvo) {
      // 2. Conversation already exists — just un-hide it for the current user
      const { error: reviveError } = await supabase
        .from('conversation_members')
        .update({ deleted_at: null })
        .eq('conversation_id', sharedConvo.conversation_id)
        .eq('user_id', currentUserId);

      if (reviveError) throw reviveError;

      const { data: existingConvo, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', sharedConvo.conversation_id)
        .single();

      if (fetchError) throw fetchError;

      return {
        id: existingConvo.id,
        type: existingConvo.type,
        name: otherUser.full_name,
        avatar_url: otherUser.avatar_url,
      };
    }
  }

  // 3. No existing conversation at all — create fresh
  const { data: newConvo, error: createError } = await supabase
    .from('conversations')
    .insert({ type: 'direct', created_by: currentUserId })
    .select()
    .single();

  if (createError) throw createError;

  const { error: membersError } = await supabase
    .from('conversation_members')
    .insert([
      { conversation_id: newConvo.id, user_id: currentUserId },
      { conversation_id: newConvo.id, user_id: otherUser.id },
    ]);

  if (membersError) throw membersError;

  return {
    id: newConvo.id,
    type: newConvo.type,
    name: otherUser.full_name,
    avatar_url: otherUser.avatar_url,
  };
};


export const deleteConversationForUser = async (conversationId, userId) => {
  const { error } = await supabase
    .from('conversation_members')
    .update({ deleted_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) throw error;
};