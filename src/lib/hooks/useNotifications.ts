import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
      setupRealtimeSubscription();
    } else {
      resetNotifications();
    }
  }, [user]);

  const resetNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    setLoading(false);
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const { data: userNotifications, error: notificationsError } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', user?.id)
        .eq('type', 'notifications')
        .single();

      if (notificationsError && notificationsError.code !== 'PGRST116') {
        throw notificationsError;
      }

      const savedNotifications = userNotifications?.data?.notifications || [];
      setNotifications(savedNotifications);
      updateUnreadCount(savedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const setupRealtimeSubscription = useCallback(() => {
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_data',
        filter: `user_id=eq.${user?.id} AND type=eq.notifications`
      }, payload => {
        if (payload.new) {
          loadNotifications();
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, loadNotifications]);

  const updateUnreadCount = useCallback((notifs: Notification[]) => {
    const count = notifs.filter(n => !n.read).length;
    setUnreadCount(count);
  }, []);

  const modifyNotifications = useCallback(async (updatedNotifications: Notification[]) => {
    await supabase
      .from('user_data')
      .upsert({
        user_id: user.id,
        type: 'notifications',
        data: { notifications: updatedNotifications },
        updated_at: new Date().toISOString()
      });

    setNotifications(updatedNotifications);
    updateUnreadCount(updatedNotifications);
  }, [user, updateUnreadCount]);

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    if (!user) return;

    try {
      const newNotification: Notification = {
        id: crypto.randomUUID(),
        ...notification,
        read: false,
        createdAt: new Date().toISOString()
      };

      const updatedNotifications = [newNotification, ...notifications];
      await modifyNotifications(updatedNotifications);

      return { success: true };
    } catch (error) {
      console.error('Error adding notification:', error);
      throw error;
    }
  }, [user, notifications, modifyNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const updatedNotifications = notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );

      await modifyNotifications(updatedNotifications);
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }, [user, notifications, modifyNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      await modifyNotifications(updatedNotifications);
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }, [user, notifications, modifyNotifications]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      await modifyNotifications(updatedNotifications);
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }, [user, notifications, modifyNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
}