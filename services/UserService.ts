import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';

export const UserService = {
    /**
     * 사용자의 프로필 정보를 가져옵니다.
     */
    async getProfile(userId: string): Promise<UserProfile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
        return data;
    },

    /**
     * 사용 가능한 닉네임인지 확인합니다. (중복 체크 및 글자수 체크)
     */
    async isNicknameAvailable(nickname: string): Promise<{ available: boolean; message?: string }> {
        // 글자수 유효성 검사 (2-8자)
        if (nickname.length < 2 || nickname.length > 8) {
            return { available: false, message: '닉네임은 2자 이상 8자 이내로 입력해주세요.' };
        }

        // 중복 체크
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('nickname', nickname)
            .maybeSingle();

        if (error) {
            console.error('Error checking nickname availability:', error);
            throw error;
        }

        if (data) {
            return { available: false, message: '이미 사용 중인 닉네임입니다.' };
        }

        return { available: true };
    },

    /**
     * 닉네임을 업데이트합니다.
     */
    async updateNickname(userId: string, newNickname: string): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({ nickname: newNickname })
            .eq('id', userId);

        if (error) throw error;
    },

    /**
     * 회원 탈퇴 처리를 합니다.
     * 주의: public.profiles가 삭제되면 ON DELETE CASCADE 설정으로 인해 
     * 관련된 단어장, 아이템, 로그 등이 모두 삭제됩니다.
     * auth.users 삭제는 클라이언트 SDK 권한 문제로 인해 서비스 롤 키가 필요할 수 있으나,
     * 여기서는 프로필 삭제 및 로그아웃 처리를 기본으로 합니다.
     */
    async withdrawAccount(userId: string): Promise<void> {
        // 1. 프로필 삭제 (연쇄 삭제 트리거)
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (profileError) {
            console.error('Error deleting profile:', profileError);
            throw profileError;
        }

        // 2. 로그아웃 처리
        await supabase.auth.signOut();
    }
};
