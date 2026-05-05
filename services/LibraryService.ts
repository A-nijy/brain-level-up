import { runQuery, runCommand } from '../lib/db';
import { Library, Section } from '@/types';
import { LogService } from './LogService';
import * as Crypto from 'expo-crypto';

/**
 * [Local-First] 개인 암기장 관련 비즈니스 로직을 담당하는 서비스
 * SQLite를 직접 사용하도록 리팩토링됨
 */
export const LibraryService = {
    /**
     * 사용자의 암기장 목록 조회
     */
    async getLibraries(userId: string): Promise<Library[]> {
        const query = `
            SELECT l.*, (SELECT COUNT(*) FROM items i WHERE i.library_id = l.id) as items_count 
            FROM libraries l 
            WHERE l.user_id = ? 
            ORDER BY l.display_order ASC, l.created_at DESC
        `;
        const data = await runQuery(query, [userId]);
        return data as Library[];
    },

    /**
     * ID로 암기장 상세 정보 조회
     */
    async getLibraryById(id: string): Promise<Library | null> {
        const data = await runQuery('SELECT * FROM libraries WHERE id = ?', [id]);
        return data.length > 0 ? (data[0] as Library) : null;
    },

    /**
     * 새 암기장 생성
     */
    async createLibrary(userId: string, library: Pick<Library, 'title' | 'description' | 'category' | 'is_public'>, silent = false): Promise<Library> {
        const id = Crypto.randomUUID();
        const now = new Date().toISOString();
        
        try {
            await runCommand(
                `INSERT INTO libraries (id, user_id, title, description, category, is_public, display_order, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, userId, library.title, library.description || '', library.category || '', library.is_public ? 1 : 0, 0, now, now]
            );

            const data = await this.getLibraryById(id);
            if (!data) throw new Error('Failed to retrieve created library');

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
            const now = new Date().toISOString();
            const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
            const setClause = fields.map(f => `${f} = ?`).join(', ');
            const params = fields.map(f => (updates as any)[f]);
            
            await runCommand(
                `UPDATE libraries SET ${setClause}, updated_at = ? WHERE id = ?`,
                [...params, now, id]
            );

            const data = await this.getLibraryById(id);
            if (!data) throw new Error('Library not found after update');

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
            await runCommand('DELETE FROM libraries WHERE id = ?', [id]);

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
        for (const u of updates) {
            await runCommand('UPDATE libraries SET display_order = ? WHERE id = ?', [u.display_order, u.id]);
        }
    },

    /**
     * 특정 암기장의 섹션 목록 조회
     */
    async getSections(libraryId: string): Promise<Section[]> {
        const data = await runQuery(
            'SELECT * FROM library_sections WHERE library_id = ? ORDER BY display_order ASC, created_at ASC',
            [libraryId]
        );
        return data as Section[];
    },

    /**
     * ID로 섹션 정보 조회
     */
    async getSectionById(id: string): Promise<Section | null> {
        const data = await runQuery('SELECT * FROM library_sections WHERE id = ?', [id]);
        return data.length > 0 ? (data[0] as Section) : null;
    },

    /**
     * 새 섹션 생성
     */
    async createSection(libraryId: string, title: string, silent = false): Promise<Section> {
        const id = Crypto.randomUUID();
        const now = new Date().toISOString();

        try {
            await runCommand(
                'INSERT INTO library_sections (id, library_id, title, display_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                [id, libraryId, title, 0, now, now]
            );

            const data = await this.getSectionById(id);
            if (!data) throw new Error('Failed to retrieve created section');

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
            const now = new Date().toISOString();
            const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
            const setClause = fields.map(f => `${f} = ?`).join(', ');
            const params = fields.map(f => (updates as any)[f]);

            await runCommand(
                `UPDATE library_sections SET ${setClause}, updated_at = ? WHERE id = ?`,
                [...params, now, id]
            );

            const data = await this.getSectionById(id);
            if (!data) throw new Error('Section not found after update');

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
            await runCommand('DELETE FROM library_sections WHERE id = ?', [id]);

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
    async updateSectionsOrder(updates: { id: string, display_order: number }[]): Promise<void> {
        for (const u of updates) {
            await runCommand('UPDATE library_sections SET display_order = ? WHERE id = ?', [u.display_order, u.id]);
        }
    },

    /**
     * 암기장 생성 가능 여부 확인
     */
    async checkCreateAccess(userId: string, profile: any): Promise<{ status: 'GRANTED' | 'REQUIRE_AD' | 'DENIED' }> {
        // 로컬 버전에서는 광고나 제한 없이 항상 허용
        return { status: 'GRANTED' };
    },

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
