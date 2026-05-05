import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const initDB = async () => {
    try {
        db = await SQLite.openDatabaseAsync('mem_app.db');

        // Enable foreign keys
        await db.execAsync('PRAGMA foreign_keys = ON;');

        // 0. Profiles Table
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY NOT NULL,
                email TEXT,
                nickname TEXT,
                user_id_number TEXT,
                role TEXT DEFAULT 'user',
                membership_level TEXT DEFAULT 'BASIC',
                created_at TEXT NOT NULL
            );
        `);

        // 1. Libraries Table
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS libraries (
                id TEXT PRIMARY KEY NOT NULL,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                category TEXT,
                is_public INTEGER DEFAULT 0,
                display_order INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                sync_status TEXT DEFAULT 'synced',
                last_synced_at TEXT,
                FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE
            );
        `);

        // 2. Library Sections Table
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS library_sections (
                id TEXT PRIMARY KEY NOT NULL,
                library_id TEXT NOT NULL,
                title TEXT NOT NULL,
                display_order INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (library_id) REFERENCES libraries (id) ON DELETE CASCADE
            );
        `);

        // 3. Items Table
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS items (
                id TEXT PRIMARY KEY NOT NULL,
                library_id TEXT NOT NULL,
                section_id TEXT,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                memo TEXT,
                image_url TEXT,
                success_count INTEGER DEFAULT 0,
                fail_count INTEGER DEFAULT 0,
                study_status TEXT DEFAULT 'undecided',
                display_order INTEGER DEFAULT 0,
                last_reviewed_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                sync_status TEXT DEFAULT 'synced',
                FOREIGN KEY (library_id) REFERENCES libraries (id) ON DELETE CASCADE,
                FOREIGN KEY (section_id) REFERENCES library_sections (id) ON DELETE CASCADE
            );
        `);

        // 4. Study Logs Table
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS study_logs (
                id TEXT PRIMARY KEY NOT NULL,
                user_id TEXT NOT NULL,
                study_date TEXT NOT NULL,
                items_count INTEGER DEFAULT 0,
                correct_count INTEGER DEFAULT 0,
                study_time_seconds INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                UNIQUE(user_id, study_date),
                FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE
            );
        `);

        // 5. Notifications Table
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY NOT NULL,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                type TEXT DEFAULT 'SYSTEM',
                is_read INTEGER DEFAULT 0,
                data TEXT DEFAULT '{}',
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE
            );
        `);

        // 6. Inquiries Table
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS inquiries (
                id TEXT PRIMARY KEY NOT NULL,
                user_id TEXT NOT NULL,
                category TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                is_resolved INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE
            );
        `);

        // 7. App Logs Table
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS app_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                event_type TEXT NOT NULL,
                metadata TEXT,
                created_at TEXT NOT NULL
            );
        `);

        // 8. Sync Queue Table (Legacy - but keep for now to avoid crashes)
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

        console.log('Local Database Initialized (Full Schema).');
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
