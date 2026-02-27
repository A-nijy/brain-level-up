import { AdminUserService } from './admin/AdminUserService';
import { AdminCategoryService } from './admin/AdminCategoryService';
import { AdminStatsService } from './admin/AdminStatsService';
import { AdminSharedLibraryService } from './admin/AdminSharedLibraryService';
import { AdminNotificationService } from './admin/AdminNotificationService';

/**
 * AdminService (Facade)
 * 단일 책임 원칙(SRP)에 따라 기능을 분리하였으며, 
 * 기존 코드와의 호환성을 위해 Facade 패턴을 유지합니다.
 * 점진적으로 각 전문 서비스를 직접 사용하는 것을 권장합니다.
 */
export const AdminService = {
    // User 관련
    ...AdminUserService,

    // Category 관련
    ...AdminCategoryService,

    // Stats 관련
    ...AdminStatsService,

    // Shared Library 관련
    ...AdminSharedLibraryService,

    // Notification 관련
    ...AdminNotificationService,
};
