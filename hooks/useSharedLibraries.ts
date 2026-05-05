import { useState, useCallback, useEffect } from 'react';
import { SharedLibrary, SharedLibraryCategory } from '@/types';
import { SharedLibraryService } from '@/services/SharedLibraryService';
import { useFocusEffect } from 'expo-router';

/**
 * [Local-Only] 공유 자료실 데이터 관리를 담당하는 훅
 * 공식 자료만 지원하도록 리팩토링됨
 */
export function useSharedLibraries() {
    const [libraries, setLibraries] = useState<SharedLibrary[]>([]);
    const [categories, setCategories] = useState<SharedLibraryCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

    const fetchCategories = useCallback(async () => {
        try {
            const data = await SharedLibraryService.getAllSharedCategories();
            setCategories(data);
        } catch (err: any) {
            console.error('[useSharedLibraries] Fetch categories error:', err);
        }
    }, []);

    const fetchLibraries = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            // 로컬 버전은 항상 공식 자료만 조회
            const data = await SharedLibraryService.getSharedLibraries(selectedCategoryId, true);
            setLibraries(data);
            setError(null);
        } catch (err: any) {
            console.error('[useSharedLibraries] Fetch libraries error:', err);
            setError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedCategoryId]);

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
        downloadLibrary: SharedLibraryService.downloadLibrary
    };
}
