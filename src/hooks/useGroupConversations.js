import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../db/supabase';
import {
  fetchGroupConversations,
  fetchUnreadCount,
} from '../services/conversationService';

const useGroupConversations = (userId) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);

      const rawData = await fetchGroupConversations(userId);

      // Build enriched conversation list
      const enriched = await Promise.all(
        rawData.map(async (item) => {
          const convo = item.conversations;

          const unreadCount = await fetchUnreadCount(
            convo.id,
            userId,
            item.last_read_at,
          );

          const isSentByMe = convo.last_message_sender_id === userId;

          return {
            id: convo.id,
            type: convo.type,
            name: convo.name,
            avatar_url: convo.avatar_url,
            last_message: convo.last_message,
            last_message_at: convo.last_message_at,
            unread: unreadCount,
            sent: isSentByMe,
          };
        }),
      );

      // Sort by last message time
      enriched.sort(
        (a, b) => new Date(b.last_message_at) - new Date(a.last_message_at),
      );

      setConversations(enriched);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    loadConversations();

    const channel = supabase
      .channel('group_conversations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          loadConversations();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadConversations();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadConversations]);

  return { conversations, loading, error, refetch: loadConversations };
};

export default useGroupConversations;