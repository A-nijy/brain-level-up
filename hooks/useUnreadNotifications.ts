import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService } from '@/services/NotificationService';

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
            const interval = setInterval(loadUnreadCount, 30000); // 30초마다 갱신
            return () => clearInterval(interval);
        }
    }, [user]);

    return { unreadCount, refreshUnreadCount: loadUnreadCount };
}
