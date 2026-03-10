import { useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService } from '@/services/NotificationService';
import { Events } from '@/constants/Events';

export function useUnreadNotifications() {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const loadUnreadCount = async () => {
        if (!user) return;
        try {
            const count = await NotificationService.getUnreadCount(user.id);
            setUnreadCount(count);
        } catch (e) {
            console.error('[useUnreadNotifications] Error loading count:', e);
        }
    };

    useEffect(() => {
        if (user) {
            loadUnreadCount();

            // Listen for immediate refresh requests
            const subscription = DeviceEventEmitter.addListener(Events.NOTIFICATIONS_REFRESH, loadUnreadCount);

            const interval = setInterval(loadUnreadCount, 30000); // 30s fallback

            return () => {
                subscription.remove();
                clearInterval(interval);
            };
        }
    }, [user]);

    return { unreadCount, refreshUnreadCount: loadUnreadCount };
}
