import { supabase } from '@/lib/supabase';
import { StudyLog } from '@/types';

export const StatsService = {
    /**
     * 오늘의 학습 내역을 기록하거나 업데이트합니다.
     */
    async logStudyActivity(
        userId: string,
        itemsCount: number,
        correctCount: number,
        timeInSeconds: number
    ): Promise<void> {
        const today = new Date().toISOString().split('T')[0];

        // 1. 기존 데이터 확인 (upsert를 위해 필요하지만 supabase upsert는 제약조건 기반으로 작동함)
        const { data: existing, error: fetchError } = await supabase
            .from('study_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('study_date', today)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching study logs:', fetchError);
            return;
        }

        if (existing) {
            // 업데이트
            const { error: updateError } = await supabase
                .from('study_logs')
                .update({
                    items_count: (existing.items_count || 0) + itemsCount,
                    correct_count: (existing.correct_count || 0) + correctCount,
                    study_time_seconds: (existing.study_time_seconds || 0) + timeInSeconds
                })
                .eq('id', existing.id);

            if (updateError) throw updateError;
        } else {
            // 새로 추가
            const { error: insertError } = await supabase
                .from('study_logs')
                .insert({
                    user_id: userId,
                    study_date: today,
                    items_count: itemsCount,
                    correct_count: correctCount,
                    study_time_seconds: timeInSeconds
                });

            if (insertError) throw insertError;
        }
    },

    /**
     * 최근 N일간의 통계를 가져옵니다.
     */
    async getRecentStats(userId: string, days: number = 7): Promise<StudyLog[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('study_logs')
            .select('*')
            .eq('user_id', userId)
            .gte('study_date', startDateStr)
            .order('study_date', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * 현재 학습 스트릭(Streak)을 계산합니다.
     */
    async getStudyStreak(userId: string): Promise<number> {
        const { data, error } = await supabase
            .from('study_logs')
            .select('study_date')
            .eq('user_id', userId)
            .order('study_date', { ascending: false });

        if (error || !data || data.length === 0) return 0;

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // 오늘 기록이 있는지 먼저 확인
        let lastDateInLog = new Date(data[0].study_date);
        lastDateInLog.setHours(0, 0, 0, 0);

        // 마지막 학습이 어제나 오늘이 아니면 스트릭은 0
        const diffInDays = Math.floor((currentDate.getTime() - lastDateInLog.getTime()) / (1000 * 3600 * 24));
        if (diffInDays > 1) return 0;

        for (let i = 0; i < data.length; i++) {
            let logDate = new Date(data[i].study_date);
            logDate.setHours(0, 0, 0, 0);

            // 예상되는 날짜 계산
            let expectedDate = new Date(currentDate);
            expectedDate.setDate(expectedDate.getDate() - i);

            // 만약 오늘 기록이 없고 어제부터 시작한다면 하나씩 뒤로 밀림
            if (diffInDays === 1) {
                expectedDate.setDate(expectedDate.getDate() - 1);
            }

            if (logDate.getTime() === expectedDate.getTime()) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    },

    /**
     * 모든 암기장 또는 특정 암기장의 학습 상태(외움/헷갈림/미정) 분포를 가져옵니다.
     */
    async getStudyDistribution(userId: string, libraryId?: string): Promise<{
        learned: number;
        confused: number;
        undecided: number;
        total: number;
    }> {
        let query = supabase
            .from('items')
            .select('study_status, count', { count: 'exact' })
            .eq('library_id__user_id', userId); // RPC 또는 조인이 필요할 수 있음. 하지만 items에는 user_id가 직접 없을 수 있으므로 라이브러리 필터링이 필요함.

        // 실제 스키마 확인: items 테이블에는 library_id가 있고, libraries 테이블에는 user_id가 있음.
        // Supabase에서 직접 조인 필터링을 하거나, library_ids를 먼저 가져와야 함.

        const { data: libs } = await supabase.from('libraries').select('id').eq('user_id', userId);
        const libIds = libs?.map(l => l.id) || [];

        if (libIds.length === 0) return { learned: 0, confused: 0, undecided: 0, total: 0 };

        let finalQuery = supabase
            .from('items')
            .select('study_status');

        if (libraryId) {
            finalQuery = finalQuery.eq('library_id', libraryId);
        } else {
            finalQuery = finalQuery.in('library_id', libIds);
        }

        const { data, error } = await finalQuery;

        if (error) throw error;

        const distribution = {
            learned: 0,
            confused: 0,
            undecided: 0,
            total: data?.length || 0
        };

        data?.forEach(item => {
            if (item.study_status === 'learned') distribution.learned++;
            else if (item.study_status === 'confused') distribution.confused++;
            else distribution.undecided++;
        });

        return distribution;
    },

    /**
     * 월간 학습 활동 기록을 가져옵니다 (캘린더용).
     */
    async getMonthlyActivity(userId: string, year: number, month: number): Promise<string[]> {
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('study_logs')
            .select('study_date')
            .eq('user_id', userId)
            .gte('study_date', startDate)
            .lte('study_date', endDate);

        if (error) throw error;
        return data?.map(log => log.study_date) || [];
    }
};
