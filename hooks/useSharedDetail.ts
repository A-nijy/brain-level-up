import { useState, useCallback, useEffect } from 'react';
import { SharedLibrary, SharedSection, SharedItem } from '@/types';
import { SharedLibraryService } from '@/services/SharedLibraryService';

export function useSharedDetail(sharedLibraryId: string) {
    const [library, setLibrary] = useState<SharedLibrary | null>(null);
    const [sections, setSections] = useState<SharedSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (!sharedLibraryId) return;

        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const [libData, sectionsData] = await Promise.all([
                SharedLibraryService.getSharedLibraryById(sharedLibraryId),
                SharedLibraryService.getSharedSections(sharedLibraryId)
            ]);

            setLibrary(libData);
            setSections(sectionsData);
            setError(null);
        } catch (err: any) {
            console.error('[useSharedDetail] Fetch error:', err);
            setError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [sharedLibraryId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refresh = () => fetchData(true);

    const createSharedSection = async (title: string) => {
        if (!sharedLibraryId) return;
        try {
            await SharedLibraryService.createSharedSection(sharedLibraryId, title);
            await fetchData(true);
        } catch (err: any) {
            console.error('[useSharedDetail] Create section error:', err);
            throw err;
        }
    };

    const updateSharedSection = async (sectionId: string, updates: Partial<SharedSection>) => {
        try {
            await SharedLibraryService.updateSharedSection(sectionId, updates);
            await fetchData(true);
        } catch (err: any) {
            console.error('[useSharedDetail] Update section error:', err);
            throw err;
        }
    };

    const deleteSharedSection = async (sectionId: string) => {
        try {
            await SharedLibraryService.deleteSharedSection(sectionId);
            await fetchData(true);
        } catch (err: any) {
            console.error('[useSharedDetail] Delete section error:', err);
            throw err;
        }
    };

    const reorderSharedSections = async (updates: { id: string, display_order: number }[]) => {
        try {
            await SharedLibraryService.reorderSharedSections(updates);
            await fetchData(true);
        } catch (err: any) {
            console.error('[useSharedDetail] Reorder sections error:', err);
            throw err;
        }
    };

    return {
        library,
        sections,
        loading,
        refreshing,
        error,
        refresh,
        createSharedSection,
        updateSharedSection,
        deleteSharedSection,
        reorderSharedSections,
        downloadLibrary: (userId: string) => library ? SharedLibraryService.downloadLibrary(userId, library) : Promise.reject(new Error('Library not loaded'))
    };
}
