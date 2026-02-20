import { useState, useCallback } from 'react';
import { Section, Item, StudyStatus } from '@/types';
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
        const oldItems = [...items];
        setItems(newItems);
        try {
            const updates = newItems.map((item, index) => ({
                id: item.id,
                display_order: index
            }));
            await ItemService.updateItemsOrder(updates);
        } catch (err: any) {
            console.error('[useSectionDetail] Reorder error:', err);
            setItems(oldItems);
            throw err;
        }
    };

    const deleteItem = async (itemId: string) => {
        try {
            await ItemService.deleteItem(itemId);
            setItems(prev => prev.filter(item => item.id !== itemId));
        } catch (err: any) {
            console.error('[useSectionDetail] Delete error:', err);
            throw err;
        }
    };

    const updateItem = async (itemId: string, updates: Partial<Item>) => {
        try {
            await ItemService.updateItem(itemId, updates);
            setItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
        } catch (err: any) {
            console.error('[useSectionDetail] Update error:', err);
            throw err;
        }
    };

    const createItem = async (itemData: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'success_count' | 'fail_count' | 'display_order' | 'last_reviewed_at' | 'study_status' | 'image_url'> & {
        study_status?: StudyStatus;
        image_url?: string | null;
    }) => {
        try {
            const newItem = await ItemService.createItem({
                ...itemData,
                study_status: itemData.study_status || 'undecided',
                image_url: itemData.image_url || null
            });
            setItems(prev => [...prev, newItem]);
            return newItem;
        } catch (err: any) {
            console.error('[useSectionDetail] Create error:', err);
            throw err;
        }
    };

    const createItems = async (itemsData: (Omit<Item, 'id' | 'created_at' | 'updated_at' | 'success_count' | 'fail_count' | 'display_order' | 'last_reviewed_at' | 'study_status' | 'image_url'> & {
        study_status?: StudyStatus;
        image_url?: string | null;
    })[]) => {
        try {
            const formattedItems = itemsData.map(item => ({
                ...item,
                study_status: item.study_status || 'undecided',
                image_url: item.image_url || null
            }));
            const newItems = await ItemService.createItems(formattedItems);
            setItems(prev => [...prev, ...newItems]);
            return newItems;
        } catch (err: any) {
            console.error('[useSectionDetail] Create items error:', err);
            throw err;
        }
    };

    return {
        section,
        items,
        loading,
        refreshing,
        error,
        refresh,
        reorderItems,
        deleteItem,
        updateItem,
        createItem,
        createItems
    };
}
