import { supabase } from '@/lib/supabase';
import { SharedLibrary, SharedItem, Library, Item, SharedSection } from '@/types';
import { LibraryService } from './LibraryService';
import { ItemService } from './ItemService';

export const SharedLibraryService = {
    async getSharedLibraries(): Promise<SharedLibrary[]> {
        const { data, error } = await supabase
            .from('shared_libraries')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getSharedLibraryById(id: string): Promise<SharedLibrary | null> {
        const { data, error } = await supabase
            .from('shared_libraries')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async downloadLibrary(userId: string, sharedLibrary: SharedLibrary): Promise<Library> {
        // 1. Create new library for user
        const newLib = await LibraryService.createLibrary(userId, {
            title: sharedLibrary.title,
            description: sharedLibrary.description,
            category: sharedLibrary.category,
            is_public: false
        });

        // 2. Fetch shared sections
        const { data: sharedSections, error: sectionsError } = await supabase
            .from('shared_sections')
            .select('*')
            .eq('shared_library_id', sharedLibrary.id)
            .order('display_order', { ascending: true });

        if (sectionsError) throw sectionsError;

        if (sharedSections && sharedSections.length > 0) {
            for (const ss of sharedSections) {
                // Create section for user library
                const newSection = await LibraryService.createSection(newLib.id, ss.title);

                // Fetch items for this shared section
                const { data: sharedItems, error: itemsError } = await supabase
                    .from('shared_items')
                    .select('*')
                    .eq('shared_section_id', ss.id)
                    .order('created_at', { ascending: true });

                if (itemsError) throw itemsError;

                // Copy items to new section
                if (sharedItems && sharedItems.length > 0) {
                    const newItems = sharedItems.map(si => ({
                        library_id: newLib.id,
                        section_id: newSection.id,
                        question: si.question,
                        answer: si.answer,
                        memo: si.memo,
                        study_status: 'undecided' as const
                    }));

                    await ItemService.createItems(newItems);
                }
            }
        }

        // 4. Increment download count (RPC)
        await supabase.rpc('increment_download_count', { row_id: sharedLibrary.id });

        return newLib;
    },

    async getSharedSections(sharedLibraryId: string): Promise<SharedSection[]> {
        const { data, error } = await supabase
            .from('shared_sections')
            .select('*')
            .eq('shared_library_id', sharedLibraryId)
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getSharedItems(sharedSectionId: string): Promise<SharedItem[]> {
        const { data, error } = await supabase
            .from('shared_items')
            .select('*')
            .eq('shared_section_id', sharedSectionId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // New helper to get items for a shared library (used for full preview)
    async getSharedItemsByLibrary(sharedLibraryId: string): Promise<SharedItem[]> {
        const { data, error } = await supabase
            .from('shared_items')
            .select('*')
            .eq('shared_library_id', sharedLibraryId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    }
};
