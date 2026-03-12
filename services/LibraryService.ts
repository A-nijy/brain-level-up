import { supabase } from '@/lib/supabase';
import { Library, Section } from '@/types';
import { LogService } from './LogService';

/**
 * [Refactored] 개인 암기장 관련 비즈니스 로직을 담당하는 서비스
 * SRP 준수: 데이터 접근 및 관련 로깅 책임만 가짐
 */
export const LibraryService = {
    /**
     * 사용자의 암기장 목록 조회
     */
    async getLibraries(userId: string): Promise<Library[]> {
        const { data, error } = await supabase
            .from('libraries')
            .select('*, items:items(count)')
            .eq('user_id', userId)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((lib: any) => ({
            ...lib,
            items_count: lib.items?.[0]?.count || 0
        }));
    },

    /**
     * ID로 암기장 상세 정보 조회
     */
    async getLibraryById(id: string): Promise<Library | null> {
        const { data, error } = await supabase
            .from('libraries')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    /**
     * 새 암기장 생성
     */
    async createLibrary(userId: string, library: Pick<Library, 'title' | 'description' | 'category' | 'is_public'>, silent = false): Promise<Library> {
        try {
            const { data, error } = await supabase
                .from('libraries')
                .insert({
                    user_id: userId,
                    ...library
                })
                .select()
                .single();

            if (error) throw error;

            if (!silent) {
                await LogService.logEvent('library_mutation', { 
                    action: 'create', 
                    id: data.id, 
                    title: data.title 
                });
            }

            return data;
        } catch (error: any) {
            await this._logError('암기장 생성 실패', error, { title: library.title });
            throw error;
        }
    },

    /**
     * 암기장 정보 수정
     */
    async updateLibrary(id: string, updates: Partial<Library>): Promise<Library> {
        try {
            const { data, error } = await supabase
                .from('libraries')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            await LogService.logEvent('library_mutation', { 
                action: 'update', 
                id: id, 
                title: data.title,
                updates: Object.keys(updates)
            });

            return data;
        } catch (error: any) {
            await this._logError('암기장 수정 실패', error, { id });
            throw error;
        }
    },

    /**
     * 암기장 삭제
     */
    async deleteLibrary(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('libraries')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await LogService.logEvent('library_mutation', { 
                action: 'delete', 
                id: id 
            });
        } catch (error: any) {
            await this._logError('암기장 삭제 실패', error, { id });
            throw error;
        }
    },

    /**
     * 암기장 순서 일괄 업데이트
     */
    async updateLibrariesOrder(updates: { id: string, display_order: number }[]): Promise<void> {
        const promises = updates.map(u =>
            supabase.from('libraries').update({ display_order: u.display_order }).eq('id', u.id)
        );
        const results = await Promise.all(promises);
        const firstError = results.find(r => r.error)?.error;
        if (firstError) throw firstError;
    },

    /**
     * 특정 암기장의 섹션 목록 조회
     */
    async getSections(libraryId: string): Promise<Section[]> {
        const { data, error } = await supabase
            .from('library_sections')
            .select('*')
            .eq('library_id', libraryId)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * ID로 섹션 정보 조회
     */
    async getSectionById(id: string): Promise<Section | null> {
        const { data, error } = await supabase
            .from('library_sections')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    /**
     * 새 섹션 생성
     */
    async createSection(libraryId: string, title: string, silent = false): Promise<Section> {
        try {
            const { data, error } = await supabase
                .from('library_sections')
                .insert({ library_id: libraryId, title })
                .select()
                .single();

            if (error) throw error;

            if (!silent) {
                await LogService.logEvent('section_mutation', { 
                    action: 'create', 
                    id: data.id, 
                    library_id: libraryId,
                    title: data.title 
                });
            }

            return data;
        } catch (error: any) {
            await this._logError('섹션 생성 실패', error, { libraryId, title });
            throw error;
        }
    },

    /**
     * 섹션 정보 수정
     */
    async updateSection(id: string, updates: Partial<Section>): Promise<Section> {
        try {
            const { data, error } = await supabase
                .from('library_sections')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            await LogService.logEvent('section_mutation', { 
                action: 'update', 
                id: id, 
                title: data.title,
                updates: Object.keys(updates)
            });

            return data;
        } catch (error: any) {
            await this._logError('섹션 수정 실패', error, { id });
            throw error;
        }
    },

    /**
     * 섹션 삭제
     */
    async deleteSection(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('library_sections')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await LogService.logEvent('section_mutation', { 
                action: 'delete', 
                id: id 
            });
        } catch (error: any) {
            await this._logError('섹션 삭제 실패', error, { id });
            throw error;
        }
    },

    /**
     * 섹션 순서 일괄 업데이트
     */
    /**
     * 섹션 순서 일괄 업데이트
     */
    async updateSectionsOrder(updates: { id: string, display_order: number }[]): Promise<void> {
        const promises = updates.map(u =>
            supabase.from('library_sections').update({ display_order: u.display_order }).eq('id', u.id)
        );
        const results = await Promise.all(promises);
        const firstError = results.find(r => r.error)?.error;
        if (firstError) throw firstError;
    },

    /**
     * 암기장 생성 가능 여부 확인 (멤버십 등급 및 현재 생성된 암기장 수 기준)
     */
    async checkCreateAccess(userId: string, profile: any): Promise<{ status: 'GRANTED' | 'REQUIRE_AD' | 'DENIED' }> {
        const { count, error } = await supabase
            .from('libraries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (error) throw error;

        const { MembershipService } = require('./MembershipService'); // 순환 참조 방지
        const access = MembershipService.checkAccess('CREATE_LIBRARY', profile, { currentCount: count || 0 });
        
        return { status: access.status as any };
    },

    /**
     * 섹션 순서 일괄 업데이트

    /**
     * 내부 에러 로깅 헬퍼
     */
    async _logError(summary: string, error: any, metadata: any = {}) {
        await LogService.logEvent('app_error', {
            summary,
            message: error.message,
            ...metadata
        }).catch(() => {});
    }
};
