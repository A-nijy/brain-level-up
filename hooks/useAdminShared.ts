import { useState, useCallback, useEffect } from 'react';
import { SharedLibrary, SharedLibraryCategory } from '@/types';
import { AdminService } from '@/services/AdminService';
import { SharedLibraryService } from '@/services/SharedLibraryService';

export function useAdminShared() {
    const [sharedLibs, setSharedLibs] = useState<SharedLibrary[]>([]);
    const [draftLibs, setDraftLibs] = useState<SharedLibrary[]>([]);
    const [categories, setCategories] = useState<SharedLibraryCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const [sLibs, cats, dLibs] = await Promise.all([
                SharedLibraryService.getSharedLibraries(),
                AdminService.getSharedCategories(),
                AdminService.getDraftSharedLibraries()
            ]);

            setSharedLibs(sLibs);
            setCategories(cats);
            setDraftLibs(dLibs);
            setError(null);
        } catch (err: any) {
            console.error('[useAdminShared] Fetch error:', err);
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

    const updateSharedLibrary = async (id: string, updates: Parameters<typeof AdminService.updateSharedLibrary>[1]) => {
        try {
            await AdminService.updateSharedLibrary(id, updates);
            // Local state update
            setSharedLibs(prev => prev.map(lib => lib.id === id ? { ...lib, ...updates as any } : lib));
            setDraftLibs(prev => prev.map(lib => lib.id === id ? { ...lib, ...updates as any } : lib));
        } catch (err: any) {
            console.error('[useAdminShared] Update error:', err);
            throw err;
        }
    };

    const publishDraft = async (id: string) => {
        try {
            await AdminService.publishDraftSharedLibrary(id);
            await fetchData(true); // Re-fetch to move from draft to shared
        } catch (err: any) {
            console.error('[useAdminShared] Publish error:', err);
            throw err;
        }
    };

    const deleteDraft = async (id: string) => {
        try {
            await AdminService.deleteDraftSharedLibrary(id);
            setDraftLibs(prev => prev.filter(lib => lib.id !== id));
        } catch (err: any) {
            console.error('[useAdminShared] Delete draft error:', err);
            throw err;
        }
    };

    const deleteShared = async (id: string) => {
        try {
            await AdminService.deleteSharedLibrary(id);
            setSharedLibs(prev => prev.filter(lib => lib.id !== id));
        } catch (err: any) {
            console.error('[useAdminShared] Delete shared error:', err);
            throw err;
        }
    };

    const unpublishShared = async (id: string) => {
        try {
            await AdminService.unpublishSharedLibrary(id);
            await fetchData(true); // Re-fetch to move from shared to draft
        } catch (err: any) {
            console.error('[useAdminShared] Unpublish error:', err);
            throw err;
        }
    };

    const createDraft = async (data: Parameters<typeof AdminService.createDraftSharedLibrary>[0]) => {
        try {
            const newDraft = await AdminService.createDraftSharedLibrary(data);
            setDraftLibs(prev => [newDraft, ...prev]);
            return newDraft;
        } catch (err: any) {
            console.error('[useAdminShared] Create draft error:', err);
            throw err;
        }
    };

    return {
        sharedLibs,
        draftLibs,
        categories,
        loading,
        refreshing,
        error,
        refresh,
        updateSharedLibrary,
        publishDraft,
        deleteDraft,
        deleteShared,
        unpublishShared,
        createDraft
    };
}
