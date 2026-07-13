import { supabase } from '../db/supabase';

// Fetch all messages for a conversation, with sender info and reply preview
export const fetchMessages = async (conversationId) => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      conversation_id,
      message,
      message_type,
      file_url,
      reply_to_id,
      sender_id,
      is_edited,
      is_deleted,
      created_at,
      sender:sender_id ( id, full_name, avatar_url ),
      reply_to:reply_to_id ( id, full_name, avatar_url )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

// Send a new message
export const sendMessage = async ({
  conversationId,
  senderId,
  message = null,
  messageType = 'text',
  fileUrl = null,
  replyToId = null,
}) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      message,
      message_type: messageType,
      file_url: fileUrl,
      reply_to_id: replyToId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Edit an existing message
export const editMessage = async (messageId, newText) => {
  const { data, error } = await supabase
    .from('messages')
    .update({ message: newText, is_edited: true })
    .eq('id', messageId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Soft-delete a message
export const deleteMessage = async (messageId) => {
  const { data, error } = await supabase
    .from('messages')
    .update({ is_deleted: true, message: null, file_url: null })
    .eq('id', messageId)
    .select()
    .single();

  if (error) throw error;
  return data;
};