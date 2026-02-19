import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, Switch, ActivityIndicator } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { NoticeService } from '@/services/NoticeService';
import { Notice } from '@/types';
import { Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function AdminNoticesScreen() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isImportant, setIsImportant] = useState(false);
    const [saving, setSaving] = useState(false);

    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        setLoading(true);
        try {
            const data = await NoticeService.getNotices();
            setNotices(data);
        } catch (error) {
            console.error(error);
            window.alert('공지사항을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) {
            window.alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        setSaving(true);
        try {
            if (editingNotice) {
                await NoticeService.updateNotice(editingNotice.id, {
                    title,
                    content,
                    is_important: isImportant
                });
                window.alert('공지사항이 수정되었습니다.');
            } else {
                await NoticeService.createNotice({
                    title,
                    content,
                    is_important: isImportant
                });
                window.alert('공지사항이 등록되었습니다.');
            }
            setModalVisible(false);
            fetchNotices();
        } catch (error) {
            console.error(error);
            window.alert('저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
            const deleteNotice = async () => {
                try {
                    await NoticeService.deleteNotice(id);
                    fetchNotices();
                } catch (error) {
                    window.alert('삭제 중 문제가 발생했습니다.');
                }
            };
            deleteNotice();
        }
    };

    const openEditModal = (notice?: Notice) => {
        if (notice) {
            setEditingNotice(notice);
            setTitle(notice.title);
            setContent(notice.content);
            setIsImportant(notice.is_important);
        } else {
            setEditingNotice(null);
            setTitle('');
            setContent('');
            setIsImportant(false);
        }
        setModalVisible(true);
    };

    const renderItem = ({ item, index }: { item: Notice; index: number }) => (
        <Animated.View entering={FadeInUp.delay(index * 50).springify()}>
            <Card style={styles.card}>
                <View variant="transparent" style={styles.cardHeader}>
                    <View variant="transparent" style={styles.titleArea}>
                        {item.is_important && (
                            <View style={[styles.importantBadge, { backgroundColor: colors.tint }]}>
                                <Text style={styles.importantBadgeText}>중요</Text>
                            </View>
                        )}
                        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    </View>
                    <View variant="transparent" style={styles.actions}>
                        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
                            <FontAwesome name="pencil" size={18} color={colors.tint} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
                            <FontAwesome name="trash" size={18} color="#FF4444" />
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={[styles.date, { color: colors.textSecondary }]}>
                    {new Date(item.created_at).toLocaleString()}
                </Text>
            </Card>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: '공지사항 관리',
                    headerShown: true,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                    headerRight: () => (
                        <TouchableOpacity onPress={() => openEditModal()}>
                            <FontAwesome name="plus" size={20} color={colors.tint} />
                        </TouchableOpacity>
                    ),
                }}
            />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.tint} />
                </View>
            ) : (
                <FlatList
                    data={notices}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={{ color: colors.textSecondary }}>공지사항이 없습니다.</Text>
                        </View>
                    }
                />
            )}

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <View variant="transparent" style={styles.modalOverlay}>
                    <Card style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editingNotice ? '공지사항 수정' : '새 공지사항'}</Text>

                        <View variant="transparent" style={styles.importantRow}>
                            <Text style={styles.label}>중요 공지 설정</Text>
                            <Switch
                                value={isImportant}
                                onValueChange={setIsImportant}
                                trackColor={{ false: colors.border, true: colors.tint }}
                            />
                        </View>

                        <Text style={styles.label}>제목</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="공지 제목을 입력하세요"
                            placeholderTextColor={colors.textSecondary + '80'}
                        />

                        <Text style={styles.label}>내용</Text>
                        <TextInput
                            style={[styles.textArea, { color: colors.text, borderColor: colors.border }]}
                            value={content}
                            onChangeText={setContent}
                            placeholder="공지 내용을 입력하세요"
                            placeholderTextColor={colors.textSecondary + '80'}
                            multiline
                            numberOfLines={8}
                            textAlignVertical="top"
                        />

                        <View variant="transparent" style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalButtonText}>{editingNotice ? '수정' : '등록'}</Text>}
                            </TouchableOpacity>
                        </View>
                    </Card>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    titleArea: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    importantBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
    },
    importantBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        marginLeft: 12,
    },
    actionButton: {
        padding: 5,
        marginLeft: 10,
    },
    date: {
        fontSize: 12,
    },
    empty: {
        alignItems: 'center',
        paddingTop: 100,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 500,
        padding: 24,
        borderRadius: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 12,
    },
    importantRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        height: 150,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 24,
        gap: 12,
    },
    modalButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#999',
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
