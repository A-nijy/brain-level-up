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
        if (!session?.user) {
            console.log('[useLibraries] No session user, clearing loading.');
            setLoading(false);
            return;
        }

        try {
            console.log('[useLibraries] Fetching libraries for:', session.user.id);
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const data = await LibraryService.getLibraries(session.user.id);
            console.log('[useLibraries] Libraries fetched:', data.length);
            setLibraries(data);
            setError(null);
        } catch (err: any) {
            console.error('[useLibraries] Fetch error:', err);
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
        reorderLibraries: async (newLibraries: Library[]) => {
            setLibraries(newLibraries);
            const updates = newLibraries.map((lib, index) => ({
                id: lib.id,
                display_order: index
            }));
            await LibraryService.updateLibrariesOrder(updates);
        },
        createLibrary: LibraryService.createLibrary,
    };
}
