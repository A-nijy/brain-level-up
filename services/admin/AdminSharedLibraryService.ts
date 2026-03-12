import { supabase } from '@/lib/supabase';
import { SharedLibraryManagementService } from '../SharedLibraryManagementService';
import { LogService } from '../LogService';

export const AdminSharedLibraryService = {
    /**
     * 유저들이 등록한 공유 자료 전체 조회 (관리자 전용)
     */
    async getUserSharedLibraries() {
        const { data, error } = await supabase
            .from('shared_libraries')
            .select('*, profiles:created_by(email), shared_library_categories(title)')
            .eq('is_official', false)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(lib => ({
            ...lib,
            owner_email: lib.profiles?.email,
            category: lib.shared_library_categories?.title || lib.category
        }));
    },

    /**
     * 모든 공개 암기장 목록 조회 (공유 자료실 게시 후보)
     */
    async getPublicLibraries() {
        const { data, error } = await supabase
            .from('libraries')
            .select('*, profiles(email)')
            .eq('is_public', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * 공유 자료실에서 자료 삭제 (공통 서비스 활용)
     */
    async deleteSharedLibrary(libraryId: string) {
        await SharedLibraryManagementService.deleteSharedLibraryCascade(libraryId);
    },

    /**
     * 공개 암기장을 공유 자료실에 게시
     */
    async publishToShared(libraryId: string) {
        try {
            // 1. 암기장 정보 가져오기
            const { data: library, error: libError } = await supabase
                .from('libraries')
                .select('*')
                .eq('id', libraryId)
                .single();

            if (libError) throw libError;

            // 2. shared_libraries 에 추가 (마지막 순서 다음으로)
            const nextOrder = await SharedLibraryManagementService.getNextDisplayOrder('shared_libraries');

            const { data: sharedLib, error: sharedLibError } = await supabase
                .from('shared_libraries')
                .insert({
                    title: library.title,
                    description: library.description,
                    category_id: library.category_id,
                    created_by: library.user_id,
                    is_official: true,
                    display_order: nextOrder
                })
                .select()
                .single();

            if (sharedLibError) throw sharedLibError;

            // 3. 데이터 복제 (공통 서비스 활용)
            await SharedLibraryManagementService.copyLibraryDataToShared(libraryId, sharedLib.id);

            return sharedLib;
        } catch (error: any) {
            LogService.logEvent('app_error', {
                summary: '공식 자료 게시 실패',
                message: error.message,
                libraryId
            }).catch(() => {});
            throw error;
        }
    },

    /**
     * 공유 자료실 항목 정보 수정
     */
    async updateSharedLibrary(sharedLibraryId: string, updates: { title?: string; description?: string; category?: string; category_id?: string | null }) {
        const { error } = await supabase
            .from('shared_libraries')
            .update(updates)
            .eq('id', sharedLibraryId);

        if (error) throw error;
    },

    /**
     * 신규 공유 단어장 직접 시 (라이브러리+아이템 한꺼번에)
     */
    async publishDirectly(data: {
        title: string;
        description: string;
        category_id: string | null;
        items: { question: string; answer: string; memo?: string }[];
        adminId: string;
    }) {
        try {
            // 공통 서비스 활용
            const nextOrder = await SharedLibraryManagementService.getNextDisplayOrder('shared_libraries');

            const { data: sharedLib, error: sharedLibError } = await supabase
                .from('shared_libraries')
                .insert({
                    title: data.title,
                    description: data.description,
                    category_id: data.category_id,
                    created_by: data.adminId,
                    is_official: true,
                    display_order: nextOrder
                })
                .select()
                .single();

            if (sharedLibError) throw sharedLibError;

            const { data: sharedSection, error: sectionError } = await supabase
                .from('shared_sections')
                .insert({
                    shared_library_id: sharedLib.id,
                    title: '기본 섹션',
                    display_order: 0
                })
                .select()
                .single();

            if (sectionError) throw sectionError;

            if (data.items.length > 0) {
                const sharedItems = data.items.map(item => ({
                    shared_library_id: sharedLib.id,
                    shared_section_id: sharedSection.id,
                    question: item.question,
                    answer: item.answer,
                    memo: item.memo,
                }));

                const { error: sharedItemsError } = await supabase
                    .from('shared_items')
                    .insert(sharedItems);

                if (sharedItemsError) throw sharedItemsError;
            }

            return sharedLib;
        } catch (error: any) {
            LogService.logEvent('app_error', {
                summary: '직접 게시 실패',
                message: error.message,
                title: data.title
            }).catch(() => {});
            throw error;
        }
    },

    /**
     * Draft 상태의 공유 자료 생성
     */
    async createDraftSharedLibrary(data: {
        title: string;
        description: string;
        category_id: string | null;
        adminId: string;
    }) {
        const { data: draft, error } = await supabase
            .from('shared_libraries')
            .insert({
                title: data.title,
                description: data.description,
                category_id: data.category_id,
                created_by: data.adminId,
                is_official: true, // 관리자가 작성하는 초안이므로 공식 자료로 설정
                is_draft: true
            })
            .select()
            .single();

        if (error) throw error;
        return draft;
    },

    /**
     * Draft 목록 조회
     */
    async getDraftSharedLibraries() {
        const { data, error } = await supabase
            .from('shared_libraries')
            .select('*, shared_library_categories(title)')
            .eq('is_draft', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(lib => ({
            ...lib,
            category: lib.shared_library_categories?.title || lib.category
        }));
    },

    /**
     * Draft를 정식 게시로 전환
     */
    async publishDraftSharedLibrary(draftId: string) {
        const { error } = await supabase
            .from('shared_libraries')
            .update({
                is_draft: false,
                is_official: true // 게시 시 공식 자료임을 확정
            })
            .eq('id', draftId);

        if (error) throw error;
    },

    /**
     * 게시된 자료를 임시 저장으로 되돌림
     */
    async unpublishSharedLibrary(libraryId: string) {
        const { error } = await supabase
            .from('shared_libraries')
            .update({ is_draft: true })
            .eq('id', libraryId);

        if (error) throw error;
    },

    /**
     * Draft 삭제 (섹션, 단어 포함 cascade 삭제)
     */
    async deleteDraftSharedLibrary(draftId: string) {
        return this.deleteSharedLibrary(draftId);
    },

    /**
     * 관리자 본인의 개인 암기장 목록 조회
     */
    async getAdminPersonalLibraries(adminId: string) {
        const { data, error } = await supabase
            .from('libraries')
            .select('*')
            .eq('user_id', adminId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * 공유 자료실 순서 대량 업데이트
     */
    async reorderSharedLibraries(updates: { id: string; display_order: number }[]) {
        const promises = updates.map(u =>
            supabase.from('shared_libraries').update({ display_order: u.display_order }).eq('id', u.id)
        );
        const results = await Promise.all(promises);
        const firstError = results.find(r => r.error)?.error;
        if (firstError) throw firstError;
    },

    /**
     * 공유 자료 숨김 상태 토글 (관리자 강제 조치)
     */
    async toggleSharedLibraryHidden(id: string, isHidden: boolean) {
        const { error } = await supabase
            .from('shared_libraries')
            .update({ is_hidden: isHidden })
            .eq('id', id);

        if (error) throw error;
    },
};
