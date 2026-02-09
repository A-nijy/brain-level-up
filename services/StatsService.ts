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
    }
};
