import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface BarChartProps {
    data: number[];
    labels?: string[];
    height?: number;
    color?: string;
}

export const SimpleBarChart = ({ data, labels, height = 200, color }: BarChartProps) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const barColor = color || colors.tint;

    const maxVal = Math.max(...data, 1);

    return (
        <View style={StyleSheet.flatten([styles.container, { height }])}>
            <View style={styles.chartArea}>
                {data.map((val, i) => (
                    <View key={i} style={styles.barContainer}>
                        <View
                            style={StyleSheet.flatten([
                                styles.bar,
                                {
                                    height: (val / maxVal) * (height - 40),
                                    backgroundColor: barColor,
                                    opacity: 0.8
                                }
                            ])}
                        />
                        {labels && (
                            <Text style={StyleSheet.flatten([styles.label, { color: colors.textSecondary }])}>
                                {labels[i]}
                            </Text>
                        )}
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingTop: 10,
    },
    chartArea: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        flex: 1,
    },
    barContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: '100%',
    },
    bar: {
        width: '60%',
        borderRadius: 4,
        minHeight: 2,
    },
    label: {
        fontSize: 10,
        marginTop: 8,
    },
});
