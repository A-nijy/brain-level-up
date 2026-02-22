import { useState, useCallback, useEffect } from 'react';
import { AdminService } from '@/services/AdminService';

export function useAdminStats() {
    const [stats, setStats] = useState<any>(null);
    const [advancedStats, setAdvancedStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchStats = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const [basic, advanced] = await Promise.all([
                AdminService.getGlobalStats(),
                AdminService.getAdvancedStats()
            ]);

            setStats(basic);
            setAdvancedStats(advanced);
            setError(null);
        } catch (err: any) {
            console.error('[useAdminStats] Fetch error:', err);
            setError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const broadcastNotification = async (title: string, message: string) => {
        try {
            await AdminService.broadcastNotification(title, message);
        } catch (err: any) {
            console.error('[useAdminStats] Broadcast error:', err);
            throw err;
        }
    };

    const sendDirectNotification = async (email: string, title: string, message: string) => {
        try {
            await AdminService.sendNotificationToUser(email, title, message);
        } catch (err: any) {
            console.error('[useAdminStats] Direct notification error:', err);
            throw err;
        }
    };

    return {
        stats,
        advancedStats,
        loading,
        refreshing,
        error,
        refresh: () => fetchStats(true),
        broadcastNotification,
        sendDirectNotification
    };
}
