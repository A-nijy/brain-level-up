import { supabase } from '@/lib/supabase';
import { SharedLibrary, SharedItem, Library, Item, SharedSection, SharedLibraryCategory } from '@/types';
import { LibraryService } from './LibraryService';
import { ItemService } from './ItemService';
import { SharedLibraryManagementService } from './SharedLibraryManagementService';
import { LogService } from './LogService';

export const SharedLibraryService = {
    /**
     * 공유 자료실 목록 조회
     */
    async getSharedLibraries(categoryId?: string, isOfficial: boolean = true): Promise<SharedLibrary[]> {
        let query = supabase
            .from('shared_libraries')
            .select('*, shared_library_categories(title)')
            .eq('is_draft', false)
            .eq('is_hidden', false)
            .eq('is_official', isOfficial)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (categoryId && categoryId !== 'all') {
            query = query.eq('category_id', categoryId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map(lib => ({
            ...lib,
            category: lib.shared_library_categories?.title || lib.category
        }));
    },

    /**
     * [Refactored] 개인 암기장을 공유 자료실에 게시 (Deep Copy)
     */
    async shareLibrary(userId: string, libraryId: string, categoryId: string, tags: string[]): Promise<void> {
        try {
            // 1. 원본 암기장 정보 조회
            const { data: lib, error: libError } = await supabase
                .from('libraries')
                .select('*')
                .eq('id', libraryId)
                .single();

            if (libError) throw libError;

            // 2. 카테고리 ID 검증 (UUID 형식이 아닌 경우 처리)
            let validatedCategoryId: string | null = categoryId;
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

            if (!categoryId || !uuidRegex.test(categoryId)) {
                // 유효하지 않은 경우 DB에서 첫 번째 사용 가능한 카테고리를 가져옴
                const { data: cats } = await supabase
                    .from('shared_library_categories')
                    .select('id')
                    .order('display_order', { ascending: true })
                    .limit(1);

                if (cats && cats.length > 0) {
                    validatedCategoryId = cats[0].id;
                } else {
                    validatedCategoryId = null; // 최후의 수단
                }
            }

            // 3. 공유 자료실 레코드 생성
            const { data: sharedLib, error: sharedError } = await supabase
                .from('shared_libraries')
                .insert({
                    title: lib.title,
                    description: lib.description,
                    created_by: userId,
                    is_official: false,
                    is_draft: false,
                    category_id: validatedCategoryId,
                    tags: tags
                })
                .select()
                .single();

            if (sharedError) throw sharedError;

            // 4. 섹션 및 아이템 복제 (공통 서비스 활용)
            await SharedLibraryManagementService.copyLibraryDataToShared(libraryId, sharedLib.id);

            // 활동 로그 기록 (공유 성공)
            await LogService.logEvent('feature_usage', { 
                feature: 'SHARE_LIBRARY',
                title: lib.title 
            }, userId);
        } catch (error: any) {
            LogService.logEvent('app_error', {
                summary: '자료실 공유 실패',
                message: error.message,
                title: (error as any).libTitle || '알 수 없는 암기장',
                libraryId
            }, userId).catch(() => {});
            throw error;
        }
    },

    /**
     * [Internal Helper] 제거 (공통 서비스로 이전)
     */

    /**
     * [Refactored] 공유 자료를 내 암기장으로 다운로드 (Deep Copy)
     */
    async downloadLibrary(userId: string, sharedLibrary: SharedLibrary): Promise<Library> {
        try {
            // 활동 로그 기록 (다운로드 시작 - 피처 사용 관점)
            await LogService.logEvent('feature_usage', { 
                feature: 'DOWNLOAD_SHARED',
                title: sharedLibrary.title 
            }, userId);

            // 1. 사용자용 새 암기장 생성 (상세 로그 억제)
            const newLib = await LibraryService.createLibrary(userId, {
                title: sharedLibrary.title,
                description: sharedLibrary.description,
                category: sharedLibrary.category,
                is_public: false
            }, true);

            // 활동 로그 기록 (암기장 생성 완료 - 콘텐츠 뮤테이션 관점 요약)
            await LogService.logEvent('library_mutation', { 
                action: 'download', 
                id: newLib.id, 
                title: newLib.title 
            }, userId);

            // 2. 섹션 및 아이템 복제 (공유 -> 개인)
            const { data: sharedSections, error: sectionsError } = await supabase
                .from('shared_sections')
                .select('*')
                .eq('shared_library_id', sharedLibrary.id)
                .order('display_order', { ascending: true });

            if (sectionsError) throw sectionsError;

            if (sharedSections && sharedSections.length > 0) {
                for (const ss of sharedSections) {
                    const newSection = await LibraryService.createSection(newLib.id, ss.title, true);

                    const { data: sharedItems, error: itemsError } = await supabase
                        .from('shared_items')
                        .select('*')
                        .eq('shared_section_id', ss.id)
                        .order('created_at', { ascending: true });

                    if (itemsError) throw itemsError;

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
                        await ItemService.createItems(newItems, true);
                    }
                }
            }

            // 3. 다운로드 횟수 증가
            await supabase.rpc('increment_download_count', { row_id: sharedLibrary.id });

            return newLib;
        } catch (error: any) {
            LogService.logEvent('app_error', {
                summary: '자료실 다운로드 실패',
                message: error.message,
                sharedLibraryId: sharedLibrary.id
            }).catch(() => {});
            throw error;
        }
    },

    /**
     * 공유 자료 삭제 (공통 서비스 활용)
     */
    async deleteSharedLibrary(libraryId: string): Promise<void> {
        try {
            await SharedLibraryManagementService.deleteSharedLibraryCascade(libraryId);
        } catch (error: any) {
            LogService.logEvent('app_error', {
                summary: '자료실 삭제 실패',
                message: error.message,
                libraryId
            }).catch(() => {});
            throw error;
        }
    },

    /**
     * 기타 헬퍼 메서드들 (ReadOnly)
     */
    async getSharedLibraryById(id: string): Promise<SharedLibrary | null> {
        const { data, error } = await supabase
            .from('shared_libraries')
            .select('*, shared_library_categories(title)')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async updateSharedLibrary(libraryId: string, updates: Partial<SharedLibrary>): Promise<void> {
        const { error } = await supabase.from('shared_libraries').update(updates).eq('id', libraryId);
        if (error) throw error;
    },

    async getSharedSections(sharedLibraryId: string): Promise<SharedSection[]> {
        const { data, error } = await supabase
            .from('shared_sections')
            .select('*')
            .eq('shared_library_id', sharedLibraryId)
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getSharedSectionById(sectionId: string): Promise<SharedSection | null> {
        const { data, error } = await supabase.from('shared_sections').select('*').eq('id', sectionId).maybeSingle();
        if (error) throw error;
        return data;
    },

    async getSharedItems(sharedSectionId: string): Promise<SharedItem[]> {
        const { data, error } = await supabase
            .from('shared_items')
            .select('*')
            .eq('shared_section_id', sharedSectionId)
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getSharedItemsByLibrary(sharedLibraryId: string): Promise<SharedItem[]> {
        const { data, error } = await supabase
            .from('shared_items')
            .select('*')
            .eq('shared_library_id', sharedLibraryId)
            .order('display_order', { ascending: true });

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
        let libQuery = supabase.from('shared_libraries').select('category_id').eq('is_draft', false);
        if (isOfficial !== undefined) libQuery = libQuery.eq('is_official', isOfficial);

        const { data: usedLibs, error: libError } = await libQuery;
        if (libError) throw libError;

        const categoryIds = Array.from(new Set(usedLibs.map(l => l.category_id))).filter(id => id !== null);
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
        const nextOrder = await SharedLibraryManagementService.getNextDisplayOrder('shared_sections', { shared_library_id: sharedLibraryId });
        const { data, error } = await supabase
            .from('shared_sections')
            .insert({ shared_library_id: sharedLibraryId, title, display_order: nextOrder })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateSharedSection(sectionId: string, updates: { title?: string }): Promise<void> {
        const { error } = await supabase.from('shared_sections').update(updates).eq('id', sectionId);
        if (error) throw error;
    },

    async deleteSharedSection(sectionId: string): Promise<void> {
        await supabase.from('shared_items').delete().eq('shared_section_id', sectionId);
        const { error } = await supabase.from('shared_sections').delete().eq('id', sectionId);
        if (error) throw error;
    },

    async reorderSharedSections(updates: { id: string; display_order: number }[]): Promise<void> {
        const promises = updates.map(u => supabase.from('shared_sections').update({ display_order: u.display_order }).eq('id', u.id));
        const results = await Promise.all(promises);
        const firstError = results.find(r => r.error)?.error;
        if (firstError) throw firstError;
    },

    async reorderSharedItems(updates: { id: string; display_order: number }[]): Promise<void> {
        const promises = updates.map(u => supabase.from('shared_items').update({ display_order: u.display_order }).eq('id', u.id));
        const results = await Promise.all(promises);
        const firstError = results.find(r => r.error)?.error;
        if (firstError) throw firstError;
    },

    async createSharedItems(items: any[]): Promise<void> {
        const { error } = await supabase.from('shared_items').insert(items);
        if (error) throw error;
    },

    async reportSharedLibrary(userId: string, libraryId: string, reason: string = 'inappropriate'): Promise<boolean> {
        const { data: existing } = await supabase.from('shared_library_reports').select('id').eq('user_id', userId).eq('shared_library_id', libraryId).maybeSingle();

        if (existing) {
            await supabase.from('shared_library_reports').delete().eq('id', existing.id);
            return false;
        } else {
            await supabase.from('shared_library_reports').insert({ user_id: userId, shared_library_id: libraryId, reason });
            return true;
        }
    }
};
