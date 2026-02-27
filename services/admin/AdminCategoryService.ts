import { supabase } from '@/lib/supabase';

export const AdminCategoryService = {
    /**
     * 공유 자료실 카테고리 목록 조회
     */
    async getSharedCategories() {
        const { data, error } = await supabase
            .from('shared_library_categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * 공유 자료실 카테고리 생성
     */
    async createSharedCategory(title: string) {
        const { data, error } = await supabase
            .from('shared_library_categories')
            .insert({ title })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * 공유 자료실 카테고리 수정
     */
    async updateSharedCategory(id: string, updates: { title?: string; display_order?: number }) {
        const { error } = await supabase
            .from('shared_library_categories')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * 공유 자료실 카테고리 삭제
     */
    async deleteSharedCategory(id: string) {
        const { error } = await supabase
            .from('shared_library_categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * 공유 자료실 카테고리 순서 변경
     */
    async reorderSharedCategories(categories: { id: string; display_order: number }[]) {
        const promises = categories.map(cat =>
            supabase.from('shared_library_categories').update({ display_order: cat.display_order }).eq('id', cat.id)
        );
        const results = await Promise.all(promises);
        const firstError = results.find(r => r.error)?.error;
        if (firstError) throw firstError;
    },
};
