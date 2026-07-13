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
    .order('conversation_id', { ascending: false });

  if (error) throw error;
  return data;
};

export const fetchGroupConversations = async (userId) => {
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
    .eq('conversations.type', 'group')
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