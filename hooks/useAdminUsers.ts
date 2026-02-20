import { useState, useCallback, useEffect } from 'react';
import { AdminService } from '@/services/AdminService';
import { Profile } from '@/types';

export function useAdminUsers() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchUsers = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const data = await AdminService.getAllUsers();
            setUsers(data);
            setError(null);
        } catch (err: any) {
            console.error('[useAdminUsers] Fetch error:', err);
            setError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const updateUserProfile = async (id: string, updates: Partial<Profile>) => {
        try {
            await AdminService.updateUserProfile(id, updates);
            setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
        } catch (err: any) {
            console.error('[useAdminUsers] Update error:', err);
            throw err;
        }
    };

    return {
        users,
        loading,
        refreshing,
        error,
        refresh: () => fetchUsers(true),
        updateUserProfile
    };
}
