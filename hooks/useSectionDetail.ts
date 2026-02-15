import { useState, useCallback } from 'react';
import { Section, Item } from '@/types';
import { LibraryService } from '@/services/LibraryService';
import { ItemService } from '@/services/ItemService';
import { useAuth } from '@/contexts/AuthContext';
import { useFocusEffect } from 'expo-router';

export function useSectionDetail(sectionId: string) {
    const { session } = useAuth();
    const [section, setSection] = useState<Section | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchDetail = useCallback(async (isRefresh = false) => {
        if (!sectionId) return;

        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const [sectionData, itemsData] = await Promise.all([
                LibraryService.getSectionById(sectionId),
                ItemService.getItems(sectionId)
            ]);

            setSection(sectionData);
            setItems(itemsData);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [sectionId, session?.user?.id]);

    useFocusEffect(
        useCallback(() => {
            fetchDetail();
        }, [fetchDetail])
    );

    const refresh = () => fetchDetail(true);

    const reorderItems = async (newItems: Item[]) => {
        setItems(newItems);
        const updates = newItems.map((item, index) => ({
            id: item.id,
            display_order: index
        }));
        await ItemService.updateItemsOrder(updates);
    };

    return {
        section,
        items,
        loading,
        refreshing,
        error,
        refresh,
        reorderItems
    };
}
