import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
    const { user, isLoading } = useAuth();

    if (isLoading) return null;

    // 로컬 모드이므로 세션 유무와 상관없이 항상 메인으로 보냄 (user는 내부적으로 생성됨)
    return <Redirect href="/(tabs)" />;
}
