export type SyncStatus = 'synced' | 'created' | 'updated' | 'deleted';

export interface UserProfile {
    id: string;
    email: string;
    role: 'user' | 'admin';
    membership_level: 'BASIC' | 'PREMIUM' | 'PRO';
    created_at: string;
}

export type Profile = UserProfile;

export interface Library {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    is_public: boolean;
    category: string | null;
    created_at: string;
    updated_at: string;
    display_order: number;
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
    display_order: number;
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

export interface StudyLog {
    id: string;
    user_id: string;
    study_date: string;
    items_count: number;
    correct_count: number;
    study_time_seconds: number;
    created_at: string;
}

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'SYSTEM' | 'STUDY_REMINDER' | 'PROMOTION';
    is_read: boolean;
    data: any;
    created_at: string;
}
