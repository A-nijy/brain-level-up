import { useState, useCallback } from 'react';
import { Library } from '@/types';
import { LibraryService } from '@/services/LibraryService';
import { useAuth } from '@/contexts/AuthContext';
import { useFocusEffect } from 'expo-router';

export function useLibraries() {
    const { session } = useAuth();
    const [libraries, setLibraries] = useState<Library[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchLibraries = useCallback(async (isRefresh = false) => {
        if (!session?.user) return;

        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const data = await LibraryService.getLibraries(session.user.id);
            setLibraries(data);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [session?.user]);

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
        createLibrary: LibraryService.createLibrary, // Expose service method if needed directly or wrap it
    };
}
