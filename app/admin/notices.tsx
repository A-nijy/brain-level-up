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

import { useNotices } from '@/hooks/useNotices';

export default function AdminNoticesScreen() {
    const {
        notices,
        loading,
        createNotice,
        updateNotice,
        deleteNotice
    } = useNotices();

    const [modalVisible, setModalVisible] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [viewingNotice, setViewingNotice] = useState<Notice | null>(null);
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isImportant, setIsImportant] = useState(false);
    const [saving, setSaving] = useState(false);

    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) {
            window.alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        setSaving(true);
        try {
            if (editingNotice) {
                await updateNotice(editingNotice.id, {
                    title: title.trim(),
                    content: content.trim(),
                    is_important: isImportant
                });
                window.alert('공지사항이 수정되었습니다.');
            } else {
                await createNotice({
                    title: title.trim(),
                    content: content.trim(),
                    is_important: isImportant
                });
                window.alert('공지사항이 등록되었습니다.');
            }
            setModalVisible(false);
        } catch (error) {
            console.error(error);
            window.alert('저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
            const performDelete = async () => {
                try {
                    await deleteNotice(id);
                    if (viewingNotice?.id === id) setViewModalVisible(false);
                } catch (error) {
                    window.alert('삭제 중 문제가 발생했습니다.');
                }
            };
            performDelete();
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
        setViewModalVisible(false);
    };

    const openViewModal = (notice: Notice) => {
        setViewingNotice(notice);
        setViewModalVisible(true);
    };

    const NoticeRow = ({ item, index }: { item: Notice, index: number }) => (
        <Animated.View entering={FadeInUp.delay(index * 30).springify()}>
            <TouchableOpacity
                style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? 'transparent' : colors.cardBackground + '30' }]}
                onPress={() => openViewModal(item)}
            >
                <View variant="transparent" style={[styles.col, { flex: 4, paddingRight: 16 }]}>
                    <View style={[styles.iconBox, { backgroundColor: (item.is_important ? colors.tint : colors.textSecondary) + '15' }]}>
                        <FontAwesome name={item.is_important ? "star" : "info-circle"} size={14} color={item.is_important ? colors.tint : colors.textSecondary} />
                    </View>
                    <View variant="transparent" style={{ flex: 1 }}>
                        <View variant="transparent" style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {item.is_important && <Text style={[styles.importantTag, { color: colors.tint }]}>[중요]</Text>}
                            <Text style={styles.cellText} numberOfLines={1}>{item.title}</Text>
                        </View>
                        <Text style={[styles.cellSubText, { color: colors.textSecondary }]} numberOfLines={1}>{item.content}</Text>
                    </View>
                </View>

                <View variant="transparent" style={[styles.col, { flex: 2, justifyContent: 'flex-end', paddingRight: 24 }]}>
                    <Text style={[styles.cellSubText, { color: colors.textSecondary, textAlign: 'right' }]}>
                        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                <View variant="transparent" style={[styles.col, { flex: 1, justifyContent: 'flex-end', gap: 12 }]}>
                    <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtn}>
                        <FontAwesome name="pencil" size={14} color={colors.tint} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                        <FontAwesome name="trash" size={14} color="#FF4444" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View variant="transparent" style={styles.content}>
                <View variant="transparent" style={styles.header}>
                    <View variant="transparent">
                        <Text style={styles.title}>공지사항 관리</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>시스템 공지 및 주요 안내 사항 관리</Text>
                    </View>
                    <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.tint }]} onPress={() => openEditModal()}>
                        <FontAwesome name="plus" size={14} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.addBtnText}>신규 공지 작성</Text>
                    </TouchableOpacity>
                </View>

                <Card style={styles.tableCard}>
                    <View variant="transparent" style={styles.tableHeader}>
                        <Text style={[styles.headerCol, { flex: 4 }]}>공지 내용</Text>
                        <Text style={[styles.headerCol, { flex: 2, textAlign: 'right', paddingRight: 24 }]}>등록 일시</Text>
                        <Text style={[styles.headerCol, { flex: 1, textAlign: 'right' }]}>관리</Text>
                    </View>

                    {loading ? (
                        <View style={styles.centerTable}>
                            <ActivityIndicator size="large" color={colors.tint} />
                        </View>
                    ) : (
                        <FlatList
                            data={notices}
                            renderItem={({ item, index }) => <NoticeRow item={item} index={index} />}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View variant="transparent" style={styles.emptyTable}>
                                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>등록된 공지사항이 없습니다.</Text>
                                </View>
                            }
                        />
                    )}
                </Card>
            </View>

            {/* View Modal */}
            <Modal
                visible={viewModalVisible}
                animationType="fade"
                transparent
                onRequestClose={() => setViewModalVisible(false)}
            >
                <View variant="transparent" style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setViewModalVisible(false)}
                    />
                    <Card style={[styles.modalContent, { maxHeight: '80%' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                            <View style={{ flex: 1, paddingRight: 16 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    {viewingNotice?.is_important && (
                                        <Text style={[styles.importantTag, { color: colors.tint, fontSize: 14 }]}>[중요]</Text>
                                    )}
                                    <Text style={[styles.modalTitle, { marginBottom: 0 }]}>{viewingNotice?.title}</Text>
                                </View>
                                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                                    {viewingNotice && new Date(viewingNotice.created_at).toLocaleString()}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setViewModalVisible(false)} style={{ padding: 4 }}>
                                <FontAwesome name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.3, marginBottom: 20 }} />

                        <Animated.ScrollView style={{ paddingRight: 8 }}>
                            <Text style={{ fontSize: 16, lineHeight: 26, color: colors.text }}>
                                {viewingNotice?.content}
                            </Text>
                        </Animated.ScrollView>

                        <View style={[styles.modalButtons, { marginTop: 24 }]}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                                onPress={() => openEditModal(viewingNotice!)}
                            >
                                <Text style={styles.modalButtonText}>수정하기</Text>
                            </TouchableOpacity>
                        </View>
                    </Card>
                </View>
            </Modal>

            {/* Edit/Create Modal */}
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
    content: {
        flex: 1,
        padding: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        marginTop: 4,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    addBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    tableCard: {
        flex: 1,
        borderRadius: 24,
        borderWidth: 0,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    headerCol: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    centerTable: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    listContent: {
        paddingBottom: 20,
    },
    tableRow: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.02)',
    },
    col: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    importantTag: {
        fontSize: 12,
        fontWeight: 'bold',
        marginRight: 6,
    },
    cellText: {
        fontSize: 15,
        fontWeight: '600',
    },
    cellSubText: {
        fontSize: 13,
        marginTop: 2,
    },
    actionBtn: {
        padding: 6,
    },
    emptyTable: {
        padding: 60,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        fontStyle: 'italic',
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
        maxWidth: 600,
        padding: 32,
        borderRadius: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 24,
    },
    importantRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 12,
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        marginBottom: 20,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        height: 200,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 32,
        gap: 12,
    },
    modalButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        minWidth: 100,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});
