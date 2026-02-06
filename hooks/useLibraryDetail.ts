import { useState, useCallback } from 'react';
import { Library, Item } from '@/types';
import { LibraryService } from '@/services/LibraryService';
import { ItemService } from '@/services/ItemService';
import { useAuth } from '@/contexts/AuthContext';
import { useFocusEffect } from 'expo-router';

export function useLibraryDetail(libraryId: string) {
    const { session } = useAuth();
    const [library, setLibrary] = useState<Library | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchDetail = useCallback(async (isRefresh = false) => {
        if (!libraryId) return;

        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            // SyncService 호출 제거 (온라인 직접 연결)

            const [libData, itemsData] = await Promise.all([
                LibraryService.getLibraryById(libraryId),
                ItemService.getItems(libraryId)
            ]);

            setLibrary(libData);
            setItems(itemsData);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [libraryId, session?.user?.id]);

    useFocusEffect(
        useCallback(() => {
            fetchDetail();
        }, [fetchDetail])
    );

    const refresh = () => fetchDetail(true);

    return {
        library,
        items,
        loading,
        refreshing,
        error,
        refresh
    };
}
