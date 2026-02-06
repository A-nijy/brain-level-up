// Web에서는 SQLite를 사용하지 않음 (Supabase 직접 사용)
export const initDB = async () => {
    console.log('SQLite is not supported on web. Skipping init.');
    return true;
};

export const runQuery = async (query: string, params: any[] = []) => {
    console.warn('runQuery called on Web (Should not happen if Platform check is correct)');
    return [];
};

export const runCommand = async (query: string, params: any[] = []) => {
    console.warn('runCommand called on Web (Should not happen if Platform check is correct)');
};
