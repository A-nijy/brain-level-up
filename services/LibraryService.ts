import { supabase } from '@/lib/supabase';
import { Library, Section } from '@/types';
import { LogService } from './LogService';

// TODO: 추후 Local DB(SQLite)와 Supabase를 오가는 로직을 이곳에 구현합니다.
// 현재는 Supabase 직접 호출 로직을 캡슐화합니다.

export const LibraryService = {
    async getLibraries(userId: string): Promise<Library[]> {
        const { data, error } = await supabase
            .from('libraries')
            .select('*, items:items(count)')
            .eq('user_id', userId)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) throw error;

        // items count 매핑
        return (data || []).map((lib: any) => ({
            ...lib,
            items_count: lib.items?.[0]?.count || 0
        }));
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

        // 활동 로그 기록
        LogService.logEvent('library_mutation', { 
            action: 'create', 
            id: data.id, 
            title: data.title 
        }).catch(err => console.error('Failed to log library creation:', err));

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

        // 활동 로그 기록
        LogService.logEvent('library_mutation', { 
            action: 'update', 
            id: id, 
            title: data.title,
            updates: Object.keys(updates)
        }).catch(err => console.error('Failed to log library update:', err));

        return data;
    },

    async deleteLibrary(id: string): Promise<void> {
        const { error } = await supabase
            .from('libraries')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // 활동 로그 기록
        LogService.logEvent('library_mutation', { 
            action: 'delete', 
            id: id 
        }).catch(err => console.error('Failed to log library deletion:', err));
    },

    async updateLibrariesOrder(updates: { id: string, display_order: number }[]): Promise<void> {
        const promises = updates.map(u =>
            supabase.from('libraries').update({ display_order: u.display_order }).eq('id', u.id)
        );
        const results = await Promise.all(promises);
        const firstError = results.find(r => r.error)?.error;
        if (firstError) throw firstError;
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

        // 활동 로그 기록
        LogService.logEvent('section_mutation', { 
            action: 'create', 
            id: data.id, 
            library_id: libraryId,
            title: title 
        }).catch(err => console.error('Failed to log section creation:', err));

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

        // 활동 로그 기록
        LogService.logEvent('section_mutation', { 
            action: 'update', 
            id: id, 
            title: data.title,
            updates: Object.keys(updates)
        }).catch(err => console.error('Failed to log section update:', err));

        return data;
    },

    async deleteSection(id: string): Promise<void> {
        const { error } = await supabase
            .from('library_sections')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // 활동 로그 기록
        LogService.logEvent('section_mutation', { 
            action: 'delete', 
            id: id 
        }).catch(err => console.error('Failed to log section deletion:', err));
    },

    async updateSectionsOrder(updates: { id: string, display_order: number }[]): Promise<void> {
        const promises = updates.map(u =>
            supabase.from('library_sections').update({ display_order: u.display_order }).eq('id', u.id)
        );
        const results = await Promise.all(promises);
        const firstError = results.find(r => r.error)?.error;
        if (firstError) throw firstError;
    }
};
