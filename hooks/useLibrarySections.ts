import { useState, useCallback } from 'react';
import { Section } from '@/types';
import { LibraryService } from '@/services/LibraryService';
import { useFocusEffect } from 'expo-router';

export function useLibrarySections(libraryId: string) {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchSections = useCallback(async (isRefresh = false) => {
        if (!libraryId) return;

        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const data = await LibraryService.getSections(libraryId);
            setSections(data);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [libraryId]);

    useFocusEffect(
        useCallback(() => {
            fetchSections();
        }, [fetchSections])
    );

    const refresh = () => fetchSections(true);

    const reorderSections = async (newSections: Section[]) => {
        setSections(newSections);
        const updates = newSections.map((s, index) => ({
            id: s.id,
            display_order: index
        }));
        await LibraryService.updateSectionsOrder(updates);
    };

    return {
        sections,
        loading,
        refreshing,
        error,
        refresh,
        reorderSections
    };
}
