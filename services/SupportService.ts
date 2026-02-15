import { supabase } from '@/lib/supabase';
import { Inquiry, InquiryCategory } from '@/types';

export const SupportService = {
    /**
     * 신규 문의사항을 제출합니다.
     */
    async submitInquiry(userId: string, category: InquiryCategory, title: string, content: string): Promise<void> {
        const { error } = await supabase
            .from('inquiries')
            .insert({
                user_id: userId,
                category,
                title,
                content
            });

        if (error) {
            console.error('Error submitting inquiry:', error);
            throw error;
        }
    },

    /**
     * (관리자) 모든 문의사항 목록을 가져옵니다. 
     * 프로필 정보(닉네임, ID코드, 이메일)와 함께 조인하여 가져옵니다.
     */
    async getAllInquiries(): Promise<Inquiry[]> {
        const { data, error } = await supabase
            .from('inquiries')
            .select(`
                *,
                profiles:user_id (
                    nickname,
                    user_id_number,
                    email
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching inquiries list:', error);
            throw error;
        }

        // 데이터 가공 (profiles 객체의 값을 상위 inquiry 객체로 평탄화)
        return (data || []).map((item: any) => ({
            ...item,
            user_nickname: item.profiles?.nickname,
            user_id_number: item.profiles?.user_id_number,
            user_email: item.profiles?.email
        }));
    },

    /**
     * (사용자) 본인이 제출한 문의사항 목록을 확인합니다.
     */
    async getMyInquiries(userId: string): Promise<Inquiry[]> {
        const { data, error } = await supabase
            .from('inquiries')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching my inquiries:', error);
            throw error;
        }
        return data || [];
    },

    /**
     * (관리자) 문의사항의 해결 여부를 전환합니다.
     */
    async toggleInquiryResolved(id: string, isResolved: boolean): Promise<void> {
        const { error } = await supabase
            .from('inquiries')
            .update({ is_resolved: isResolved })
            .eq('id', id);

        if (error) {
            console.error('Error toggling inquiry status:', error);
            throw error;
        }
    }
};
