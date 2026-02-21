import { supabase } from '@/lib/supabase';
import { Notification } from '@/types';

export const NotificationService = {
    /**
     * 사용자의 알림 목록을 가져옵니다.
     */
    async getNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    /**
     * 미확인 알림의 개수를 가져옵니다.
     */
    async getUnreadCount(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return count || 0;
    },

    /**
     * 알림을 읽음 처리합니다.
     */
    async markAsRead(notificationId: string): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) throw error;
    },

    /**
     * 모든 알림을 읽음 처리합니다.
     */
    async markAllAsRead(userId: string): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
    },

    /**
     * 새로운 알림을 생성합니다 (시스템/자동화용).
     */
    async createNotification(
        userId: string,
        title: string,
        message: string,
        type: 'SYSTEM' | 'STUDY_REMINDER' | 'PROMOTION' = 'SYSTEM',
        data: any = {}
    ): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                title,
                message,
                type,
                data
            });

        if (error) throw error;
    },

    /**
     * 특정 알림을 삭제합니다.
     */
    async deleteNotification(notificationId: string): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) throw error;
    }
};
