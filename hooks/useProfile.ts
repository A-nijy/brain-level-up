import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '@/services/UserService';
import { useRouter } from 'expo-router';

export function useProfile() {
    const { user, profile, refreshProfile } = useAuth();
    const router = useRouter();

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
            Alert.alert('성공', '닉네임이 변경되었습니다.');
        } catch (e: any) {
            console.error(e);
            setError('닉네임 변경 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 회원 탈퇴 핸들러
     */
    const withdraw = () => {
        Alert.alert(
            '회원 탈퇴',
            '정말로 탈퇴하시겠습니까? 모든 학습 데이터와 단어장이 영구적으로 삭제되며 복구할 수 없습니다.',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '탈퇴하기',
                    style: 'destructive',
                    onPress: async () => {
                        if (user) {
                            setLoading(true);
                            try {
                                await UserService.withdrawAccount(user.id);
                                router.replace('/auth/login');
                            } catch (e: any) {
                                Alert.alert('오류', '탈퇴 처리 중 문제가 발생했습니다.');
                            } finally {
                                setLoading(false);
                            }
                        }
                    }
                }
            ]
        );
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
