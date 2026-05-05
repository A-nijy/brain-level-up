import { runQuery, runCommand } from '../lib/db';
import { Item } from '@/types';
import { LogService } from './LogService';
import * as Crypto from 'expo-crypto';

/**
 * [Local-First] 문항 관련 비즈니스 로직을 담당하는 서비스
 * SQLite를 직접 사용하도록 리팩토링됨
 */
export const ItemService = {
    /**
     * 특정 섹션의 문항 목록 조회
     */
    async getItems(sectionId: string): Promise<Item[]> {
        const query = `
            SELECT * FROM items 
            WHERE section_id = ? 
            ORDER BY display_order ASC, created_at DESC, id ASC
        `;
        const data = await runQuery(query, [sectionId]);
        return data as Item[];
    },

    /**
     * 문항 상세 조회
     */
    async getItemById(id: string): Promise<Item | null> {
        const data = await runQuery('SELECT * FROM items WHERE id = ?', [id]);
        return data.length > 0 ? (data[0] as Item) : null;
    },

    /**
     * 새 문항 생성
     */
    async createItem(item: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'success_count' | 'fail_count' | 'display_order' | 'last_reviewed_at'>, silent = false): Promise<Item> {
        const id = Crypto.randomUUID();
        const now = new Date().toISOString();

        try {
            await runCommand(
                `INSERT INTO items (id, library_id, section_id, question, answer, memo, image_url, success_count, fail_count, study_status, display_order, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, item.library_id, item.section_id, item.question, item.answer, item.memo || '', item.image_url || '', 0, 0, 'undecided', 0, now, now]
            );

            const data = await this.getItemById(id);
            if (!data) throw new Error('Failed to retrieve created item');

            if (!silent) {
                LogService.logEvent('item_mutation', { 
                    action: 'create', 
                    id: data.id, 
                    library_id: item.library_id,
                    section_id: item.section_id,
                    question: item.question.substring(0, 50) 
                }).catch(() => {});
            }

            return data;
        } catch (error: any) {
            this._logError('문항 생성 실패', error, { question: item.question.substring(0, 50) });
            throw error;
        }
    },

    /**
     * 여러 아이템 한 번에 생성
     */
    async createItems(items: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'success_count' | 'fail_count' | 'display_order' | 'last_reviewed_at'>[], silent = false): Promise<Item[]> {
        if (items.length === 0) return [];
        
        try {
            const now = new Date().toISOString();
            const createdItems: Item[] = [];

            // SQLite allows multi-row insert, but parameter binding is tricky with many rows.
            // For stability, we'll use individual inserts for now, or a chunked approach.
            // Given typical bulk size is 10-100, individual inserts are okay on local DB.
            for (const item of items) {
                const id = Crypto.randomUUID();
                await runCommand(
                    `INSERT INTO items (id, library_id, section_id, question, answer, memo, image_url, success_count, fail_count, study_status, display_order, created_at, updated_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [id, item.library_id, item.section_id, item.question, item.answer, item.memo || '', item.image_url || '', 0, 0, 'undecided', 0, now, now]
                );
                
                // We could fetch all at once later, but let's just push IDs for now
                createdItems.push({ id } as Item); 
            }

            if (!silent) {
                LogService.logEvent('item_mutation', { 
                    action: 'create_bulk', 
                    count: items.length,
                    library_id: items[0].library_id,
                    section_id: items[0].section_id
                }).catch(() => {});
            }

            // Return full objects for the created items
            const ids = createdItems.map(i => i.id);
            const placeholders = ids.map(() => '?').join(',');
            const fullItems = await runQuery(`SELECT * FROM items WHERE id IN (${placeholders})`, ids);
            return fullItems as Item[];

        } catch (error: any) {
            this._logError('문항 일괄 생성 실패', error, { count: items.length });
            throw error;
        }
    },

    /**
     * 문항 수정
     */
    async updateItem(id: string, updates: Partial<Item>): Promise<Item> {
        try {
            const now = new Date().toISOString();
            const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
            const setClause = fields.map(f => `${f} = ?`).join(', ');
            const params = fields.map(f => (updates as any)[f]);

            await runCommand(
                `UPDATE items SET ${setClause}, updated_at = ? WHERE id = ?`,
                [...params, now, id]
            );

            const data = await this.getItemById(id);
            if (!data) throw new Error('Item not found after update');

            LogService.logEvent('item_mutation', { 
                action: 'update', 
                id: id, 
                library_id: data.library_id,
                section_id: data.section_id,
                updates: Object.keys(updates)
            }).catch(() => {});

            return data;
        } catch (error: any) {
            this._logError('문항 수정 실패', error, { id });
            throw error;
        }
    },

    /**
     * 문항 삭제
     */
    async deleteItem(id: string): Promise<void> {
        try {
            const item = await this.getItemById(id);
            await runCommand('DELETE FROM items WHERE id = ?', [id]);

            LogService.logEvent('item_mutation', { 
                action: 'delete', 
                id: id,
                library_id: item?.library_id,
                section_id: item?.section_id
            }).catch(() => {});
        } catch (error: any) {
            this._logError('문항 삭제 실패', error, { id });
            throw error;
        }
    },

    /**
     * 문항 순서 일괄 업데이트
     */
    async updateItemsOrder(updates: { id: string, display_order: number }[]): Promise<void> {
        for (const u of updates) {
            await runCommand('UPDATE items SET display_order = ? WHERE id = ?', [u.display_order, u.id]);
        }
    },

    /**
     * 특정 암기장 내 모든 문항 조회
     */
    async getItemsByLibrary(libraryId: string): Promise<Item[]> {
        const query = `
            SELECT * FROM items 
            WHERE library_id = ? 
            ORDER BY display_order ASC, created_at DESC
        `;
        const data = await runQuery(query, [libraryId]);
        return data as Item[];
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
