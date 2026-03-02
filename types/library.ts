import { SyncStatus, StudyStatus } from './common';

export interface Library {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    is_public: boolean;
    category: string | null;
    category_id?: string | null;
    created_at: string;
    display_order: number;
    items_count?: number;
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
    section_id: string;
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
    sync_status?: SyncStatus;
}
