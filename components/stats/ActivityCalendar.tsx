import React from 'react';
import { StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface ActivityCalendarProps {
    activities: string[]; // ['2026-02-01', '2026-02-05', ...]
}

export default function ActivityCalendar({ activities }: ActivityCalendarProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { width } = useWindowDimensions();

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    const isToday = (day: number) => {
        return day === now.getDate();
    };

    const hasActivity = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return activities.includes(dateStr);
    };

    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    return (
        <View style={[styles.container, { borderColor: colors.border }]}>
            <View variant="transparent" style={styles.header}>
                <Text style={styles.title}>{year}년 {month + 1}월</Text>
                <View variant="transparent" style={styles.legend}>
                    <View style={[styles.dot, { backgroundColor: colors.tint }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>학습함</Text>
                </View>
            </View>

            <View variant="transparent" style={styles.grid}>
                {weekDays.map((wd) => (
                    <Text key={wd} style={[styles.weekDayText, { color: colors.textSecondary }]}>{wd}</Text>
                ))}

                {blanks.map((b) => (
                    <View key={`blank-${b}`} style={styles.dayBox} />
                ))}

                {days.map((day) => {
                    const active = hasActivity(day);
                    const today = isToday(day);

                    return (
                        <View key={day} style={styles.dayBox}>
                            <View
                                style={[
                                    styles.dayCircle,
                                    active && { backgroundColor: colors.tint + '20' },
                                    today && { borderColor: colors.tint, borderWidth: 1.5 },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.dayText,
                                        active && { color: colors.tint, fontWeight: 'bold' },
                                        today && !active && { color: colors.tint }
                                    ]}
                                >
                                    {day}
                                </Text>
                                {active && (
                                    <View style={[styles.activityDot, { backgroundColor: colors.tint }]} />
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1.5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 12,
        fontWeight: '600',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    weekDayText: {
        width: '14.28%',
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 12,
    },
    dayBox: {
        width: '14.28%',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    dayCircle: {
        width: 34,
        height: 34,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    dayText: {
        fontSize: 14,
        fontWeight: '500',
    },
    activityDot: {
        position: 'absolute',
        bottom: 4,
        width: 4,
        height: 4,
        borderRadius: 2,
    }
});
