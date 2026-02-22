import { useState, useCallback, useEffect, useMemo } from 'react';
import { StudyLog } from '@/types';
import { StatsService } from '@/services/StatsService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Library, Item } from '@/types';

export function useStudyStats() {
    const { profile } = useAuth();
    const [stats, setStats] = useState<StudyLog[]>([]);
    const [streak, setStreak] = useState(0);
    const [overallDistribution, setOverallDistribution] = useState({ learned: 0, confused: 0, undecided: 0, total: 0 });
    const [libraryDistributions, setLibraryDistributions] = useState<{ libraryId: string, title: string, learned: number, confused: number, undecided: number, total: number }[]>([]);
    const [activities, setActivities] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (!profile) return;

        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const now = new Date();
            const [statsData, streakData, distributionData, monthlyActivity] = await Promise.all([
                StatsService.getRecentStats(profile.id, 7),
                StatsService.getStudyStreak(profile.id),
                StatsService.getStudyDistribution(profile.id),
                StatsService.getMonthlyActivity(profile.id, now.getFullYear(), now.getMonth() + 1)
            ]);

            setStats(statsData);
            setStreak(streakData);
            setOverallDistribution(distributionData);
            setActivities(monthlyActivity);

            // 암기장별 분포 가져오기
            const { data: libs } = await supabase.from('libraries').select('id, title').eq('user_id', profile.id);
            if (libs && libs.length > 0) {
                const libDists = await Promise.all(libs.map(async (lib: { id: string, title: string }) => {
                    const dist = await StatsService.getStudyDistribution(profile.id, lib.id);
                    return { libraryId: lib.id, title: lib.title, ...dist };
                }));
                setLibraryDistributions(libDists);
            }

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
        const totalItems = stats.reduce((acc: number, curr: StudyLog) => acc + curr.items_count, 0);
        const totalCorrect = stats.reduce((acc: number, curr: StudyLog) => acc + curr.correct_count, 0);
        const avgAccuracy = totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : 0;
        const totalMinutes = Math.round(stats.reduce((acc: number, curr: StudyLog) => acc + curr.study_time_seconds, 0) / 60);

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
            const log = stats.find((s: StudyLog) => s.study_date === dateStr);
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
        overallDistribution,
        libraryDistributions,
        activities,
        refresh
    };
}
