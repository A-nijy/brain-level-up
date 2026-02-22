export type SyncStatus = 'synced' | 'created' | 'updated' | 'deleted';
export type StudyStatus = 'learned' | 'confused' | 'undecided';

export interface UserProfile {
    id: string;
    email: string;
    nickname: string;
    user_id_number: number;
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
    category_id?: string | null; // added for shared category ref
    created_at: string;
    display_order: number;
    items_count?: number;
    // Offline support fields
    sync_status?: SyncStatus;
    last_synced_at?: string;
}

export interface Section {
    id: string;
    library_id: string;
    title: string;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface Item {
    id: string;
    library_id: string;
    section_id: string; // added
    question: string;
    answer: string;
    memo: string | null;
    image_url: string | null;
    success_count: number;
    fail_count: number;
    study_status: StudyStatus;
    last_reviewed_at: string | null;
    created_at: string;
    updated_at: string | null;
    display_order: number;
    // Offline support fields
    sync_status?: SyncStatus;
}

export interface SharedLibraryCategory {
    id: string;
    title: string;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface SharedLibrary {
    id: string;
    title: string;
    description: string | null;
    category: string | null; // legacy or display name
    category_id: string | null; // added
    download_count: number;
    thumbnail_url: string | null;
    created_by: string | null;
    created_at: string;
    is_draft: boolean; // added for draft workflow
    // Optional join
    shared_library_categories?: SharedLibraryCategory;
}

export interface SharedSection {
    id: string;
    shared_library_id: string;
    title: string;
    display_order: number;
    created_at: string;
}

export interface SharedItem {
    id: string;
    shared_library_id: string;
    shared_section_id: string; // added
    question: string;
    answer: string;
    memo: string | null;
    image_url: string | null;
    created_at: string;
    display_order: number; // added
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

export interface Notice {
    id: string;
    title: string;
    content: string;
    is_important: boolean;
    created_at: string;
    updated_at: string;
}

export type InquiryCategory = 'Q&A' | '건의사항' | '버그';

export interface Inquiry {
    id: string;
    user_id: string;
    category: InquiryCategory;
    title: string;
    content: string;
    is_resolved: boolean;
    created_at: string;
    // For admin view
    user_nickname?: string;
    user_id_number?: number;
    user_email?: string;
}
