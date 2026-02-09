import React from 'react';
import { StyleSheet, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';

interface FeatureGatingModalProps {
    isVisible: boolean;
    onClose: () => void;
    onWatchAd: () => void;
    title: string;
    description: string;
}

const { width } = Dimensions.get('window');

export function FeatureGatingModal({ isVisible, onClose, onWatchAd, title, description }: FeatureGatingModalProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();

    const handleUpgrade = () => {
        onClose();
        router.push('/membership');
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View variant="transparent" style={styles.overlay}>
                <View style={[styles.content, { backgroundColor: colors.background }]}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
                        <TouchableOpacity style={styles.adButton} onPress={onWatchAd}>
                            <View variant="transparent" style={styles.adButtonContent}>
                                <FontAwesome name="play-circle" size={20} color={colors.tint} />
                                <Text style={[styles.adButtonText, { color: colors.tint }]}>광고 시청하고 받기</Text>
                            </View>
                        </TouchableOpacity>

                        {/* 멤버십 기능 일시 비활성화
                        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
                            <LinearGradient
                                colors={[colors.tint, colors.primaryGradient[1]]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.gradient}
                            >
                                <View variant="transparent" style={styles.upgradeButtonContent}>
                                    <FontAwesome name="star" size={18} color="#fff" />
                                    <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                        */}
                    </View>

                    {/*
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Premium members enjoy instant access without ads.
                    </Text>
                    */}
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
    },
    upgradeButton: {
        width: '100%',
        height: 56,
        borderRadius: 18,
        overflow: 'hidden',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    upgradeButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    upgradeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footerText: {
        fontSize: 12,
        textAlign: 'center',
        opacity: 0.7,
    }
});
