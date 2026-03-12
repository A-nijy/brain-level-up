import { supabase } from '@/lib/supabase';
import { Item } from '@/types';
import { LogService } from './LogService';

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

    async createItem(item: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'success_count' | 'fail_count' | 'display_order' | 'last_reviewed_at'>): Promise<Item> {
        const { data, error } = await supabase
            .from('items')
            .insert(item)
            .select()
            .single();

        if (error) throw error;

        // 활동 로그 기록
        LogService.logEvent('item_mutation', { 
            action: 'create', 
            id: data.id, 
            library_id: item.library_id,
            section_id: item.section_id,
            question: item.question.substring(0, 50) 
        }).catch(err => console.error('Failed to log item creation:', err));

        return data;
    },

    // 여러 아이템 한 번에 생성
    async createItems(items: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'success_count' | 'fail_count' | 'display_order' | 'last_reviewed_at'>[]): Promise<Item[]> {
        const { data, error } = await supabase
            .from('items')
            .insert(items)
            .select();

        if (error) throw error;

        // 활동 로그 기록 (첫 번째 아이템의 메타데이터 활용)
        if (data && data.length > 0) {
            LogService.logEvent('item_mutation', { 
                action: 'create_bulk', 
                count: data.length,
                library_id: items[0].library_id,
                section_id: items[0].section_id
            }).catch(err => console.error('Failed to log bulk item creation:', err));
        }

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

        // 활동 로그 기록
        LogService.logEvent('item_mutation', { 
            action: 'update', 
            id: id, 
            library_id: data.library_id,
            section_id: data.section_id,
            updates: Object.keys(updates)
        }).catch(err => console.error('Failed to log item update:', err));

        return data;
    },

    async deleteItem(id: string): Promise<void> {
        // 삭제 전 데이터 조회 (로그용)
        const { data: item } = await supabase.from('items').select('library_id, section_id').eq('id', id).single();

        const { error } = await supabase
            .from('items')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // 활동 로그 기록
        LogService.logEvent('item_mutation', { 
            action: 'delete', 
            id: id,
            library_id: item?.library_id,
            section_id: item?.section_id
        }).catch(err => console.error('Failed to log item deletion:', err));
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
