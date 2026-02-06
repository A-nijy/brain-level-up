import { useState, useCallback } from 'react';
import { SharedLibrary } from '@/types';
import { SharedLibraryService } from '@/services/SharedLibraryService';
import { useFocusEffect } from 'expo-router';

export function useSharedLibraries() {
    const [libraries, setLibraries] = useState<SharedLibrary[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchLibraries = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const data = await SharedLibraryService.getSharedLibraries();
            setLibraries(data);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchLibraries();
        }, [fetchLibraries])
    );

    const refresh = () => fetchLibraries(true);

    return {
        libraries,
        loading,
        refreshing,
        error,
        refresh,
        downloadLibrary: SharedLibraryService.downloadLibrary
    };
}
