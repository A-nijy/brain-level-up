import { useState, useCallback, useEffect, useMemo } from 'react';
import { StudyLog } from '@/types';
import { StatsService } from '@/services/StatsService';
import { useAuth } from '@/contexts/AuthContext';

export function useStudyStats() {
    const { profile } = useAuth();
    const [stats, setStats] = useState<StudyLog[]>([]);
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (!profile) return;

        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const [statsData, streakData] = await Promise.all([
                StatsService.getRecentStats(profile.id, 7),
                StatsService.getStudyStreak(profile.id)
            ]);

            setStats(statsData);
            setStreak(streakData);
            setError(null);
        } catch (err: any) {
            console.error('[useStudyStats] Fetch error:', err);
            setError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [profile]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refresh = () => fetchData(true);

    const totals = useMemo(() => {
        const totalItems = stats.reduce((acc, curr) => acc + curr.items_count, 0);
        const totalCorrect = stats.reduce((acc, curr) => acc + curr.correct_count, 0);
        const avgAccuracy = totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : 0;
        const totalMinutes = Math.round(stats.reduce((acc, curr) => acc + curr.study_time_seconds, 0) / 60);

        return {
            totalItems,
            totalCorrect,
            avgAccuracy,
            totalMinutes
        };
    }, [stats]);

    const chartData = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().split('T')[0];
            const log = stats.find(s => s.study_date === dateStr);
            return {
                label: d.toLocaleDateString('ko-KR', { weekday: 'short' }),
                value: log ? log.items_count : 0,
                fullDate: dateStr
            };
        });
    }, [stats]);

    return {
        stats,
        streak,
        loading,
        refreshing,
        error,
        totals,
        chartData,
        refresh
    };
}
