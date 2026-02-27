import { supabase } from '@/lib/supabase';

export const AdminNotificationService = {
    /**
     * 모든 사용자에게 알림 발송 (관리자 전용)
     */
    async broadcastNotification(title: string, message: string, type: string = 'SYSTEM') {
        try {
            console.log('[AdminNotificationService] Starting broadcast:', { title, message });

            const { data: users, error: userError } = await supabase
                .from('profiles')
                .select('id');

            if (userError) throw userError;
            if (!users || users.length === 0) return;

            const notifications = users.map(user => ({
                user_id: user.id,
                title,
                message,
                type,
                is_read: false,
            }));

            const { error: insertError } = await supabase
                .from('notifications')
                .insert(notifications);

            if (insertError) throw insertError;
            console.log('[AdminNotificationService] Broadcast completed.');
        } catch (error) {
            console.error('[AdminNotificationService] Broadcast Error:', error);
            throw error;
        }
    },

    /**
     * 특정 사용자 이메일로 알림 단일 발송 (관리자 전용)
     */
    async sendNotificationToUser(email: string, title: string, message: string, type: string = 'SYSTEM') {
        try {
            console.log(`[AdminNotificationService] Sending notification to ${email}:`, { title, message });

            const { data: user, error: userError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single();

            if (userError || !user) {
                throw new Error('해당 이메일을 가진 사용자를 찾을 수 없습니다.');
            }

            const { error: insertError } = await supabase
                .from('notifications')
                .insert({
                    user_id: user.id,
                    title,
                    message,
                    type,
                    is_read: false,
                });

            if (insertError) throw insertError;
            console.log(`[AdminNotificationService] Notification sent to ${email} successfully.`);
        } catch (error) {
            console.error('[AdminNotificationService] Send Notification Error:', error);
            throw error;
        }
    },
};
