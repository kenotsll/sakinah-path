import { useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'reminder' | 'achievement' | 'info';
  read: boolean;
  created_at: string;
}

export const useRealtimeNotifications = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch notifications from database
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data as AppNotification[];
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notification-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Realtime notification change:', payload);
          // Invalidate the query to trigger a refetch
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user?.id]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    }
  };

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
  };
};
