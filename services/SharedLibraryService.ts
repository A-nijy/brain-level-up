import { SharedLibrary, SharedItem, Library, SharedSection, SharedLibraryCategory } from '@/types';
import { LibraryService } from './LibraryService';
import { ItemService } from './ItemService';
import { LogService } from './LogService';
import officialDataRaw from '../assets/data/official_libraries.json';
import { SharedDataRegistry } from '../assets/data/SharedDataRegistry';

// JSON 타입 정의
interface OfficialData {
    categories: SharedLibraryCategory[];
    libraries: SharedLibraryManifest[];
}

interface SharedLibraryManifest extends SharedLibrary {
    sections: SharedSection[];
}

const officialData = officialDataRaw as unknown as OfficialData;

/**
 * [Local-Only] 공식 자료실 관련 비즈니스 로직을 담당하는 서비스
 * assets/data/official_libraries.json (목록) + SharedDataRegistry (세부 데이터) 사용
 */
export const SharedLibraryService = {
    /**
     * 공유 자료실 목록 조회 (공식 자료만 지원)
     */
    async getSharedLibraries(categoryId?: string, isOfficial: boolean = true): Promise<SharedLibrary[]> {
        let libraries = officialData.libraries;

        if (categoryId && categoryId !== 'all') {
            libraries = libraries.filter(lib => lib.category_id === categoryId);
        }

        return libraries.map(lib => {
            const cat = officialData.categories.find(c => c.id === lib.category_id);
            return {
                ...lib,
                category: cat?.title || lib.category || '기타'
            };
        });
    },

    /**
     * 공유 자료를 내 암기장으로 다운로드 (로컬 JSON -> 로컬 SQLite 복사)
     */
    async downloadLibrary(userId: string, sharedLibrary: SharedLibrary): Promise<Library> {
        try {
            await LogService.logEvent('feature_usage', { 
                feature: 'DOWNLOAD_SHARED',
                title: sharedLibrary.title 
            }, userId);

            // 1. 매니페스트에서 라이브러리 정보 찾기
            const manifest = officialData.libraries.find(l => l.id === sharedLibrary.id);
            if (!manifest) throw new Error('해당 자료를 찾을 수 없습니다.');

            // 2. 사용자용 새 암기장 생성 (SQLite)
            const newLib = await LibraryService.createLibrary(userId, {
                title: manifest.title,
                description: manifest.description,
                category: sharedLibrary.category,
                is_public: false
            }, true);

            // 3. 각 섹션별로 레지스트리에서 데이터 로드 및 복제
            if (manifest.sections && manifest.sections.length > 0) {
                for (const ss of manifest.sections) {
                    const newSection = await LibraryService.createSection(newLib.id, ss.title, true);

                    // 레지스트리에서 해당 섹션의 문제 데이터 가져오기
                    const sectionItems = SharedDataRegistry[ss.id];
                    
                    if (sectionItems && sectionItems.length > 0) {
                        const newItems = sectionItems.map((si: any) => ({
                            library_id: newLib.id,
                            section_id: newSection.id,
                            question: si.question,
                            answer: si.answer,
                            memo: si.memo || '',
                            image_url: si.image_url || '',
                            study_status: 'undecided' as const
                        }));
                        await ItemService.createItems(newItems, true);
                    }
                }
            }

            return newLib;
        } catch (error: any) {
            console.error('[SharedLibraryService] Download failed:', error);
            throw error;
        }
    },

    /**
     * ID로 공유 자료 상세 정보 조회
     */
    async getSharedLibraryById(id: string): Promise<SharedLibrary | null> {
        const lib = officialData.libraries.find(l => l.id === id);
        if (!lib) return null;

        const cat = officialData.categories.find(c => c.id === lib.category_id);
        return {
            ...lib,
            category: cat?.title || lib.category || '기타'
        };
    },

    /**
     * 특정 공유 자료의 섹션 목록 조회
     */
    async getSharedSections(sharedLibraryId: string): Promise<SharedSection[]> {
        const lib = officialData.libraries.find(l => l.id === sharedLibraryId);
        return lib?.sections || [];
    },

    /**
     * ID로 특정 공유 섹션 정보 조회
     */
    async getSharedSectionById(id: string): Promise<SharedSection | null> {
        for (const lib of officialData.libraries) {
            const section = lib.sections.find(s => s.id === id);
            if (section) return section;
        }
        return null;
    },

    /**
     * 특정 공유 섹션의 문항 목록 조회
     */
    async getSharedItems(sharedSectionId: string): Promise<SharedItem[]> {
        // 레지스트리에서 데이터 가져오기
        const items = SharedDataRegistry[sharedSectionId];
        
        if (items) {
            // SharedItem 형식에 맞게 변환하여 반환
            return items.map((item: any, index: number) => ({
                ...item,
                id: `local-item-${sharedSectionId}-${index}`,
                shared_library_id: 'unknown', // 필요 시 추적 로직 추가 가능
                shared_section_id: sharedSectionId,
                created_at: new Date().toISOString(),
                display_order: index,
                memo: item.memo || null,
                image_url: item.image_url || null
            } as SharedItem));
        }
        
        return [];
    },

    /**
     * 모든 공유 카테고리 조회
     */
    async getAllSharedCategories(): Promise<SharedLibraryCategory[]> {
        return officialData.categories;
    },

    /**
     * 현재 사용 중인 공유 카테고리 조회
     */
    async getSharedCategories(isOfficial?: boolean): Promise<SharedLibraryCategory[]> {
        return officialData.categories;
    },

    // --- 관리 및 공유 기능 (로컬 버전 미지원) ---
    async shareLibrary(userId: string, libraryId: string, categoryId: string, tags: string[]): Promise<void> {
        throw new Error('로컬 버전에서는 자료 공유 기능이 지원되지 않습니다.');
    },

    async deleteSharedLibrary(libraryId: string): Promise<void> {
        throw new Error('관리자 전용 기능입니다.');
    },

    async updateSharedLibrary(libraryId: string, updates: Partial<SharedLibrary>): Promise<void> {
        throw new Error('관리자 전용 기능입니다.');
    },

    async reportSharedLibrary(userId: string, libraryId: string, reason: string = 'inappropriate'): Promise<boolean> {
        return false;
    }
};
