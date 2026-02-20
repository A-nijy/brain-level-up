import { useState, useCallback, useEffect } from 'react';
import { SharedSection, SharedItem } from '@/types';
import { SharedLibraryService } from '@/services/SharedLibraryService';

export function useSharedSectionDetail(sharedSectionId: string) {
    const [section, setSection] = useState<SharedSection | null>(null);
    const [items, setItems] = useState<SharedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (!sharedSectionId) return;

        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const [sectionData, itemsData] = await Promise.all([
                SharedLibraryService.getSharedSectionById(sharedSectionId),
                SharedLibraryService.getSharedItems(sharedSectionId)
            ]);

            setSection(sectionData);
            setItems(itemsData);
            setError(null);
        } catch (err: any) {
            console.error('[useSharedSectionDetail] Fetch error:', err);
            setError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [sharedSectionId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refresh = () => fetchData(true);

    return {
        section,
        items,
        loading,
        refreshing,
        error,
        refresh
    };
}
