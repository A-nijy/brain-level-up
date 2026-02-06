import { supabase } from '@/lib/supabase';
import { SharedLibrary, SharedItem, Library, Item } from '@/types';
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

    async downloadLibrary(userId: string, sharedLibrary: SharedLibrary): Promise<Library> {
        // 1. Create new library for user
        const newLib = await LibraryService.createLibrary(userId, {
            title: sharedLibrary.title,
            description: sharedLibrary.description,
            category: sharedLibrary.category,
            is_public: false
        });

        // 2. Fetch shared items
        const { data: sharedItems, error: itemsError } = await supabase
            .from('shared_items')
            .select('*')
            .eq('shared_library_id', sharedLibrary.id);

        if (itemsError) throw itemsError;

        // 3. Copy items to new library
        if (sharedItems && sharedItems.length > 0) {
            const newItems = sharedItems.map(si => ({
                library_id: newLib.id,
                question: si.question,
                answer: si.answer,
                memo: si.memo,
            }));

            await ItemService.createItems(newItems);
        }

        // 4. Increment download count (RPC)
        await supabase.rpc('increment_download_count', { row_id: sharedLibrary.id });

        return newLib;
    }
};
