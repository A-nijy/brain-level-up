import React from 'react';
import { StyleSheet, Modal, TouchableOpacity, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface FeatureGatingModalProps {
    isVisible: boolean;
    onClose: () => void;
    onWatchAd: () => void;
    title: string;
    description: string;
    isLoading?: boolean;
    loadingText?: string;
}

const { width } = Dimensions.get('window');

export function FeatureGatingModal({ isVisible, onClose, onWatchAd, title, description, isLoading, loadingText }: FeatureGatingModalProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={() => !isLoading && onClose()}
        >
            <View variant="transparent" style={styles.overlay}>
                <View style={[styles.content, { backgroundColor: colors.background }]}>
                    <TouchableOpacity
                        style={[styles.closeButton, isLoading && { opacity: 0.3 }]}
                        onPress={() => !isLoading && onClose()}
                        disabled={isLoading}
                    >
                        <FontAwesome name="times" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <View variant="transparent" style={styles.header}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
                            <FontAwesome name="lock" size={32} color={colors.tint} />
                        </View>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
                    </View>

                    <View variant="transparent" style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.adButton, isLoading && { opacity: 0.7 }]}
                            onPress={onWatchAd}
                            disabled={isLoading}
                        >
                            <View variant="transparent" style={styles.adButtonContent}>
                                {isLoading ? (
                                    <ActivityIndicator size="small" color={colors.tint} />
                                ) : (
                                    <FontAwesome name="play-circle" size={20} color={colors.tint} />
                                )}
                                <Text style={[styles.adButtonText, { color: colors.tint }]}>
                                    {isLoading ? (loadingText || '처리 중...') : '광고 시청하고 받기'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        width: Math.min(width - 40, 400),
        borderRadius: 32,
        padding: 30,
        alignItems: 'center',
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    description: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
        marginBottom: 20,
    },
    adButton: {
        width: '100%',
        height: 56,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: 'rgba(79, 70, 229, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    adButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    adButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    }
});
