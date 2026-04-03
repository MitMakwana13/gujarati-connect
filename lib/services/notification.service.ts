import { supabase } from '@/lib/supabase';
import { useAppStore, Notification } from '@/lib/store';

export const NotificationService = {
  subscribeToNotifications(userId: string) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          useAppStore.getState().addNotification(payload.new as Notification);
        }
      )
      .subscribe();
  },

  async fetchNotifications() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) {
      useAppStore.getState().setNotifications(data as Notification[]);
    }
  },

  async markAsRead() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    useAppStore.getState().markNotificationsRead();
  },
};
