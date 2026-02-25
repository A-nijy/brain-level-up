import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '@/services/UserService';
import { useRouter } from 'expo-router';
import { useAlert } from '@/contexts/AlertContext';
import { Strings } from '@/constants/Strings';

export function useProfile() {
    const { user, profile, refreshProfile } = useAuth();
    const router = useRouter();
    const { showAlert } = useAlert();

    const [nickname, setNickname] = useState(profile?.nickname || '');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 프로필 정보가 업데이트되면 닉네임 상태 동기화
    useEffect(() => {
        if (profile?.nickname) {
            setNickname(profile.nickname);
        }
    }, [profile]);

    /**
     * 닉네임 업데이트 핸들러
     */
    const updateNickname = async () => {
        if (!user || nickname === profile?.nickname) {
            setIsEditing(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { available, message } = await UserService.isNicknameAvailable(nickname);
            if (!available) {
                setError(message || '사용할 수 없는 닉네임입니다.');
                setLoading(false);
                return;
            }

            await UserService.updateNickname(user.id, nickname);
            await refreshProfile();
            setIsEditing(false);
            showAlert({ title: Strings.common.success, message: Strings.settings.profile.changeSuccess || '닉네임이 변경되었습니다.' });
        } catch (e: any) {
            console.error(e);
            setError('닉네임 변경 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 회원 탈퇴 핸들러 - 실제 로직만 수행하도록 변경 (확인은 UI layer에서 수행)
     */
    const withdraw = async () => {
        if (user) {
            setLoading(true);
            try {
                await UserService.withdrawAccount(user.id);
                router.replace('/auth/login');
            } catch (e: any) {
                showAlert({ title: Strings.common.error, message: '탈퇴 처리 중 문제가 발생했습니다.' });
            } finally {
                setLoading(false);
            }
        }
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setNickname(profile?.nickname || '');
        setError(null);
    };

    return {
        user,
        profile,
        nickname,
        setNickname,
        isEditing,
        setIsEditing,
        loading,
        error,
        setError,
        updateNickname,
        withdraw,
        cancelEditing
    };
}
