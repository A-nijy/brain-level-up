import { useState, useCallback, useEffect } from 'react';
import { SharedLibrary, SharedLibraryCategory } from '@/types';
import { SharedLibraryService } from '@/services/SharedLibraryService';
import { useFocusEffect } from 'expo-router';

export function useSharedLibraries() {
    const [libraries, setLibraries] = useState<SharedLibrary[]>([]);
    const [categories, setCategories] = useState<SharedLibraryCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    const [isOfficial, setIsOfficial] = useState(true);

    const fetchCategories = useCallback(async () => {
        try {
            const data = await SharedLibraryService.getSharedCategories(isOfficial);
            setCategories(data);
        } catch (err: any) {
            console.error('[useSharedLibraries] Fetch categories error:', err);
        }
    }, [isOfficial]);

    const fetchLibraries = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const data = await SharedLibraryService.getSharedLibraries(selectedCategoryId, isOfficial);
            setLibraries(data);
            setError(null);
        } catch (err: any) {
            console.error('[useSharedLibraries] Fetch libraries error:', err);
            setError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedCategoryId, isOfficial]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useFocusEffect(
        useCallback(() => {
            fetchLibraries();
        }, [fetchLibraries])
    );

    const refresh = () => {
        fetchCategories();
        fetchLibraries(true);
    };

    return {
        libraries,
        categories,
        loading,
        refreshing,
        error,
        refresh,
        selectedCategoryId,
        setSelectedCategoryId,
        isOfficial,
        setIsOfficial,
        downloadLibrary: SharedLibraryService.downloadLibrary
    };
}
