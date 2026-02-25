import React from 'react';
import { StyleSheet, Modal, Pressable, TouchableOpacity, Dimensions, Platform, ScrollView } from 'react-native';
import { Text, View } from './Themed';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useAlert } from '@/contexts/AlertContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

const { width, height } = Dimensions.get('window');

export default function CustomAlert() {
    const { isVisible, hideAlert, alertConfig } = useAlert();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];

    if (!alertConfig) return null;

    const { title, message, buttons, options } = alertConfig;
    const isCancelable = options?.cancelable !== false;

    const handleBackdropPress = () => {
        if (isCancelable) {
            hideAlert();
            options?.onDismiss?.();
        }
    };

    const finalButtons = buttons && buttons.length > 0
        ? buttons
        : [{ text: '확인', onPress: hideAlert }];

    const isVertical = finalButtons.length > 2;
    const maxContentHeight = height * 0.4;
    const maxButtonHeight = height * 0.3;

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="none"
            onRequestClose={handleBackdropPress}
        >
            <View variant="transparent" style={styles.overlay}>
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    style={[styles.backdrop, { backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }]}
                >
                    <Pressable style={{ flex: 1 }} onPress={handleBackdropPress} />
                </Animated.View>

                <Animated.View
                    entering={ZoomIn.duration(300).springify()}
                    exiting={ZoomOut.duration(200)}
                    style={[
                        styles.alertContainer,
                        {
                            backgroundColor: colors.cardBackground,
                            shadowColor: '#000',
                            borderColor: colors.border,
                            borderWidth: Platform.OS === 'ios' ? 0 : 1
                        }
                    ]}
                >
                    <View variant="transparent" style={styles.content}>
                        <Text style={styles.title}>{title}</Text>
                        {message && (
                            <View variant="transparent" style={{ maxHeight: maxContentHeight }}>
                                <ScrollView showsVerticalScrollIndicator={true} bounces={false}>
                                    <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    <View variant="transparent" style={[
                        styles.buttonContainer,
                        { borderTopColor: colors.border, maxHeight: isVertical ? maxButtonHeight : undefined },
                        isVertical && styles.buttonContainerVertical
                    ]}>
                        <ScrollView
                            scrollEnabled={isVertical}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                            contentContainerStyle={!isVertical && { flexDirection: 'row' }}
                        >
                            {finalButtons.map((btn, index) => {
                                const isDestructive = btn.style === 'destructive';
                                const isCancel = btn.style === 'cancel';

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.button,
                                            !isVertical && { flex: 1 },
                                            !isVertical && index > 0 && { borderLeftWidth: 1, borderLeftColor: colors.border },
                                            isVertical && index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }
                                        ]}
                                        onPress={() => {
                                            hideAlert();
                                            if (btn.onPress) {
                                                setTimeout(btn.onPress, 50);
                                            }
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.buttonText,
                                                { color: isDestructive ? colors.error : isCancel ? colors.textSecondary : colors.tint },
                                                (isDestructive || !isCancel) && { fontWeight: '700' }
                                            ]}
                                        >
                                            {btn.text}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    alertContainer: {
        width: Math.min(width * 0.85, 340),
        borderRadius: 28,
        overflow: 'hidden',
        elevation: 24,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    content: {
        paddingTop: 32,
        paddingBottom: 24,
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    buttonContainer: {
        borderTopWidth: 1,
    },
    buttonContainerVertical: {
        flexDirection: 'column',
    },
    button: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    buttonText: {
        fontSize: 17,
        fontWeight: '600',
    },
});
