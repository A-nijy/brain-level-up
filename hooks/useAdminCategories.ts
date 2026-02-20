import { useState, useCallback, useEffect } from 'react';
import { SharedLibraryCategory } from '@/types';
import { AdminService } from '@/services/AdminService';

export function useAdminCategories() {
    const [categories, setCategories] = useState<SharedLibraryCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const data = await AdminService.getSharedCategories();
            setCategories(data);
            setError(null);
        } catch (err: any) {
            console.error('[useAdminCategories] Fetch error:', err);
            setError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refresh = () => fetchData(true);

    const createCategory = async (title: string) => {
        try {
            const newCat = await AdminService.createSharedCategory(title);
            setCategories(prev => [...prev, newCat]);
            return newCat;
        } catch (err: any) {
            console.error('[useAdminCategories] Create error:', err);
            throw err;
        }
    };

    const updateCategory = async (id: string, updates: { title?: string; display_order?: number }) => {
        try {
            await AdminService.updateSharedCategory(id, updates);
            setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat));
        } catch (err: any) {
            console.error('[useAdminCategories] Update error:', err);
            throw err;
        }
    };

    const deleteCategory = async (id: string) => {
        try {
            await AdminService.deleteSharedCategory(id);
            setCategories(prev => prev.filter(cat => cat.id !== id));
        } catch (err: any) {
            console.error('[useAdminCategories] Delete error:', err);
            throw err;
        }
    };

    const reorderCategories = async (updates: { id: string; display_order: number }[]) => {
        const originalCategories = [...categories];

        // Optimistic update
        const newCategories = [...categories].sort((a, b) => {
            const orderA = updates.find(u => u.id === a.id)?.display_order ?? a.display_order;
            const orderB = updates.find(u => u.id === b.id)?.display_order ?? b.display_order;
            return orderA - orderB;
        });
        setCategories(newCategories);

        try {
            await AdminService.reorderSharedCategories(updates);
        } catch (err: any) {
            console.error('[useAdminCategories] Reorder error:', err);
            setCategories(originalCategories); // Rollback
            throw err;
        }
    };

    return {
        categories,
        loading,
        refreshing,
        error,
        refresh,
        createCategory,
        updateCategory,
        deleteCategory,
        reorderCategories
    };
}
