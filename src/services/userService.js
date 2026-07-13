import { supabase } from '../db/supabase';

// Mark user online (called on login / app foreground)
export const setUserOnline = async (userId) => {
  if (!userId) return;

  const { error } = await supabase
    .from('users')
    .update({ is_online: true })
    .eq('id', userId);

  if (error) console.error('Failed to set user online:', error.message);
};

// Mark user offline + record last_seen (called on logout / app background/exit)
export const setUserOffline = async (userId) => {
  if (!userId) return;

  const { error } = await supabase
    .from('users')
    .update({
      is_online: false,
      last_seen: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) console.error('Failed to set user offline:', error.message);
};