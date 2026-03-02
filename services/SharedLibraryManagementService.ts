import { supabase } from '@/lib/supabase';

/**
 * 공유 자료실의 복잡한 상태 변경 및 트랜잭션성 로직을 담당하는 공통 서비스
 * (SRP/DIP 실천을 위한 로직 모음)
 */
export const SharedLibraryManagementService = {
    /**
     * 특정 테이블의 다음 display_order 가져오기
     */
    async getNextDisplayOrder(tableName: 'shared_libraries' | 'shared_sections' | 'shared_items', filter?: Record<string, any>) {
        let query = supabase.from(tableName).select('display_order');

        if (filter) {
            Object.entries(filter).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
        }

        const { data } = await query.order('display_order', { ascending: false }).limit(1);
        return (data?.[0]?.display_order ?? -1) + 1;
    },

    /**
     * 공유 자료 삭제 (Cascade: 자료 -> 섹션 -> 아이템)
     */
    async deleteSharedLibraryCascade(libraryId: string) {
        // 1. 모든 섹션 조회
        const { data: sections } = await supabase
            .from('shared_sections')
            .select('id')
            .eq('shared_library_id', libraryId);

        // 2. 각 섹션의 아이템 삭제
        if (sections && sections.length > 0) {
            const sectionIds = sections.map(s => s.id);
            await supabase
                .from('shared_items')
                .delete()
                .in('shared_section_id', sectionIds);
        }

        // 3. 섹션 삭제
        await supabase
            .from('shared_sections')
            .delete()
            .eq('shared_library_id', libraryId);

        // 4. 자료 삭제
        const { error } = await supabase
            .from('shared_libraries')
            .delete()
            .eq('id', libraryId);

        if (error) throw error;
    },

    /**
     * 개인 암기장의 섹션과 아이템을 공유 자료실로 복제
     */
    async copyLibraryDataToShared(sourceLibId: string, targetSharedLibId: string) {
        const { data: sections, error: secError } = await supabase
            .from('library_sections')
            .select('*')
            .eq('library_id', sourceLibId)
            .order('display_order', { ascending: true });

        if (secError) throw secError;

        if (!sections || sections.length === 0) {
            // 섹션이 없는 경우 기본 섹션 생성 및 모든 아이템 복사
            const newSharedSectionId = await this._createDefaultSharedSection(targetSharedLibId);
            await this._copyItemsToShared(sourceLibId, null, targetSharedLibId, newSharedSectionId);
            return;
        }

        for (const sec of sections) {
            const { data: sharedSec, error: sharedSecError } = await supabase
                .from('shared_sections')
                .insert({
                    shared_library_id: targetSharedLibId,
                    title: sec.title,
                    display_order: sec.display_order
                })
                .select()
                .single();

            if (sharedSecError) throw sharedSecError;

            await this._copyItemsToShared(sourceLibId, sec.id, targetSharedLibId, sharedSec.id);
        }
    },

    /** [Internal] 공유 자료실 기본 섹션 생성 */
    async _createDefaultSharedSection(sharedLibId: string) {
        const { data, error } = await supabase
            .from('shared_sections')
            .insert({
                shared_library_id: sharedLibId,
                title: '기본 섹션',
                display_order: 0
            })
            .select()
            .single();
        if (error) throw error;
        return data.id;
    },

    /** [Internal] 아이템 복제 실행 */
    async _copyItemsToShared(sourceLibId: string, sectionId: string | null, targetLibId: string, targetSecId: string) {
        let query = supabase.from('items').select('*').eq('library_id', sourceLibId);

        if (sectionId) {
            query = query.eq('section_id', sectionId);
        } else {
            query = query.is('section_id', null);
        }

        const { data: items, error: itemsError } = await query.order('display_order', { ascending: true });
        if (itemsError) throw itemsError;

        if (items && items.length > 0) {
            const sharedItems = items.map(item => ({
                shared_library_id: targetLibId,
                shared_section_id: targetSecId,
                question: item.question,
                answer: item.answer,
                memo: item.memo,
                image_url: item.image_url,
                display_order: item.display_order
            }));

            const { error: batchError } = await supabase.from('shared_items').insert(sharedItems);
            if (batchError) throw batchError;
        }
    }
};
