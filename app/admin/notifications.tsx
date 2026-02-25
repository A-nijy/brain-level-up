import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Stack, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAdminStats } from '@/hooks/useAdminStats';
import { useAlert } from '@/contexts/AlertContext';
import { Strings } from '@/constants/Strings';

export default function AdminNotificationScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const { broadcastNotification, sendDirectNotification } = useAdminStats();
    const router = useRouter();
    const { showAlert } = useAlert();

    const [notifyTarget, setNotifyTarget] = useState<'ALL' | 'SINGLE'>('ALL');
    const [targetEmail, setTargetEmail] = useState('');
    const [notifyTitle, setNotifyTitle] = useState('');
    const [notifyMessage, setNotifyMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSendNotification = async () => {
        if (!notifyTitle || !notifyMessage) {
            showAlert({ title: Strings.common.warning, message: Strings.adminNotifications.alerts.enterAll });
            return;
        }

        if (notifyTarget === 'SINGLE' && !targetEmail) {
            showAlert({ title: Strings.common.warning, message: Strings.adminNotifications.alerts.enterEmail });
            return;
        }

        setIsSending(true);
        try {
            if (notifyTarget === 'ALL') {
                await broadcastNotification(notifyTitle, notifyMessage);
                showAlert({ title: Strings.common.success, message: Strings.adminNotifications.alerts.sendSuccess });
            } else {
                await sendDirectNotification(targetEmail.trim(), notifyTitle, notifyMessage);
                showAlert({ title: Strings.common.success, message: `${targetEmail} ${Strings.adminNotifications.alerts.sendSuccess}` });
                setTargetEmail('');
            }
            setNotifyTitle('');
            setNotifyMessage('');
        } catch (error: any) {
            console.error('[AdminUI] Notification error:', error);
            showAlert({ title: Strings.common.error, message: `${Strings.adminNotifications.alerts.sendError}: ${error.message}` });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
            <Stack.Screen options={{ headerShown: false }} />

            <View variant="transparent" style={styles.header}>
                <View variant="transparent">
                    <Text style={styles.title}>{Strings.adminNotifications.title}</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{Strings.adminNotifications.subtitle}</Text>
                </View>
                <TouchableOpacity style={[styles.backBtn, { borderColor: colors.border }]} onPress={() => router.back()}>
                    <FontAwesome name={Strings.tabs.icons.shared as any} size={14} color={colors.textSecondary} style={{ marginRight: 10, transform: [{ rotate: '180deg' }] }} />
                    <Text style={[styles.backBtnText, { color: colors.textSecondary }]}>{Strings.common.close}</Text>
                </TouchableOpacity>
            </View>

            <Card style={styles.contentCard}>
                <View variant="transparent" style={styles.targetToggleContainer}>
                    <TouchableOpacity
                        style={[styles.targetToggleBtn, notifyTarget === 'ALL' && [styles.targetToggleBtnActive, { borderColor: colors.tint, backgroundColor: colors.tint + '10' }]]}
                        onPress={() => setNotifyTarget('ALL')}
                    >
                        <FontAwesome name={Strings.admin.icons.users as any} size={16} color={notifyTarget === 'ALL' ? colors.tint : colors.textSecondary} style={{ marginRight: 8 }} />
                        <Text style={[styles.targetToggleText, { color: notifyTarget === 'ALL' ? colors.tint : colors.textSecondary }]}>{Strings.adminNotifications.targets.all}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.targetToggleBtn, notifyTarget === 'SINGLE' && [styles.targetToggleBtnActive, { borderColor: colors.tint, backgroundColor: colors.tint + '10' }]]}
                        onPress={() => setNotifyTarget('SINGLE')}
                    >
                        <FontAwesome name={Strings.settings.icons.user as any} size={16} color={notifyTarget === 'SINGLE' ? colors.tint : colors.textSecondary} style={{ marginRight: 8 }} />
                        <Text style={[styles.targetToggleText, { color: notifyTarget === 'SINGLE' ? colors.tint : colors.textSecondary }]}>{Strings.adminNotifications.targets.individual}</Text>
                    </TouchableOpacity>
                </View>

                {notifyTarget === 'SINGLE' && (
                    <View variant="transparent" style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{Strings.adminInquiries.details.email} <Text style={{ color: colors.error }}>*</Text></Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                            placeholder={Strings.adminNotifications.placeholders.email}
                            placeholderTextColor={colors.textSecondary + '80'}
                            value={targetEmail}
                            onChangeText={setTargetEmail}
                            editable={!isSending}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                )}

                <View variant="transparent" style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{Strings.adminNotifications.labelTitle} <Text style={{ color: colors.error }}>*</Text></Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                        placeholder={Strings.adminNotifications.placeholders.title}
                        placeholderTextColor={colors.textSecondary + '80'}
                        value={notifyTitle}
                        onChangeText={setNotifyTitle}
                        editable={!isSending}
                    />
                </View>

                <View variant="transparent" style={[styles.inputContainer, { flex: 1 }]}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{Strings.adminNotifications.labelContent} <Text style={{ color: colors.error }}>*</Text></Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                        placeholder={Strings.adminNotifications.placeholders.content}
                        placeholderTextColor={colors.textSecondary + '80'}
                        value={notifyMessage}
                        onChangeText={setNotifyMessage}
                        multiline
                        textAlignVertical="top"
                        editable={!isSending}
                    />
                </View>

                <View variant="transparent" style={styles.footerActions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.border + '30' }]}
                        onPress={() => { setNotifyTitle(''); setNotifyMessage(''); setTargetEmail(''); }}
                        disabled={isSending}
                    >
                        <Text style={[styles.actionBtnText, { color: colors.text }]}>{Strings.settings.options.notificationOff}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.primaryBtn, { backgroundColor: colors.tint }]}
                        onPress={handleSendNotification}
                        disabled={isSending}
                    >
                        {isSending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <FontAwesome name={Strings.shared.icons.globe as any} size={14} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={[styles.actionBtnText, { color: '#fff' }]}>
                                    {Strings.adminNotifications.btnSend}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 32,
        paddingBottom: 100,
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        maxWidth: 600,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
    },
    backBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    contentCard: {
        backgroundColor: 'transparent',
        padding: 40,
        borderRadius: 16,
        minHeight: 500,
        flex: 1,
        borderWidth: 1,
        borderColor: '#00000010',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
    },
    textArea: {
        minHeight: 160,
        flex: 1,
    },
    footerActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 12,
        marginTop: 20,
    },
    actionBtn: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 10,
        minWidth: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtn: {
        flexDirection: 'row',
    },
    actionBtnText: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    targetToggleContainer: {
        flexDirection: 'row',
        marginBottom: 32,
        gap: 12,
    },
    targetToggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'transparent',
        backgroundColor: '#f1f5f9', // fallback or theme aware maybe? Wait, I'll use inline background in JSX instead. Let's just set base background to '#00000005'
    },
    targetToggleBtnActive: {
        // Active border color will be handled inline with colors.tint
    },
    targetToggleText: {
        fontSize: 15,
        fontWeight: 'bold',
    },
});
