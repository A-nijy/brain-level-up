import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated as RNAnimated, Text as RNText } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const AnimatedCircle = RNAnimated.createAnimatedComponent(Circle);

interface DonutChartProps {
    data: {
        learned: number;
        confused: number;
        undecided: number;
        total: number;
    };
    size?: number;
    strokeWidth?: number;
}

export default function DonutChart({ data, size = 180, strokeWidth = 22 }: DonutChartProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const animatedValue = useRef(new RNAnimated.Value(0)).current;

    useEffect(() => {
        RNAnimated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, [data.total]);

    const { learned, confused, undecided, total } = data;

    // 비율 계산
    const learnedPct = total > 0 ? (learned / total) : 0;
    const confusedPct = total > 0 ? (confused / total) : 0;
    const undecidedPct = total > 0 ? (undecided / total) : 0;

    // SVG StrokeDashoffset 계산 (그려지는 순서: 미정 -> 헷갈림 -> 외움)
    // 0도 위치에서 시작하여 시계 방향으로
    const learnedOffset = circumference * (1 - learnedPct);
    const confusedOffset = circumference * (1 - (learnedPct + confusedPct));
    // undecided는 배경(전체)으로 깔고 나머지를 덮어씌움

    const statusColors = {
        learned: colors.success || '#10B981',
        confused: '#F59E0B',
        undecided: colorScheme === 'dark' ? '#334155' : '#E2E8F0',
    };

    return (
        <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <G rotation="-90" origin={`${center}, ${center}`}>
                    {/* Undecided (Base circle) */}
                    <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke={statusColors.undecided}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />

                    {/* Confused segment */}
                    <AnimatedCircle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke={statusColors.confused}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [circumference, confusedOffset],
                        })}
                        strokeLinecap="round"
                    />

                    {/* Learned segment */}
                    <AnimatedCircle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke={statusColors.learned}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [circumference, learnedOffset],
                        })}
                        strokeLinecap="round"
                    />
                </G>
            </Svg>
            <View style={styles.labelContainer}>
                <Text style={styles.totalText}>{total}</Text>
                <Text style={[styles.subText, { color: colors.textSecondary }]}>TOTAL</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    labelContainer: {
        position: 'absolute',
        alignItems: 'center',
    },
    totalText: {
        fontSize: 24,
        fontWeight: '900',
    },
    subText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
});
