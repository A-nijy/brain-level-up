import { supabase } from '@/lib/supabase';
import { Notice } from '@/types';

export const NoticeService = {
    /**
     * 공지사항 목록을 가져옵니다. (중요 공지 우선, 최신순)
     */
    async getNotices(): Promise<Notice[]> {
        const { data, error } = await supabase
            .from('notices')
            .select('*')
            .order('is_important', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notices:', error);
            throw error;
        }
        return data || [];
    },

    /**
     * 특정 공지사항 상세 정보를 가져옵니다.
     */
    async getNoticeById(id: string): Promise<Notice | null> {
        const { data, error } = await supabase
            .from('notices')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching notice detail:', error);
            throw error;
        }
        return data;
    },

    /**
     * (관리자) 신규 공지사항을 작성합니다.
     */
    async createNotice(notice: Omit<Notice, 'id' | 'created_at' | 'updated_at'>): Promise<Notice> {
        const { data, error } = await supabase
            .from('notices')
            .insert(notice)
            .select()
            .single();

        if (error) {
            console.error('Error creating notice:', error);
            throw error;
        }
        return data;
    },

    /**
     * (관리자) 공지사항을 수정합니다.
     */
    async updateNotice(id: string, updates: Partial<Omit<Notice, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
        const { error } = await supabase
            .from('notices')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating notice:', error);
            throw error;
        }
    },

    /**
     * (관리자) 공지사항을 삭제합니다.
     */
    async deleteNotice(id: string): Promise<void> {
        const { error } = await supabase
            .from('notices')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting notice:', error);
            throw error;
        }
    }
};
