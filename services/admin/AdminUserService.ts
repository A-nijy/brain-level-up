import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';

export const AdminUserService = {
    /**
     * 전체 사용자 목록 조회 (관리자 전용)
     */
    async getAllUsers(): Promise<Profile[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * 사용자의 역할(role) 또는 멤버십 레벨 변경
     */
    async updateUserProfile(userId: string, updates: Partial<Profile>): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) throw error;
    },

    /**
     * 특정 사용자의 상세 정보 및 활동 내역 조회
     */
    async getUserDetail(userId: string) {
        const { data: profile, error: pError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (pError) throw pError;

        const { count: libraryCount } = await supabase
            .from('libraries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        const { data: recentLogs } = await supabase
            .from('study_logs')
            .select('*')
            .eq('user_id', userId)
            .order('study_date', { ascending: false })
            .limit(10);

        return {
            profile,
            libraryCount: libraryCount || 0,
            recentLogs: recentLogs || []
        };
    },

    /**
     * DAU 상세 내역 (오늘 접속한 사용자 목록)
     */
    async getDauDetails() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('app_logs')
            .select(`
                user_id,
                created_at,
                profiles:user_id (email, membership_level)
            `)
            .eq('event_type', 'app_open')
            .gte('created_at', today.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 중복 제거 (가장 최근 접속 기록만)
        const uniqueUsers = new Map();
        data?.forEach((log: any) => {
            if (!uniqueUsers.has(log.user_id)) {
                uniqueUsers.set(log.user_id, {
                    id: log.user_id,
                    email: log.profiles?.email || 'Unknown',
                    membership: log.profiles?.membership_level || 'BASIC',
                    last_access: log.created_at
                });
            }
        });

        return Array.from(uniqueUsers.values());
    },

    /**
     * 신규 가입자 상세 내역 (최근 N일)
     */
    async getSignupDetails(days = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('profiles')
            .select('id, email, membership_level, created_at')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },
};
