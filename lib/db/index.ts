import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const initDB = async () => {
    try {
        db = await SQLite.openDatabaseAsync('mem_app.db');

        // 1. Libraries Table
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS libraries (
                id TEXT PRIMARY KEY NOT NULL,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                category TEXT,
                is_public INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                sync_status TEXT DEFAULT 'synced',
                last_synced_at TEXT
            );
        `);

        // 2. Items Table
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS items (
                id TEXT PRIMARY KEY NOT NULL,
                library_id TEXT NOT NULL,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                memo TEXT,
                image_url TEXT,
                success_count INTEGER DEFAULT 0,
                fail_count INTEGER DEFAULT 0,
                last_reviewed_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT DEFAULT NULL,
                sync_status TEXT DEFAULT 'synced',
                FOREIGN KEY (library_id) REFERENCES libraries (id) ON DELETE CASCADE
            );
        `);

        // 3. Sync Queue Table
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS sync_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                table_name TEXT NOT NULL,
                action_type TEXT NOT NULL,
                row_id TEXT NOT NULL,
                data TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Local Database Initialized (Native).');
        return true;
    } catch (error) {
        console.error('Failed to init local database:', error);
        return false;
    }
};

export const runQuery = async (query: string, params: any[] = []) => {
    if (!db) {
        console.warn('DB not initialized');
        return [];
    }
    try {
        const result = await db.getAllAsync(query, params);
        return result;
    } catch (error) {
        console.error('Query Error:', error);
        return [];
    }
};

export const runCommand = async (query: string, params: any[] = []) => {
    if (!db) {
        console.warn('DB not initialized');
        return;
    }
    try {
        await db.runAsync(query, params);
    } catch (error) {
        console.error('Run Error:', error);
        throw error; // 에러를 상위로 전파하여 트랜잭션 실패 등을 알림
    }
};
