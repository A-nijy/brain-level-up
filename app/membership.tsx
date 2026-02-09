import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Platform, Alert } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { PaymentService } from '@/services/deprecated/PaymentService';

export default function MembershipScreen() {
    const { profile, refreshProfile } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { width } = useWindowDimensions();

    const isWeb = Platform.OS === 'web' && width > 768;
    const currentLevel = profile?.membership_level || 'BASIC';

    const plans = [
        {
            level: 'BASIC',
            price: '무료',
            features: ['최대 5개의 암기장', '암기장당 50개 단어', '기본 학습 통계', '광고 포함'],
            color: '#64748B',
        },
        {
            level: 'PREMIUM',
            price: '₩4,900 /월',
            features: ['암기장 무제한 생성', '단어 등록 무제한', '광고 제거', '모든 테마 사용 가능', '우선 순위 지원'],
            color: '#4F46E5',
        },
        {
            level: 'PRO',
            price: '₩9,900 /월',
            features: ['PREMIUM 모든 기능', '마켓플레이스 공유', '고급 학습 통합 분석', '클라우드 실시간 동기화'],
            color: '#7C3AED',
        }
    ];

    const handleUpgrade = async (level: string) => {
        Alert.alert('시스템 점검', '현재 멤버십 결제 기능 준비 중입니다. 잠시 후 다시 이용해 주세요.');
        return;

        /* 기존 결제 로직 보존
        if (!profile) return;
        if (level === currentLevel) {
            Alert.alert('알림', '이미 사용 중인 플랜입니다.');
            return;
        }

        const success = await PaymentService.purchaseMembership(profile.id, level as any);
        if (success) {
            await refreshProfile();
        }
        */
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={[
                isWeb && { maxWidth: 1000, alignSelf: 'center', width: '100%', paddingVertical: 40 }
            ]}
        >
            <View variant="transparent" style={styles.header}>
                <Text style={styles.title}>Membership Plan</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    나에게 딱 맞는 학습 플랜을 선택하고{"\n"}더 효율적으로 암기하세요.
                </Text>
            </View>

            <View variant="transparent" style={[styles.plansContainer, isWeb && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 20 }]}>
                {plans.map((plan, index) => (
                    <Animated.View
                        key={plan.level}
                        entering={FadeInUp.delay(index * 100).duration(800)}
                        style={isWeb && { width: 300 }}
                    >
                        <Card style={[
                            styles.planCard,
                            currentLevel === plan.level ? { borderColor: plan.color, borderWidth: 2.5 } : { borderWidth: 1.5 }
                        ]}>
                            {currentLevel === plan.level && (
                                <View style={[styles.currentBadge, { backgroundColor: plan.color }]}>
                                    <Text style={styles.currentBadgeText}>현재 플랜</Text>
                                </View>
                            )}

                            <View variant="transparent" style={styles.planHeader}>
                                <Text style={[styles.planLevel, { color: plan.color }]}>{plan.level}</Text>
                                <Text style={styles.planPrice}>{plan.price}</Text>
                            </View>

                            <View variant="transparent" style={styles.featuresList}>
                                {plan.features.map((feature, i) => (
                                    <View key={i} variant="transparent" style={styles.featureItem}>
                                        <FontAwesome name="check-circle" size={16} color={plan.color} style={{ opacity: 0.8 }} />
                                        <Text style={styles.featureText}>{feature}</Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.planButton,
                                    { backgroundColor: currentLevel === plan.level ? colors.border + '30' : plan.color }
                                ]}
                                onPress={() => handleUpgrade(plan.level)}
                                disabled={currentLevel === plan.level}
                                activeOpacity={0.8}
                            >
                                <Text style={[
                                    styles.planButtonText,
                                    { color: currentLevel === plan.level ? colors.textSecondary : '#fff' }
                                ]}>
                                    {currentLevel === plan.level ? '사용 중' : '플랜 업그레이드'}
                                </Text>
                            </TouchableOpacity>
                        </Card>
                    </Animated.View>
                ))}
            </View>

            <View variant="transparent" style={{ height: 60 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 30,
        paddingTop: 40,
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 24,
        fontWeight: '500',
        opacity: 0.7,
    },
    plansContainer: {
        padding: 20,
    },
    planCard: {
        padding: 28,
        borderRadius: 32,
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
    },
    currentBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomLeftRadius: 16,
    },
    currentBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    planLevel: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 1,
    },
    planPrice: {
        fontSize: 20,
        fontWeight: '800',
    },
    featuresList: {
        marginBottom: 32,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    featureText: {
        marginLeft: 12,
        fontSize: 15,
        fontWeight: '600',
        opacity: 0.8,
    },
    planButton: {
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    planButtonText: {
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: -0.3,
    }
});
