import { useState, useCallback, useEffect } from 'react';
import { Notice } from '@/types';
import { NoticeService } from '@/services/NoticeService';

export function useNotices() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const [notice, setNotice] = useState<Notice | null>(null);

    const fetchData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const data = await NoticeService.getNotices();
            setNotices(data);
            setError(null);
        } catch (err: any) {
            console.error('[useNotices] Fetch error:', err);
            setError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const fetchNoticeById = useCallback(async (id: string) => {
        try {
            setLoading(true);
            const data = await NoticeService.getNoticeById(id);
            setNotice(data);
            setError(null);
            return data;
        } catch (err: any) {
            console.error('[useNotices] GetByID error:', err);
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refresh = () => fetchData(true);

    // Admin operations
    const createNotice = async (noticeData: Omit<Notice, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const newNotice = await NoticeService.createNotice(noticeData);
            setNotices(prev => [newNotice, ...prev]);
            return newNotice;
        } catch (err: any) {
            console.error('[useNotices] Create error:', err);
            throw err;
        }
    };

    const updateNotice = async (id: string, updates: Partial<Omit<Notice, 'id' | 'created_at' | 'updated_at'>>) => {
        try {
            await NoticeService.updateNotice(id, updates);
            setNotices(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
        } catch (err: any) {
            console.error('[useNotices] Update error:', err);
            throw err;
        }
    };

    const deleteNotice = async (id: string) => {
        try {
            await NoticeService.deleteNotice(id);
            setNotices(prev => prev.filter(n => n.id !== id));
        } catch (err: any) {
            console.error('[useNotices] Delete error:', err);
            throw err;
        }
    };

    return {
        notices,
        notice,
        loading,
        refreshing,
        error,
        refresh,
        fetchNoticeById,
        createNotice,
        updateNotice,
        deleteNotice
    };
}
