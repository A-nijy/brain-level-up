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

        const totalDownloads = sharedData?.reduce((acc, curr) => acc + (curr.download_count || 0), 0) || 0;

        return {
            userCount: userCount || 0,
            libraryCount: libraryCount || 0,
            itemCount: itemCount || 0,
            totalDownloads,
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

        // 2. 단어들 가져오기
        const { data: items, error: itemsError } = await supabase
            .from('items')
            .select('*')
            .eq('library_id', libraryId);

        if (itemsError) throw itemsError;

        // 3. shared_libraries 에 추가
        const { data: sharedLib, error: sharedLibError } = await supabase
            .from('shared_libraries')
            .insert({
                title: library.title,
                description: library.description,
                category: library.category,
                created_by: library.user_id,
            })
            .select()
            .single();

        if (sharedLibError) throw sharedLibError;

        // 4. shared_items 에 추가
        if (items && items.length > 0) {
            const sharedItems = items.map(item => ({
                shared_library_id: sharedLib.id,
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
     * 공유 자료실 항목 삭제
     */
    async deleteSharedLibrary(sharedLibraryId: string) {
        const { error } = await supabase
            .from('shared_libraries')
            .delete()
            .eq('id', sharedLibraryId);

        if (error) throw error;
    },

    /**
     * 공유 자료실 항목 정보 수정
     */
    async updateSharedLibrary(sharedLibraryId: string, updates: { title?: string; description?: string; category?: string }) {
        const { error } = await supabase
            .from('shared_libraries')
            .update(updates)
            .eq('id', sharedLibraryId);

        if (error) throw error;
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
                is_read: false
            }));

            const { error: notifyError } = await supabase
                .from('notifications')
                .insert(notifications);

            if (notifyError) throw notifyError;
            console.log(`[AdminService] Broadcast success to ${users.length} users.`);
        } catch (error) {
            console.error('[AdminService] Broadcast failed:', error);
            throw error;
        }
    }
};
