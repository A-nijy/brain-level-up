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

    async withdrawAccount(userId: string): Promise<void> {
        console.log('[UserService] Attempting account withdrawal for:', userId);

        // 1. 계정 및 모든 데이터 연쇄 삭제를 위한 RPC 함수 호출 시도
        // 이 함수는 auth.users에서 현재 사용자를 삭제하며, 설정된 CASCADE 규칙에 의해 관련 데이터도 삭제됩니다.
        const { error: rpcError } = await supabase.rpc('delete_user_account');

        if (rpcError) {
            console.warn('[UserService] RPC withdrawal failed, falling back to profile delete:', rpcError.message);

            // RPC를 아직 등록하지 않은 경우를 대비한 구 버전 백업 로직 (프로필만 삭제)
            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (profileError) {
                console.error('[UserService] Profile deletion also failed:', profileError);
                throw profileError;
            }
        }

        // 2. 로그아웃 및 로컬 세션 클리어
        await supabase.auth.signOut();
        console.log('[UserService] Account withdrawal process completed.');
    }
};
