import { useState, useCallback, useEffect } from 'react';
import { Inquiry, InquiryCategory } from '@/types';
import { SupportService } from '@/services/SupportService';
import { useAuth } from '@/contexts/AuthContext';

export function useSupport() {
    const { profile } = useAuth();
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchMyInquiries = useCallback(async (isRefresh = false) => {
        if (!profile) return;
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const data = await SupportService.getMyInquiries(profile.id);
            setInquiries(data);
            setError(null);
        } catch (err: any) {
            console.error('[useSupport] Fetch error:', err);
            setError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [profile]);

    const fetchAllInquiries = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const data = await SupportService.getAllInquiries();
            setInquiries(data);
            setError(null);
        } catch (err: any) {
            console.error('[useSupport] Fetch all error:', err);
            setError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const submitInquiry = async (category: InquiryCategory, title: string, content: string) => {
        if (!profile) throw new Error('Authentication required');
        try {
            await SupportService.submitInquiry(profile.id, category, title, content);
            // We might want to re-fetch or optimistically update if we show a list
        } catch (err: any) {
            console.error('[useSupport] Submit error:', err);
            throw err;
        }
    };

    const toggleInquiryResolved = async (id: string, isResolved: boolean) => {
        try {
            await SupportService.toggleInquiryResolved(id, isResolved);
            setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, is_resolved: isResolved } : inq));
        } catch (err: any) {
            console.error('[useSupport] Toggle resolved error:', err);
            throw err;
        }
    };

    return {
        inquiries,
        loading,
        refreshing,
        error,
        fetchMyInquiries,
        fetchAllInquiries,
        submitInquiry,
        toggleInquiryResolved
    };
}
