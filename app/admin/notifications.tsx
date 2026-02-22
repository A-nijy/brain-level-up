import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Stack, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAdminStats } from '@/hooks/useAdminStats';

export default function AdminNotificationScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const { broadcastNotification, sendDirectNotification } = useAdminStats();
    const router = useRouter();

    const [notifyTarget, setNotifyTarget] = useState<'ALL' | 'SINGLE'>('ALL');
    const [targetEmail, setTargetEmail] = useState('');
    const [notifyTitle, setNotifyTitle] = useState('');
    const [notifyMessage, setNotifyMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSendNotification = async () => {
        if (!notifyTitle || !notifyMessage) {
            window.alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        if (notifyTarget === 'SINGLE' && !targetEmail) {
            window.alert('대상이 될 사용자의 이메일을 입력해주세요.');
            return;
        }

        setIsSending(true);
        try {
            if (notifyTarget === 'ALL') {
                await broadcastNotification(notifyTitle, notifyMessage);
                window.alert('전체 사용자에게 알림이 전송되었습니다.');
            } else {
                await sendDirectNotification(targetEmail.trim(), notifyTitle, notifyMessage);
                window.alert(`${targetEmail} 사용자에게 알림이 전송되었습니다.`);
                setTargetEmail('');
            }
            setNotifyTitle('');
            setNotifyMessage('');
        } catch (error: any) {
            console.error('[AdminUI] Notification error:', error);
            window.alert('알림 전송 중 오류가 발생했습니다: ' + error.message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
            <Stack.Screen options={{ headerShown: false }} />

            <View variant="transparent" style={styles.header}>
                <View variant="transparent">
                    <Text style={styles.title}>알림 발송</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>사용자에게 중요 메시지나 개인 알림을 푸시 알림으로 전송합니다.</Text>
                </View>
                <TouchableOpacity style={[styles.backBtn, { borderColor: colors.border }]} onPress={() => router.back()}>
                    <FontAwesome name="chevron-left" size={14} color={colors.textSecondary} style={{ marginRight: 10 }} />
                    <Text style={[styles.backBtnText, { color: colors.textSecondary }]}>돌아가기</Text>
                </TouchableOpacity>
            </View>

            <Card style={styles.contentCard}>
                <View variant="transparent" style={styles.targetToggleContainer}>
                    <TouchableOpacity
                        style={[styles.targetToggleBtn, notifyTarget === 'ALL' && [styles.targetToggleBtnActive, { borderColor: colors.tint, backgroundColor: colors.tint + '10' }]]}
                        onPress={() => setNotifyTarget('ALL')}
                    >
                        <FontAwesome name="users" size={16} color={notifyTarget === 'ALL' ? colors.tint : colors.textSecondary} style={{ marginRight: 8 }} />
                        <Text style={[styles.targetToggleText, { color: notifyTarget === 'ALL' ? colors.tint : colors.textSecondary }]}>전체 사용자</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.targetToggleBtn, notifyTarget === 'SINGLE' && [styles.targetToggleBtnActive, { borderColor: colors.tint, backgroundColor: colors.tint + '10' }]]}
                        onPress={() => setNotifyTarget('SINGLE')}
                    >
                        <FontAwesome name="user" size={16} color={notifyTarget === 'SINGLE' ? colors.tint : colors.textSecondary} style={{ marginRight: 8 }} />
                        <Text style={[styles.targetToggleText, { color: notifyTarget === 'SINGLE' ? colors.tint : colors.textSecondary }]}>특정 사용자</Text>
                    </TouchableOpacity>
                </View>

                {notifyTarget === 'SINGLE' && (
                    <View variant="transparent" style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>수신 이메일 <Text style={{ color: colors.error }}>*</Text></Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                            placeholder="예: user@example.com"
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
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>알림 제목 <Text style={{ color: colors.error }}>*</Text></Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                        placeholder="예: [안내] 시스템 점검 및 업데이트 알림"
                        placeholderTextColor={colors.textSecondary + '80'}
                        value={notifyTitle}
                        onChangeText={setNotifyTitle}
                        editable={!isSending}
                    />
                </View>

                <View variant="transparent" style={[styles.inputContainer, { flex: 1 }]}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>알림 내용 <Text style={{ color: colors.error }}>*</Text></Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                        placeholder="전달하실 메시지 본문을 상세하게 입력해주세요."
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
                        <Text style={[styles.actionBtnText, { color: colors.text }]}>초기화</Text>
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
                                <FontAwesome name="paper-plane" size={14} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={[styles.actionBtnText, { color: '#fff' }]}>
                                    {notifyTarget === 'ALL' ? '전체 전송하기' : '단일 전송하기'}
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
