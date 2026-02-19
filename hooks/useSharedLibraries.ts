import { useState, useCallback } from 'react';
import { SharedLibrary } from '@/types';
import { SharedLibraryService } from '@/services/SharedLibraryService';
import { useFocusEffect } from 'expo-router';

export function useSharedLibraries() {
    const [libraries, setLibraries] = useState<SharedLibrary[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

    const fetchLibraries = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const data = await SharedLibraryService.getSharedLibraries(selectedCategoryId);
            setLibraries(data);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedCategoryId]);

    useFocusEffect(
        useCallback(() => {
            fetchLibraries();
        }, [fetchLibraries, selectedCategoryId])
    );

    const refresh = () => fetchLibraries(true);

    return {
        libraries,
        loading,
        refreshing,
        error,
        refresh,
        selectedCategoryId,
        setSelectedCategoryId,
        downloadLibrary: SharedLibraryService.downloadLibrary
    };
}
