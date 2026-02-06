export type SyncStatus = 'synced' | 'created' | 'updated' | 'deleted';

export interface UserProfile {
    id: string;
    email: string;
    role: 'user' | 'admin';
    membership_level: 'BASIC' | 'PREMIUM' | 'PRO';
    created_at: string;
}

export interface Library {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    is_public: boolean;
    category: string | null;
    created_at: string;
    updated_at: string;
    // Offline support fields
    sync_status?: SyncStatus;
    last_synced_at?: string;
}

export interface Item {
    id: string;
    library_id: string;
    question: string;
    answer: string;
    memo: string | null;
    image_url: string | null;
    success_count: number;
    fail_count: number;
    last_reviewed_at: string | null;
    created_at: string;
    updated_at: string | null;
    // Offline support fields
    sync_status?: SyncStatus;
}

export interface SharedLibrary {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    download_count: number;
    thumbnail_url: string | null;
    created_by: string | null;
    created_at: string;
}

export interface SharedItem {
    id: string;
    shared_library_id: string;
    question: string;
    answer: string;
    memo: string | null;
    image_url: string | null;
    created_at: string;
}
