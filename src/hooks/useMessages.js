import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../db/supabase';
import { fetchMessages } from '../services/messageService';

const useMessages = (conversationId, userId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      setLoading(true);
      setError(null);

      const rawData = await fetchMessages(conversationId);

      const formatted = rawData.map((row) => ({
        id: row.id,
        type: row.message_type, // 'text' | 'image' | 'voice' | etc.
        text: row.message,
        image: row.message_type === 'image' ? row.file_url : null,
        fileUrl: row.file_url,
        isOwn: row.sender_id === userId,
        senderId: row.sender_id,
        senderName: row.sender?.full_name,
        senderAvatar: row.sender?.avatar_url,
        isEdited: row.is_edited,
        isDeleted: row.is_deleted,
        replyTo: row.reply_to
          ? {
              id: row.reply_to.id,
              text: row.reply_to.message,
              type: row.reply_to.message_type,
            }
          : null,
        time: new Date(row.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        createdAt: row.created_at,
      }));

      setMessages(formatted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [conversationId, userId]);

  useEffect(() => {
    if (!conversationId) return;

    loadMessages();

    const channel = supabase
      .channel(`messages_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          loadMessages();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, loadMessages]);

  return { messages, loading, error, refetch: loadMessages };
};

export default useMessages;