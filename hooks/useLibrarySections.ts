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
        const oldSections = [...sections];
        setSections(newSections);
        try {
            const updates = newSections.map((s, index) => ({
                id: s.id,
                display_order: index
            }));
            await LibraryService.updateSectionsOrder(updates);
        } catch (err: any) {
            console.error('[useLibrarySections] Reorder error:', err);
            setSections(oldSections);
            throw err;
        }
    };

    const createSection = async (title: string) => {
        try {
            const newSection = await LibraryService.createSection(libraryId, title);
            setSections(prev => [...prev, newSection]);
            return newSection;
        } catch (err: any) {
            console.error('[useLibrarySections] Create error:', err);
            throw err;
        }
    };

    const updateSection = async (sectionId: string, updates: { title: string }) => {
        try {
            await LibraryService.updateSection(sectionId, updates);
            setSections(prev => prev.map(s => s.id === sectionId ? { ...s, ...updates } : s));
        } catch (err: any) {
            console.error('[useLibrarySections] Update error:', err);
            throw err;
        }
    };

    const deleteSection = async (sectionId: string) => {
        try {
            await LibraryService.deleteSection(sectionId);
            setSections(prev => prev.filter(s => s.id !== sectionId));
        } catch (err: any) {
            console.error('[useLibrarySections] Delete error:', err);
            throw err;
        }
    };

    return {
        sections,
        loading,
        refreshing,
        error,
        refresh,
        reorderSections,
        createSection,
        updateSection,
        deleteSection
    };
}
