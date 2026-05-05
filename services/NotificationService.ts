import { runQuery, runCommand } from '../lib/db';
import { Notification } from '@/types';
import * as Crypto from 'expo-crypto';

/**
 * [Local-First] 알림 기록 관리를 담당하는 서비스
 * SQLite를 직접 사용하도록 리팩토링됨
 */
export const NotificationService = {
    /**
     * 사용자의 알림 목록을 가져옵니다.
     */
    async getNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
        const results = await runQuery(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
            [userId, limit]
        );
        return results as Notification[];
    },

    /**
     * 미확인 알림의 개수를 가져옵니다.
     */
    async getUnreadCount(userId: string): Promise<number> {
        const results = await runQuery(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
            [userId]
        );
        return (results[0] as any).count || 0;
    },

    /**
     * 알림을 읽음 처리합니다.
     */
    async markAsRead(notificationId: string): Promise<void> {
        await runCommand('UPDATE notifications SET is_read = 1 WHERE id = ?', [notificationId]);
    },

    /**
     * 모든 알림을 읽음 처리합니다.
     */
    async markAllAsRead(userId: string): Promise<void> {
        await runCommand('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [userId]);
    },

    /**
     * 새로운 알림을 생성합니다.
     */
    async createNotification(
        userId: string,
        title: string,
        message: string,
        type: 'SYSTEM' | 'STUDY_REMINDER' | 'PROMOTION' = 'SYSTEM',
        data: any = {}
    ): Promise<void> {
        const id = Crypto.randomUUID();
        const now = new Date().toISOString();
        await runCommand(
            'INSERT INTO notifications (id, user_id, title, message, type, is_read, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, userId, title, message, type, 0, JSON.stringify(data), now]
        );
    },

    /**
     * 특정 알림을 삭제합니다.
     */
    async deleteNotification(notificationId: string): Promise<void> {
        await runCommand('DELETE FROM notifications WHERE id = ?', [notificationId]);
    }
};
