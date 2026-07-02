import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../db/supabase';
import {
  fetchConversations,
  fetchDirectChatUser,
  fetchUnreadCount,
} from '../services/conversationService';

const useConversations = (userId) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);

      const rawData = await fetchConversations(userId);

      // Build enriched conversation list
      const enriched = await Promise.all(
        rawData.map(async (item) => {
          const convo = item.conversations;

          let displayName = convo.name;
          let avatarUrl = convo.avatar_url;
          let isOnline = false;
          let otherUserId = null;

          // For direct chats fetch the other user's info
          if (convo.type === 'direct') {
            const otherUser = await fetchDirectChatUser(convo.id, userId);
            if (otherUser) {
              displayName = otherUser.full_name;
              avatarUrl = otherUser.avatar_url;
              isOnline = otherUser.is_online;
              otherUserId = otherUser.id;
            }
          }

          const unreadCount = await fetchUnreadCount(
            convo.id,
            userId,
            item.last_read_at,
          );

          const isSentByMe = convo.last_message_sender_id === userId;

          return {
            id: convo.id,
            type: convo.type,
            name: displayName,
            avatar_url: avatarUrl,
            last_message: convo.last_message,
            last_message_at: convo.last_message_at,
            is_online: isOnline,
            unread: unreadCount,
            sent: isSentByMe,
            other_user_id: otherUserId,
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
      .channel('conversations_changes')
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

export default useConversations;