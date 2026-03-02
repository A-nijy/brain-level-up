export interface UserProfile {
    id: string;
    email: string;
    nickname: string;
    user_id_number: number;
    role: 'user' | 'admin';
    membership_level: 'BASIC' | 'PREMIUM' | 'PRO';
    created_at: string;
}

export type Profile = UserProfile;
