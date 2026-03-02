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
    category: string | null;
    category_id: string | null;
    download_count: number;
    thumbnail_url: string | null;
    created_by: string | null;
    created_at: string;
    is_draft: boolean;
    is_official: boolean;
    tags: string[] | null;
    report_count: number;
    is_hidden: boolean;
    display_order: number;
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
    shared_section_id: string;
    question: string;
    answer: string;
    memo: string | null;
    image_url: string | null;
    created_at: string;
    display_order: number;
}
