import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';
import { runQuery, runCommand } from '@/lib/db';
import { Library, Item } from '@/types';

export const SyncService = {
    // 네트워크 상태 확인
    async isOnline(): Promise<boolean> {
        const state = await NetInfo.fetch();
        return state.isConnected && state.isInternetReachable ? true : false;
    },

    // 동기화 메인 함수
    async sync(userId: string) {
        const online = await this.isOnline();
        if (!online) return;

        console.log('Starting Sync...');
        try {
            await this.pushChanges();
            await this.pullChanges(userId);
            console.log('Sync Completed.');
        } catch (error) {
            console.error('Sync process failed:', error);
        }
    },

    // 1. Push: 로컬에서 변경된 사항을 서버로 전송 (Sync Queue 처리)
    async pushChanges() {
        const online = await this.isOnline();
        if (!online) {
            console.log('Offline: Skipping pushChanges');
            return;
        }

        // sync_queue에서 대기 중인 작업 가져오기
        const queue: any[] = await runQuery('SELECT * FROM sync_queue ORDER BY id ASC');
        if (queue.length === 0) return;

        console.log(`Pushing ${queue.length} changes to server...`);

        for (const task of queue) {
            const { id, table_name, action_type, row_id, data } = task;
            const payload = data ? JSON.parse(data) : null;

            try {
                if (action_type === 'INSERT' || action_type === 'UPDATE') {
                    // Upsert to Supabase
                    const { error } = await supabase
                        .from(table_name)
                        .upsert(payload);

                    if (error) throw error;
                } else if (action_type === 'DELETE') {
                    // Delete from Supabase
                    const { error } = await supabase
                        .from(table_name)
                        .delete()
                        .eq('id', row_id);

                    if (error) throw error;
                }

                // 성공 시 큐에서 제거
                await runCommand('DELETE FROM sync_queue WHERE id = ?', [id]);

            } catch (error) {
                console.error(`Failed to push task ${id}:`, error);
                // 네트워크 에러 등이 발생하면 루프 중단하고 다음 기회에 시도
                return;
            }
        }
    },

    // 2. Pull: 서버에서 최신 데이터를 받아와 로컬 DB 업데이트
    async pullChanges(userId: string) {
        // Libraries 동기화
        const { data: libraries, error: libError } = await supabase
            .from('libraries')
            .select('*')
            .eq('user_id', userId);

        if (libError) throw libError;

        if (libraries && libraries.length > 0) {
            for (const lib of libraries) {
                await runCommand(`
                    INSERT OR REPLACE INTO libraries (id, user_id, title, description, category, is_public, created_at, updated_at, sync_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced')
                `, [lib.id, lib.user_id, lib.title, lib.description, lib.category, lib.is_public ? 1 : 0, lib.created_at, lib.updated_at]);
            }
        }

        // 모든 Library의 Items 동기화 (간단한 구현을 위해 전체 로드)
        if (libraries) {
            for (const lib of libraries) {
                const { data: items, error: itemError } = await supabase
                    .from('items')
                    .select('*')
                    .eq('library_id', lib.id);

                if (!itemError && items) {
                    for (const item of items) {
                        // 중요: nullable 필드에 대해 undefined가 아닌 null로 처리해야 SQLite 에러가 안 남
                        await runCommand(`
                            INSERT OR REPLACE INTO items (id, library_id, question, answer, memo, image_url, success_count, fail_count, last_reviewed_at, created_at, updated_at, sync_status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
                        `, [
                            item.id,
                            item.library_id,
                            item.question,
                            item.answer,
                            item.memo || null,
                            item.image_url || null,
                            item.success_count || 0,
                            item.fail_count || 0,
                            item.last_reviewed_at || null,
                            item.created_at,
                            item.updated_at || null
                        ]);
                    }
                }
            }
        }
    }
};
