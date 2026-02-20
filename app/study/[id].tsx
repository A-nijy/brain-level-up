import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, useWindowDimensions, Platform, Alert } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    runOnJS,
    ZoomIn,
    FadeInUp
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { StatsService } from '@/services/StatsService';

type Item = {
    id: string;
    question: string;
    answer: string;
    memo?: string | null;
    study_status: 'learned' | 'confused' | 'undecided';
};

import { useStudySession } from '@/hooks/useStudySession';

export default function StudyScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const {
        currentItem,
        currentIndex,
        items,
        isFlipped,
        loading,
        results,
        isFinished,
        handleFlip,
        handleResult,
        setIsFlipped
    } = useStudySession(id as string);

    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { width } = useWindowDimensions();

    const isWeb = Platform.OS === 'web' && width > 768;

    // Animation Values
    const flipProgress = useSharedValue(0);
    const cardScale = useSharedValue(1);

    // Sync isFlipped with flipProgress for animations
    useEffect(() => {
        flipProgress.value = withSpring(isFlipped ? 1 : 0, { damping: 15 });
    }, [isFlipped]);

    const onResultPress = (success: boolean) => {
        // Animate card out before processing result
        cardScale.value = withTiming(0.8, { duration: 100 }, () => {
            runOnJS(handleResult)(success);
            cardScale.value = withSpring(1);
        });
    };

    const frontAnimatedStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(flipProgress.value, [0, 1], [0, 180]);
        return {
            transform: [
                { scale: cardScale.value },
                { perspective: 1000 },
                { rotateY: `${rotateY}deg` }
            ],
            opacity: interpolate(flipProgress.value, [0, 0.5, 0.5, 1], [1, 0, 0, 0]),
            zIndex: isFlipped ? 0 : 1,
        };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(flipProgress.value, [0, 1], [180, 360]);
        return {
            transform: [
                { scale: cardScale.value },
                { perspective: 1000 },
                { rotateY: `${rotateY}deg` }
            ],
            opacity: interpolate(flipProgress.value, [0, 0.5, 0.5, 1], [0, 0, 1, 1]),
            zIndex: isFlipped ? 1 : 0,
        };
    });

    if (isFinished) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: '학습 완료', headerTransparent: true, headerTintColor: colors.text }} />

                <Animated.View
                    entering={ZoomIn.springify()}
                    style={[
                        styles.resultCard,
                        { borderColor: colors.tint, borderWidth: 2 },
                        isWeb && { maxWidth: 500, alignSelf: 'center' }
                    ]}
                >
                    <FontAwesome name="check-circle" size={80} color={colors.success} style={{ marginBottom: 24 }} />
                    <Text style={styles.resultTitle}>Study Complete!</Text>
                    <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>학습을 모두 완료했습니다.</Text>

                    <View variant="transparent" style={styles.statsRow}>
                        <View variant="transparent" style={styles.statItem}>
                            <Text style={[styles.statNum, { color: colors.success }]}>{results.correct}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>정답</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View variant="transparent" style={styles.statItem}>
                            <Text style={[styles.statNum, { color: colors.error }]}>{results.wrong}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>오답</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.finishButton, { backgroundColor: colors.tint }]}
                        onPress={() => router.back()}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.finishButtonText}>돌아가기</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }



    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{
                title: `${currentIndex + 1} / ${items.length}`,
                headerTransparent: true,
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: '800' }
            }} />

            <View variant="transparent" style={[styles.cardContainer, isWeb && { maxWidth: 600, alignSelf: 'center', width: '100%' }]}>
                {/* Front Card */}
                <Animated.View style={[styles.cardWrapper, frontAnimatedStyle]}>
                    <TouchableOpacity activeOpacity={1} onPress={handleFlip} style={[styles.cardFace, { borderColor: colors.border }]}>
                        <Text style={[styles.cardTag, { color: colors.textSecondary }]}>QUESTION</Text>
                        <Text style={styles.cardMainText}>{currentItem.question}</Text>
                        <View variant="transparent" style={styles.hintContainer}>
                            <FontAwesome name="mouse-pointer" size={12} color={colors.textSecondary} style={{ marginRight: 6, opacity: 0.5 }} />
                            <Text style={[styles.hintText, { color: colors.textSecondary }]}>탭하여 정답 확인</Text>
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                {/* Back Card */}
                <Animated.View style={[styles.cardWrapper, backAnimatedStyle]}>
                    <TouchableOpacity activeOpacity={1} onPress={handleFlip} style={[styles.cardFace, { borderColor: colors.tint }]}>
                        <Text style={[styles.cardTag, { color: colors.tint }]}>ANSWER</Text>
                        <Text style={styles.cardMainText}>{currentItem.answer}</Text>
                        {currentItem.memo && (
                            <Text style={[styles.memoText, { color: colors.textSecondary }]}>{currentItem.memo}</Text>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Action Buttons */}
            <View variant="transparent" style={[styles.buttonContainer, isWeb && { maxWidth: 600, alignSelf: 'center', width: '100%' }]}>
                <TouchableOpacity
                    style={[styles.actionButton, { borderColor: colors.error }]}
                    onPress={() => onResultPress(false)}
                    activeOpacity={0.7}
                >
                    <FontAwesome name="times" size={24} color={colors.error} />
                    <Text style={[styles.buttonText, { color: colors.error }]}>몰라요</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { borderColor: colors.success }]}
                    onPress={() => onResultPress(true)}
                    activeOpacity={0.7}
                >
                    <FontAwesome name="check" size={24} color={colors.success} />
                    <Text style={[styles.buttonText, { color: colors.success }]}>알아요</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 60,
    },
    cardWrapper: {
        position: 'absolute',
        width: '100%',
        height: 400,
        backfaceVisibility: 'hidden',
    },
    cardFace: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
        padding: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        backgroundColor: 'transparent',
    },
    cardTag: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 2,
        position: 'absolute',
        top: 40,
    },
    cardMainText: {
        fontSize: 36,
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: -1,
    },
    memoText: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 24,
        opacity: 0.7,
    },
    hintContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        bottom: 40,
    },
    hintText: {
        fontSize: 12,
        fontWeight: '700',
        opacity: 0.5,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        gap: 16,
    },
    actionButton: {
        flex: 1,
        height: 72,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        backgroundColor: 'transparent',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '800',
        marginLeft: 8,
    },
    resultCard: {
        width: '100%',
        borderRadius: 40,
        padding: 48,
        alignItems: 'center',
        marginTop: 100,
    },
    resultTitle: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: -1,
    },
    resultSubtitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 40,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginBottom: 48,
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    statNum: {
        fontSize: 48,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '700',
        marginTop: 4,
    },
    statDivider: {
        width: 1.5,
        height: 60,
        opacity: 0.2,
    },
    finishButton: {
        paddingVertical: 20,
        borderRadius: 20,
        width: '100%',
        alignItems: 'center',
    },
    finishButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
});
