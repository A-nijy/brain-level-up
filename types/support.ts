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
    user_nickname?: string;
    user_id_number?: number;
    user_email?: string;
}
