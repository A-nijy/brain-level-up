import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';

export const AdminService = {
    /**
     * 전체 사용자 목록 조회 (관리자 전용)
     */
    async getAllUsers(): Promise<Profile[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

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

    /**
     * 사용자의 역할(role) 또는 멤버십 레벨 변경
     */
    async updateUserProfile(userId: string, updates: Partial<Profile>): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) throw error;
    },

    /**
     * 앱 전체 통계 조회
     */
    async getGlobalStats() {
        // 1. 총 사용자 수
        const { count: userCount, error: userError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // 2. 총 암기장 수
        const { count: libraryCount, error: libError } = await supabase
            .from('libraries')
            .select('*', { count: 'exact', head: true });

        // 3. 총 암기 항목(Item) 수
        const { count: itemCount, error: itemError } = await supabase
            .from('items')
            .select('*', { count: 'exact', head: true });

        // 4. 공유 자료실 총 다운로드 수
        const { data: sharedData, error: sharedError } = await supabase
            .from('shared_libraries')
            .select('download_count');

        if (userError || libError || itemError || sharedError) {
            throw userError || libError || itemError || sharedError;
        }

        // 5. 최근 5명의 새 멤버(활동 로그 용)
        const { data: recentProfiles, error: recentError } = await supabase
            .from('profiles')
            .select('email, created_at, role')
            .order('created_at', { ascending: false })
            .limit(5);

        if (recentError) throw recentError;

        const totalDownloads = sharedData?.reduce((acc, curr) => acc + (curr.download_count || 0), 0) || 0;

        const activities = (recentProfiles || []).map(p => ({
            id: p.email,
            type: p.role === 'admin' ? 'admin_joined' : 'user_joined',
            message: `새로운 사용자가 가입했습니다: ${p.email || '익명'}`,
            created_at: p.created_at
        }));

        return {
            userCount: userCount || 0,
            libraryCount: libraryCount || 0,
            itemCount: itemCount || 0,
            totalDownloads,
            activities
        };
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
     * 공유 자료실에서 자료 삭제 (섹션, 단어 포함 삭제)
     */
    async deleteSharedLibrary(libraryId: string) {
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
     * 공개 암기장을 공유 자료실에 게시
     */
    async publishToShared(libraryId: string) {
        // 1. 암기장 정보 가져오기
        const { data: library, error: libError } = await supabase
            .from('libraries')
            .select('*')
            .eq('id', libraryId)
            .single();

        if (libError) throw libError;

        // 2. 섹션 가져오기
        const { data: sections, error: sectionsError } = await supabase
            .from('library_sections')
            .select('*')
            .eq('library_id', libraryId)
            .order('display_order', { ascending: true });

        if (sectionsError) throw sectionsError;

        // 3. 단어들 가져오기
        const { data: items, error: itemsError } = await supabase
            .from('items')
            .select('*')
            .eq('library_id', libraryId);

        if (itemsError) throw itemsError;

        // 4. shared_libraries 에 추가
        const { data: sharedLib, error: sharedLibError } = await supabase
            .from('shared_libraries')
            .insert({
                title: library.title,
                description: library.description,
                category: library.category,
                category_id: library.category_id,
                created_by: library.user_id,
            })
            .select()
            .single();

        if (sharedLibError) throw sharedLibError;

        // 5. 섹션 복제 및 매핑
        const sectionIdMap: Record<string, string> = {};
        if (sections && sections.length > 0) {
            for (const section of sections) {
                const { data: newSharedSection, error: nsError } = await supabase
                    .from('shared_sections')
                    .insert({
                        shared_library_id: sharedLib.id,
                        title: section.title,
                        display_order: section.display_order
                    })
                    .select()
                    .single();

                if (nsError) throw nsError;
                sectionIdMap[section.id] = newSharedSection.id;
            }
        } else {
            // 섹션이 하나도 없는 경우 기본 섹션 생성
            const { data: defaultSection, error: dsError } = await supabase
                .from('shared_sections')
                .insert({
                    shared_library_id: sharedLib.id,
                    title: '기본 섹션',
                    display_order: 0
                })
                .select()
                .single();
            if (dsError) throw dsError;
            // 모든 아이템을 이 섹션에 할당 (아이템의 section_id가 null이거나 다를 수 있으므로)
            sectionIdMap['default'] = defaultSection.id;
        }

        // 6. shared_items 에 추가 (섹션 매핑 포함)
        if (items && items.length > 0) {
            const defaultSharedSectionId = Object.values(sectionIdMap)[0];
            const sharedItems = items.map(item => ({
                shared_library_id: sharedLib.id,
                shared_section_id: (item.section_id && sectionIdMap[item.section_id]) ? sectionIdMap[item.section_id] : defaultSharedSectionId,
                question: item.question,
                answer: item.answer,
                memo: item.memo,
                image_url: item.image_url,
            }));

            const { error: sharedItemsError } = await supabase
                .from('shared_items')
                .insert(sharedItems);

            if (sharedItemsError) throw sharedItemsError;
        }

        return sharedLib;
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
        // 1. shared_libraries 에 추가
        const { data: sharedLib, error: sharedLibError } = await supabase
            .from('shared_libraries')
            .insert({
                title: data.title,
                description: data.description,
                category_id: data.category_id,
                created_by: data.adminId,
            })
            .select()
            .single();

        if (sharedLibError) throw sharedLibError;

        // 2. 기본 섹션 생성 (직접 게시는 항상 섹션을 가짐)
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

        // 3. shared_items 에 추가
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
            .update({ is_draft: false })
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
        // 1. 모든 섹션 조회
        const { data: sections } = await supabase
            .from('shared_sections')
            .select('id')
            .eq('shared_library_id', draftId);

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
            .eq('shared_library_id', draftId);

        // 4. Draft 자료 삭제
        const { error } = await supabase
            .from('shared_libraries')
            .delete()
            .eq('id', draftId);

        if (error) throw error;
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
     * 모든 사용자에게 알림 발송 (관리자 전용)
     */
    async broadcastNotification(title: string, message: string, type: string = 'SYSTEM') {
        try {
            console.log('[AdminService] Starting broadcast:', { title, message });

            // 1. 모든 사용자 ID 조회
            const { data: users, error: userError } = await supabase
                .from('profiles')
                .select('id');

            if (userError) throw userError;
            if (!users || users.length === 0) return;

            // 2. 대량 인서트
            const notifications = users.map(user => ({
                user_id: user.id,
                title,
                message,
                type,
                is_read: false,
            }));

            const { error: insertError } = await supabase
                .from('notifications')
                .insert(notifications);

            if (insertError) throw insertError;
            console.log('[AdminService] Broadcast completed.');
        } catch (error) {
            console.error('[AdminService] Broadcast Error:', error);
            throw error;
        }
    },

    /**
     * 특정 사용자 이메일로 알림 단일 발송 (관리자 전용)
     */
    async sendNotificationToUser(email: string, title: string, message: string, type: string = 'SYSTEM') {
        try {
            console.log(`[AdminService] Sending notification to ${email}:`, { title, message });

            // 1. 이메일로 사용자 ID 조회
            const { data: user, error: userError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single();

            if (userError || !user) {
                throw new Error('해당 이메일을 가진 사용자를 찾을 수 없습니다.');
            }

            // 2. 알림 인서트
            const { error: insertError } = await supabase
                .from('notifications')
                .insert({
                    user_id: user.id,
                    title,
                    message,
                    type,
                    is_read: false,
                });

            if (insertError) throw insertError;
            console.log(`[AdminService] Notification sent to ${email} successfully.`);
        } catch (error) {
            console.error('[AdminService] Send Notification Error:', error);
            throw error;
        }
    }
};
