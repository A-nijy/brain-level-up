import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

/**
 * [DEPRECATED] 이 서비스는 사업자 등록 전까지 사용되지 않습니다.
 * 추후 결제 기능 재개 시 활용하시기 바랍니다.
 */
export const PaymentService = {
    /**
     * 멤버십 구매 프로세스를 시작합니다.
     * 실제 서비스 시 Stripe, RevenueCat, In-App Purchase SDK가 들어갈 자리입니다.
     */
    async purchaseMembership(userId: string, level: 'BASIC' | 'PREMIUM' | 'PRO'): Promise<boolean> {
        return new Promise((resolve) => {
            Alert.alert(
                '멤버십 업그레이드',
                `${level} 등급으로 업그레이드 하시겠습니까? (테스트 결제)`,
                [
                    { text: '취소', style: 'cancel', onPress: () => resolve(false) },
                    {
                        text: '결제하기',
                        onPress: async () => {
                            try {
                                // 1. 실제 결제 API 호출 (현재는 Mock)
                                // await realPaymentGateway.pay();

                                // 2. DB 업데이트
                                const { error } = await supabase
                                    .from('profiles')
                                    .update({ membership_level: level })
                                    .eq('id', userId);

                                if (error) throw error;

                                Alert.alert('성공', `${level} 멤버십으로 업그레이드 되었습니다!`);
                                resolve(true);
                            } catch (error: any) {
                                Alert.alert('결제 오류', error.message);
                                resolve(false);
                            }
                        }
                    }
                ]
            );
        });
    }
};
