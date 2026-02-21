import { supabase } from '@/lib/supabase';
import { SharedLibrary, SharedItem, Library, Item, SharedSection, SharedLibraryCategory } from '@/types';
import { LibraryService } from './LibraryService';
import { ItemService } from './ItemService';

export const SharedLibraryService = {
    async getSharedLibraries(categoryId?: string): Promise<SharedLibrary[]> {
        let query = supabase
            .from('shared_libraries')
            .select('*, shared_library_categories(title)')
            .eq('is_draft', false)
            .order('created_at', { ascending: false });

        if (categoryId && categoryId !== 'all') {
            query = query.eq('category_id', categoryId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Map join results to category field if needed for display
        return (data || []).map(lib => ({
            ...lib,
            category: lib.shared_library_categories?.title || lib.category
        }));
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
                        image_url: si.image_url,
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
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: true }); // Fallback sorting

        if (error) throw error;
        return data || [];
    },

    async getSharedSectionById(sectionId: string): Promise<SharedSection | null> {
        const { data, error } = await supabase
            .from('shared_sections')
            .select('*')
            .eq('id', sectionId)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async getSharedItems(sharedSectionId: string): Promise<SharedItem[]> {
        const { data, error } = await supabase
            .from('shared_items')
            .select('*')
            .eq('shared_section_id', sharedSectionId)
            .order('display_order', { ascending: true })
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
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getSharedCategories(): Promise<SharedLibraryCategory[]> {
        const { data, error } = await supabase
            .from('shared_library_categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async createSharedSection(sharedLibraryId: string, title: string): Promise<any> {
        // Get current max display_order
        const { data: sections } = await supabase
            .from('shared_sections')
            .select('display_order')
            .eq('shared_library_id', sharedLibraryId)
            .order('display_order', { ascending: false })
            .limit(1);

        const nextOrder = sections && sections.length > 0 ? sections[0].display_order + 1 : 0;

        const { data, error } = await supabase
            .from('shared_sections')
            .insert({
                shared_library_id: sharedLibraryId,
                title: title,
                display_order: nextOrder
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateSharedSection(sectionId: string, updates: { title?: string }): Promise<void> {
        const { error } = await supabase
            .from('shared_sections')
            .update(updates)
            .eq('id', sectionId);

        if (error) throw error;
    },

    async deleteSharedSection(sectionId: string): Promise<void> {
        // Delete all items in this section first
        const { error: itemsError } = await supabase
            .from('shared_items')
            .delete()
            .eq('shared_section_id', sectionId);

        if (itemsError) throw itemsError;

        // Then delete the section
        const { error } = await supabase
            .from('shared_sections')
            .delete()
            .eq('id', sectionId);

        if (error) throw error;
    },

    async reorderSharedSections(updates: { id: string; display_order: number }[]): Promise<void> {
        const promises = updates.map(u =>
            supabase.from('shared_sections').update({ display_order: u.display_order }).eq('id', u.id)
        );
        const results = await Promise.all(promises);
        const firstError = results.find(r => r.error)?.error;
        if (firstError) throw firstError;
    },

    async reorderSharedItems(updates: { id: string; display_order: number }[]): Promise<void> {
        const promises = updates.map(u =>
            supabase.from('shared_items').update({ display_order: u.display_order }).eq('id', u.id)
        );
        const results = await Promise.all(promises);
        const firstError = results.find(r => r.error)?.error;
        if (firstError) throw firstError;
    },

    async createSharedItems(items: { shared_library_id: string; shared_section_id: string; question: string; answer: string; memo?: string | null; display_order: number }[]): Promise<void> {
        const { error } = await supabase
            .from('shared_items')
            .insert(items);

        if (error) throw error;
    }
};
