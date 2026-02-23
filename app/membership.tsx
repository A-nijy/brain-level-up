import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Platform, Alert } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { MembershipService } from '@/services/MembershipService';

import { Strings } from '@/constants/Strings';

export default function MembershipScreen() {
    const { profile, refreshProfile } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { width } = useWindowDimensions();

    const isWeb = Platform.OS === 'web' && width > 768;
    const currentLevel = profile?.membership_level || 'BASIC';

    const plans = [
        {
            ...Strings.membership.plans.basic,
            level: Strings.membership.plans.basic.name,
            color: '#64748B',
        },
        {
            ...Strings.membership.plans.premium,
            level: Strings.membership.plans.premium.name,
            color: '#4F46E5',
        },
        {
            ...Strings.membership.plans.pro,
            level: Strings.membership.plans.pro.name,
            color: '#7C3AED',
        }
    ];

    const handleUpgrade = async (level: string) => {
        Alert.alert(Strings.common.info, Strings.membership.checkMaintenance);
        return;

        /* 기존 결제 로직 보존
        if (!profile) return;
        if (level === currentLevel) {
            Alert.alert(Strings.common.info, Strings.membership.alerts.alreadySubscribed);
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
                <Text style={styles.title}>{Strings.membership.screenTitle}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {Strings.membership.subtitle}
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
                                    <Text style={styles.currentBadgeText}>{Strings.membership.currentPlan}</Text>
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
                                    {currentLevel === plan.level ? Strings.membership.using : Strings.membership.upgrade}
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
