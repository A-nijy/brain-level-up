import { supabase } from '@/lib/supabase';
import { SharedLibrary, SharedItem, Library, Item, SharedSection, SharedLibraryCategory } from '@/types';
import { LibraryService } from './LibraryService';
import { ItemService } from './ItemService';

export const SharedLibraryService = {
    async getSharedLibraries(categoryId?: string, isOfficial: boolean = true): Promise<SharedLibrary[]> {
        let query = supabase
            .from('shared_libraries')
            .select('*, shared_library_categories(title)')
            .eq('is_draft', false)
            .eq('is_hidden', false) // 신고 누적 등으로 숨겨진 자료는 가져오지 않음
            .eq('is_official', isOfficial)
            .order('created_at', { ascending: false });

        if (categoryId && categoryId !== 'all') {
            query = query.eq('category_id', categoryId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Map join results to category field if needed for display
        return (data || []).map(lib => ({
            ...lib,
            category: lib.shared_library_categories?.title || lib.category
        }));
    },

    async shareLibrary(userId: string, libraryId: string, categoryId: string, tags: string[]): Promise<void> {
        // 1. Fetch source library info
        const { data: lib, error: libError } = await supabase
            .from('libraries')
            .select('*')
            .eq('id', libraryId)
            .single();

        if (libError) throw libError;

        // 2. Create shared library record (marked as user content)
        const { data: sharedLib, error: sharedError } = await supabase
            .from('shared_libraries')
            .insert({
                title: lib.title,
                description: lib.description,
                created_by: userId,
                is_official: false,
                is_draft: false,
                category_id: categoryId,
                tags: tags
            })
            .select()
            .single();

        if (sharedError) throw sharedError;

        // 3. Fetch sections and items to copy
        const { data: sections, error: secError } = await supabase
            .from('library_sections')
            .select('*')
            .eq('library_id', libraryId)
            .order('display_order', { ascending: true });

        if (secError) throw secError;

        for (const sec of sections) {
            // Create shared section
            const { data: sharedSec, error: sharedSecError } = await supabase
                .from('shared_sections')
                .insert({
                    shared_library_id: sharedLib.id,
                    title: sec.title,
                    display_order: sec.display_order
                })
                .select()
                .single();

            if (sharedSecError) throw sharedSecError;

            // Fetch items for this section
            const { data: items, error: itemsError } = await supabase
                .from('items')
                .select('*')
                .eq('section_id', sec.id)
                .order('display_order', { ascending: true });

            if (itemsError) throw itemsError;

            if (items && items.length > 0) {
                const sharedItems = items.map(item => ({
                    shared_library_id: sharedLib.id,
                    shared_section_id: sharedSec.id,
                    question: item.question,
                    answer: item.answer,
                    memo: item.memo,
                    image_url: item.image_url,
                    display_order: item.display_order
                }));

                const { error: batchError } = await supabase
                    .from('shared_items')
                    .insert(sharedItems);

                if (batchError) throw batchError;
            }
        }
    },

    async getSharedLibraryById(id: string): Promise<SharedLibrary | null> {
        const { data, error } = await supabase
            .from('shared_libraries')
            .select('*, shared_library_categories(title)')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async deleteSharedLibrary(libraryId: string): Promise<void> {
        // 1. 모든 섹션 조회
        const { data: sections, error: secError } = await supabase
            .from('shared_sections')
            .select('id')
            .eq('shared_library_id', libraryId);

        if (secError) throw secError;

        // 2. 각 섹션의 아이템 삭제
        if (sections && sections.length > 0) {
            const sectionIds = sections.map(s => s.id);
            const { error: itemDelError } = await supabase
                .from('shared_items')
                .delete()
                .in('shared_section_id', sectionIds);

            if (itemDelError) throw itemDelError;
        }

        // 3. 섹션 삭제
        const { error: secDelError } = await supabase
            .from('shared_sections')
            .delete()
            .eq('shared_library_id', libraryId);

        if (secDelError) throw secDelError;

        // 4. 자료 고유 정보 삭제
        const { error: libDelError } = await supabase
            .from('shared_libraries')
            .delete()
            .eq('id', libraryId);

        if (libDelError) throw libDelError;
    },

    async updateSharedLibrary(libraryId: string, updates: Partial<SharedLibrary>): Promise<void> {
        const { error } = await supabase
            .from('shared_libraries')
            .update(updates)
            .eq('id', libraryId);

        if (error) throw error;
    },

    async downloadLibrary(userId: string, sharedLibrary: SharedLibrary): Promise<Library> {
        // 1. Create new library for user
        const newLib = await LibraryService.createLibrary(userId, {
            title: sharedLibrary.title,
            description: sharedLibrary.description,
            category: sharedLibrary.category,
            is_public: false
        });

        // 2. Fetch shared sections
        const { data: sharedSections, error: sectionsError } = await supabase
            .from('shared_sections')
            .select('*')
            .eq('shared_library_id', sharedLibrary.id)
            .order('display_order', { ascending: true });

        if (sectionsError) throw sectionsError;

        if (sharedSections && sharedSections.length > 0) {
            for (const ss of sharedSections) {
                // Create section for user library
                const newSection = await LibraryService.createSection(newLib.id, ss.title);

                // Fetch items for this shared section
                const { data: sharedItems, error: itemsError } = await supabase
                    .from('shared_items')
                    .select('*')
                    .eq('shared_section_id', ss.id)
                    .order('created_at', { ascending: true });

                if (itemsError) throw itemsError;

                // Copy items to new section
                if (sharedItems && sharedItems.length > 0) {
                    const newItems = sharedItems.map(si => ({
                        library_id: newLib.id,
                        section_id: newSection.id,
                        question: si.question,
                        answer: si.answer,
                        memo: si.memo,
                        image_url: si.image_url,
                        study_status: 'undecided' as const
                    }));

                    await ItemService.createItems(newItems);
                }
            }
        }

        // 4. Increment download count (RPC)
        await supabase.rpc('increment_download_count', { row_id: sharedLibrary.id });

        return newLib;
    },

    async getSharedSections(sharedLibraryId: string): Promise<SharedSection[]> {
        const { data, error } = await supabase
            .from('shared_sections')
            .select('*')
            .eq('shared_library_id', sharedLibraryId)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: true }); // Fallback sorting

        if (error) throw error;
        return data || [];
    },

    async getSharedSectionById(sectionId: string): Promise<SharedSection | null> {
        const { data, error } = await supabase
            .from('shared_sections')
            .select('*')
            .eq('id', sectionId)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async getSharedItems(sharedSectionId: string): Promise<SharedItem[]> {
        const { data, error } = await supabase
            .from('shared_items')
            .select('*')
            .eq('shared_section_id', sharedSectionId)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // New helper to get items for a shared library (used for full preview)
    async getSharedItemsByLibrary(sharedLibraryId: string): Promise<SharedItem[]> {
        const { data, error } = await supabase
            .from('shared_items')
            .select('*')
            .eq('shared_library_id', sharedLibraryId)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getAllSharedCategories(): Promise<SharedLibraryCategory[]> {
        const { data, error } = await supabase
            .from('shared_library_categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getSharedCategories(isOfficial?: boolean): Promise<SharedLibraryCategory[]> {
        // 실제 데이터가 존재하는 카테고리 ID만 추출
        let libQuery = supabase
            .from('shared_libraries')
            .select('category_id')
            .eq('is_draft', false);

        if (isOfficial !== undefined) {
            libQuery = libQuery.eq('is_official', isOfficial);
        }

        const { data: usedLibs, error: libError } = await libQuery;
        if (libError) throw libError;

        const categoryIds = Array.from(new Set(usedLibs.map(l => l.category_id))).filter(id => id !== null);

        // 사용 중인 카테고리가 없으면 빈 배열 반환
        if (categoryIds.length === 0) return [];

        const { data, error } = await supabase
            .from('shared_library_categories')
            .select('*')
            .in('id', categoryIds)
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async createSharedSection(sharedLibraryId: string, title: string): Promise<any> {
        // Get current max display_order
        const { data: sections } = await supabase
            .from('shared_sections')
            .select('display_order')
            .eq('shared_library_id', sharedLibraryId)
            .order('display_order', { ascending: false })
            .limit(1);

        const nextOrder = sections && sections.length > 0 ? sections[0].display_order + 1 : 0;

        const { data, error } = await supabase
            .from('shared_sections')
            .insert({
                shared_library_id: sharedLibraryId,
                title: title,
                display_order: nextOrder
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateSharedSection(sectionId: string, updates: { title?: string }): Promise<void> {
        const { error } = await supabase
            .from('shared_sections')
            .update(updates)
            .eq('id', sectionId);

        if (error) throw error;
    },

    async deleteSharedSection(sectionId: string): Promise<void> {
        // Delete all items in this section first
        const { error: itemsError } = await supabase
            .from('shared_items')
            .delete()
            .eq('shared_section_id', sectionId);

        if (itemsError) throw itemsError;

        // Then delete the section
        const { error } = await supabase
            .from('shared_sections')
            .delete()
            .eq('id', sectionId);

        if (error) throw error;
    },

    async reorderSharedSections(updates: { id: string; display_order: number }[]): Promise<void> {
        const promises = updates.map(u =>
            supabase.from('shared_sections').update({ display_order: u.display_order }).eq('id', u.id)
        );
        const results = await Promise.all(promises);
        const firstError = results.find(r => r.error)?.error;
        if (firstError) throw firstError;
    },

    async reorderSharedItems(updates: { id: string; display_order: number }[]): Promise<void> {
        const promises = updates.map(u =>
            supabase.from('shared_items').update({ display_order: u.display_order }).eq('id', u.id)
        );
        const results = await Promise.all(promises);
        const firstError = results.find(r => r.error)?.error;
        if (firstError) throw firstError;
    },

    async createSharedItems(items: { shared_library_id: string; shared_section_id: string; question: string; answer: string; memo?: string | null; display_order: number }[]): Promise<void> {
        const { error } = await supabase
            .from('shared_items')
            .insert(items);

        if (error) throw error;
    },

    async reportSharedLibrary(userId: string, libraryId: string, reason: string = 'inappropriate'): Promise<boolean> {
        // 1. 이미 신고한 내역이 있는지 확인
        const { data: existing } = await supabase
            .from('shared_library_reports')
            .select('id')
            .eq('user_id', userId)
            .eq('shared_library_id', libraryId)
            .maybeSingle();

        if (existing) {
            // 이미 신고했다면 취소 (삭제)
            const { error } = await supabase
                .from('shared_library_reports')
                .delete()
                .eq('id', existing.id);
            if (error) throw error;
            return false; // 취소됨
        } else {
            // 신고하지 않았다면 등록 (추가)
            const { error } = await supabase
                .from('shared_library_reports')
                .insert({
                    user_id: userId,
                    shared_library_id: libraryId,
                    reason: reason
                });
            if (error) throw error;
            return true; // 신고됨
        }
    }
};
