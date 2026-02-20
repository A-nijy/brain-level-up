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
            const oldLibraries = [...libraries];
            setLibraries(newLibraries);
            try {
                const updates = newLibraries.map((lib, index) => ({
                    id: lib.id,
                    display_order: index
                }));
                await LibraryService.updateLibrariesOrder(updates);
            } catch (err: any) {
                console.error('[useLibraries] Reorder error:', err);
                setLibraries(oldLibraries);
                throw err;
            }
        },
        deleteLibrary: async (libraryId: string) => {
            try {
                await LibraryService.deleteLibrary(libraryId);
                setLibraries(prev => prev.filter(lib => lib.id !== libraryId));
            } catch (err: any) {
                console.error('[useLibraries] Delete error:', err);
                throw err;
            }
        },
        updateLibrary: async (libraryId: string, updates: Partial<Library>) => {
            try {
                await LibraryService.updateLibrary(libraryId, updates);
                setLibraries(prev => prev.map(lib => lib.id === libraryId ? { ...lib, ...updates } : lib));
            } catch (err: any) {
                console.error('[useLibraries] Update error:', err);
                throw err;
            }
        },
        createLibrary: LibraryService.createLibrary,
    };
}
