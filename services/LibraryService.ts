import { supabase } from '@/lib/supabase';
import { Library, Section } from '@/types';

// TODO: 추후 Local DB(SQLite)와 Supabase를 오가는 로직을 이곳에 구현합니다.
// 현재는 Supabase 직접 호출 로직을 캡슐화합니다.

export const LibraryService = {
    async getLibraries(userId: string): Promise<Library[]> {
        const { data, error } = await supabase
            .from('libraries')
            .select('*')
            .eq('user_id', userId)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getLibraryById(id: string): Promise<Library | null> {
        const { data, error } = await supabase
            .from('libraries')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async createLibrary(userId: string, library: Pick<Library, 'title' | 'description' | 'category' | 'is_public'>): Promise<Library> {
        const { data, error } = await supabase
            .from('libraries')
            .insert({
                user_id: userId,
                ...library
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateLibrary(id: string, updates: Partial<Library>): Promise<Library> {
        const { data, error } = await supabase
            .from('libraries')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteLibrary(id: string): Promise<void> {
        const { error } = await supabase
            .from('libraries')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async updateLibrariesOrder(updates: { id: string, display_order: number }[]): Promise<void> {
        // Upsert can be used for bulk update if we provide the primary key
        const { error } = await supabase
            .from('libraries')
            .upsert(updates);

        if (error) throw error;
    },

    // Sections
    async getSections(libraryId: string): Promise<Section[]> {
        const { data, error } = await supabase
            .from('library_sections')
            .select('*')
            .eq('library_id', libraryId)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getSectionById(id: string): Promise<Section | null> {
        const { data, error } = await supabase
            .from('library_sections')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async createSection(libraryId: string, title: string): Promise<Section> {
        const { data, error } = await supabase
            .from('library_sections')
            .insert({ library_id: libraryId, title })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateSection(id: string, updates: Partial<Section>): Promise<Section> {
        const { data, error } = await supabase
            .from('library_sections')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteSection(id: string): Promise<void> {
        const { error } = await supabase
            .from('library_sections')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async updateSectionsOrder(updates: { id: string, display_order: number }[]): Promise<void> {
        const { error } = await supabase
            .from('library_sections')
            .upsert(updates);

        if (error) throw error;
    }
};
