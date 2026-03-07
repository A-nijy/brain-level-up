import React, { useState } from 'react';
import { StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Strings } from '@/constants/Strings';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';

export type StudyRange = 'all' | 'learned' | 'confused' | 'undecided';
export type FrontSide = 'question' | 'answer';
export type StudyOrder = 'sequential' | 'random';

export interface StudyConfig {
    ranges: StudyRange[];
    frontSide: FrontSide;
    order: StudyOrder;
}

interface StudyConfigModalProps {
    isVisible: boolean;
    onClose: () => void;
    onStart: (config: StudyConfig) => void;
}

export const StudyConfigModal = ({ isVisible, onClose, onStart }: StudyConfigModalProps) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [ranges, setRanges] = useState<StudyRange[]>(['all']);
    const [frontSide, setFrontSide] = useState<FrontSide>('question');
    const [order, setOrder] = useState<StudyOrder>('random');

    const toggleRange = (range: StudyRange) => {
        if (range === 'all') {
            setRanges(['all']);
            return;
        }

        let newRanges: StudyRange[] = ranges.filter(r => r !== 'all');
        if (newRanges.includes(range)) {
            newRanges = newRanges.filter(r => r !== range);
            if (newRanges.length === 0) newRanges = ['all'];
        } else {
            newRanges.push(range);
        }
        setRanges(newRanges);
    };

    const handleStart = () => {
        onStart({ ranges, frontSide, order });
    };

    const OptionButton = ({
        label,
        isSelected,
        onPress,
        icon
    }: {
        label: string;
        isSelected: boolean;
        onPress: () => void;
        icon?: string
    }) => (
        <TouchableOpacity
            style={[
                styles.optionButton,
                { borderColor: isSelected ? colors.tint : colors.border },
                isSelected && { backgroundColor: colors.tint + '10' }
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {icon && (
                <FontAwesome
                    name={icon as any}
                    size={14}
                    color={isSelected ? colors.tint : colors.textSecondary}
                    style={{ marginRight: 8 }}
                />
            )}
            <Text style={[
                styles.optionButtonText,
                { color: isSelected ? colors.tint : colors.textSecondary }
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <Card style={styles.modalContainer}>
                            <View variant="transparent" style={styles.header}>
                                <Text style={styles.title}>{Strings.study.config.title}</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <FontAwesome name="times" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Range Selection */}
                            <View variant="transparent" style={styles.section}>
                                <Text style={styles.sectionTitle}>{Strings.study.config.rangeTitle}</Text>
                                <View variant="transparent" style={styles.optionsGrid}>
                                    <OptionButton
                                        label={Strings.study.config.rangeAll}
                                        isSelected={ranges.includes('all')}
                                        onPress={() => toggleRange('all')}
                                    />
                                    <OptionButton
                                        label={Strings.librarySection.statusModal.learned}
                                        isSelected={ranges.includes('learned')}
                                        onPress={() => toggleRange('learned')}
                                        icon={Strings.settings.icons.check}
                                    />
                                    <OptionButton
                                        label={Strings.librarySection.statusModal.confused}
                                        isSelected={ranges.includes('confused')}
                                        onPress={() => toggleRange('confused')}
                                        icon="exclamation-circle"
                                    />
                                    <OptionButton
                                        label={Strings.librarySection.statusModal.undecided}
                                        isSelected={ranges.includes('undecided')}
                                        onPress={() => toggleRange('undecided')}
                                        icon={Strings.settings.icons.circle}
                                    />
                                </View>
                            </View>

                            {/* Front Side Selection */}
                            <View variant="transparent" style={styles.section}>
                                <Text style={styles.sectionTitle}>{Strings.study.config.frontSideTitle}</Text>
                                <View variant="transparent" style={styles.segmentedContainer}>
                                    <TouchableOpacity
                                        style={[styles.segment, frontSide === 'question' && { backgroundColor: colors.tint }]}
                                        onPress={() => setFrontSide('question')}
                                    >
                                        <Text style={[styles.segmentText, frontSide === 'question' && { color: '#fff' }]}>
                                            {Strings.study.config.frontSideQuestion}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.segment, frontSide === 'answer' && { backgroundColor: colors.tint }]}
                                        onPress={() => setFrontSide('answer')}
                                    >
                                        <Text style={[styles.segmentText, frontSide === 'answer' && { color: '#fff' }]}>
                                            {Strings.study.config.frontSideAnswer}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Order Selection */}
                            <View variant="transparent" style={styles.section}>
                                <Text style={styles.sectionTitle}>{Strings.study.config.orderTitle}</Text>
                                <View variant="transparent" style={styles.segmentedContainer}>
                                    <TouchableOpacity
                                        style={[styles.segment, order === 'random' && { backgroundColor: colors.tint }]}
                                        onPress={() => setOrder('random')}
                                    >
                                        <Text style={[styles.segmentText, order === 'random' && { color: '#fff' }]}>
                                            {Strings.study.config.orderRandom}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.segment, order === 'sequential' && { backgroundColor: colors.tint }]}
                                        onPress={() => setOrder('sequential')}
                                    >
                                        <Text style={[styles.segmentText, order === 'sequential' && { color: '#fff' }]}>
                                            {Strings.study.config.orderSequential}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.startButton}
                                onPress={handleStart}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={[colors.tint, colors.primaryGradient[1]]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.startGradient}
                                >
                                    <Text style={styles.startButtonText}>{Strings.study.config.startBtn}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Card>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        padding: 24,
        borderRadius: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
    },
    closeButton: {
        padding: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
        opacity: 0.7,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    optionButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },
    segmentedContainer: {
        flexDirection: 'row',
        backgroundColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.02)',
        padding: 4,
        borderRadius: 12,
    },
    segment: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    segmentText: {
        fontSize: 15,
        fontWeight: '700',
        opacity: 0.8,
    },
    startButton: {
        marginTop: 8,
        borderRadius: 20,
        overflow: 'hidden',
    },
    startGradient: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
});
