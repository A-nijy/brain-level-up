import { runQuery, runCommand } from '../lib/db';
import { Inquiry, InquiryCategory } from '@/types';
import * as Crypto from 'expo-crypto';

/**
 * [Local-First] 고객 지원 및 문의사항 관리를 담당하는 서비스
 * SQLite를 직접 사용하도록 리팩토링됨
 */
export const SupportService = {
    /**
     * 신규 문의사항을 제출합니다.
     */
    async submitInquiry(userId: string, category: InquiryCategory, title: string, content: string): Promise<void> {
        const id = Crypto.randomUUID();
        const now = new Date().toISOString();
        
        await runCommand(
            'INSERT INTO inquiries (id, user_id, category, title, content, is_resolved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, userId, category, title, content, 0, now]
        );
        
        // 참고: 로컬 버전에서는 서버로 전송되지 않으므로, 추후 이메일 전송 로직 등을 추가할 수 있음
        console.log('[SupportService] Inquiry saved locally:', id);
    },

    /**
     * 모든 문의사항 목록을 가져옵니다.
     */
    async getAllInquiries(): Promise<Inquiry[]> {
        const results = await runQuery(`
            SELECT i.*, p.nickname as user_nickname, p.user_id_number, p.email as user_email
            FROM inquiries i
            LEFT JOIN profiles p ON i.user_id = p.id
            ORDER BY i.created_at DESC
        `);
        return results as Inquiry[];
    },

    /**
     * 본인이 제출한 문의사항 목록을 확인합니다.
     */
    async getMyInquiries(userId: string): Promise<Inquiry[]> {
        const results = await runQuery(
            'SELECT * FROM inquiries WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return results as Inquiry[];
    },

    /**
     * 문의사항의 해결 여부를 전환합니다.
     */
    async toggleInquiryResolved(id: string, isResolved: boolean): Promise<void> {
        await runCommand('UPDATE inquiries SET is_resolved = ? WHERE id = ?', [isResolved ? 1 : 0, id]);
    },

    /**
     * 문의사항을 삭제합니다.
     */
    async deleteInquiry(id: string): Promise<void> {
        await runCommand('DELETE FROM inquiries WHERE id = ?', [id]);
    }
};
