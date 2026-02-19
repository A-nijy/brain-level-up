import { supabase } from '@/lib/supabase';
import { Item } from '@/types';

export const ItemService = {
    async getItems(sectionId: string): Promise<Item[]> {
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('section_id', sectionId)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false })
            .order('id', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async createItem(item: Pick<Item, 'library_id' | 'section_id' | 'question' | 'answer' | 'memo' | 'study_status'>): Promise<Item> {
        const { data, error } = await supabase
            .from('items')
            .insert(item)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 여러 아이템 한 번에 생성
    async createItems(items: Pick<Item, 'library_id' | 'section_id' | 'question' | 'answer' | 'memo' | 'study_status'>[]): Promise<Item[]> {
        const { data, error } = await supabase
            .from('items')
            .insert(items)
            .select();

        if (error) throw error;
        return data || [];
    },

    async updateItem(id: string, updates: Partial<Item>): Promise<Item> {
        const { data, error } = await supabase
            .from('items')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteItem(id: string): Promise<void> {
        const { error } = await supabase
            .from('items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async updateItemsOrder(updates: { id: string, display_order: number }[]): Promise<void> {
        const promises = updates.map(u =>
            supabase.from('items').update({ display_order: u.display_order }).eq('id', u.id)
        );
        const results = await Promise.all(promises);
        const firstError = results.find(r => r.error)?.error;
        if (firstError) throw firstError;
    },

    async getItemsByLibrary(libraryId: string): Promise<Item[]> {
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('library_id', libraryId)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};
