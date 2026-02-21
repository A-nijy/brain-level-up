import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { SharedLibraryCategory } from '@/types';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useAdminCategories } from '@/hooks/useAdminCategories';

export default function CategoryManagerScreen() {
    const {
        categories,
        loading,
        createCategory,
        updateCategory,
        deleteCategory,
        reorderCategories
    } = useAdminCategories();

    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<SharedLibraryCategory | null>(null);
    const [title, setTitle] = useState('');

    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];

    const handleSave = async () => {
        if (!title.trim()) {
            window.alert('카테고리 이름을 입력해주세요.');
            return;
        }

        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, { title: title.trim() });
            } else {
                await createCategory(title.trim());
            }
            setModalVisible(false);
            setTitle('');
            setEditingCategory(null);
        } catch (error: any) {
            window.alert('오류: ' + error.message);
        }
    };

    const handleDelete = (category: SharedLibraryCategory) => {
        if (window.confirm(`"${category.title}" 카테고리를 삭제하시겠습니까?\n이 카테고리에 속한 자료들은 카테고리 미지정 상태가 됩니다.`)) {
            const performDelete = async () => {
                try {
                    await deleteCategory(category.id);
                } catch (error: any) {
                    window.alert('오류: ' + error.message);
                }
            };
            performDelete();
        }
    };

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        const newCategories = [...categories];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newCategories.length) return;

        [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];

        const updates = newCategories.map((cat, idx) => ({
            id: cat.id,
            display_order: idx
        }));

        try {
            await reorderCategories(updates);
        } catch (error: any) {
            window.alert('오류: ' + error.message);
        }
    };

    const CategoryRow = ({ item, index }: { item: SharedLibraryCategory, index: number }) => (
        <View variant="transparent" style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? 'transparent' : colors.cardBackground + '30' }]}>
            <View variant="transparent" style={[styles.col, { flex: 0.5 }]}>
                <Text style={[styles.cellSubText, { color: colors.textSecondary }]}>{index + 1}</Text>
            </View>

            <View variant="transparent" style={[styles.col, { flex: 3 }]}>
                <View style={[styles.iconBox, { backgroundColor: colors.tint + '10' }]}>
                    <FontAwesome name="tag" size={14} color={colors.tint} />
                </View>
                <Text style={styles.cellText}>{item.title}</Text>
            </View>

            <View variant="transparent" style={[styles.col, { flex: 1.5, justifyContent: 'flex-end', gap: 8 }]}>
                <TouchableOpacity
                    style={[styles.moveBtn, { opacity: index === 0 ? 0.3 : 1 }]}
                    onPress={() => handleMove(index, 'up')}
                    disabled={index === 0}
                >
                    <FontAwesome name="chevron-up" size={12} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.moveBtn, { opacity: index === categories.length - 1 ? 0.3 : 1 }]}
                    onPress={() => handleMove(index, 'down')}
                    disabled={index === categories.length - 1}
                >
                    <FontAwesome name="chevron-down" size={12} color={colors.textSecondary} />
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]}
                    onPress={() => {
                        setEditingCategory(item);
                        setTitle(item.title);
                        setModalVisible(true);
                    }}
                >
                    <FontAwesome name="pencil" size={12} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.error }]}
                    onPress={() => handleDelete(item)}
                >
                    <FontAwesome name="trash" size={12} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading && categories.length === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View variant="transparent" style={styles.content}>
                <View variant="transparent" style={styles.header}>
                    <View variant="transparent">
                        <Text style={styles.title}>카테고리 관리</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>공유 자료실 분류 체계 및 정렬 순서 설정</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.addBtn, { backgroundColor: colors.tint }]}
                        onPress={() => {
                            setEditingCategory(null);
                            setTitle('');
                            setModalVisible(true);
                        }}
                    >
                        <FontAwesome name="plus" size={14} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.addBtnText}>신규 카테고리</Text>
                    </TouchableOpacity>
                </View>

                <Card style={styles.tableCard}>
                    <View variant="transparent" style={styles.tableHeader}>
                        <Text style={[styles.headerCol, { flex: 0.5 }]}>#</Text>
                        <Text style={[styles.headerCol, { flex: 3 }]}>카테고리 명칭</Text>
                        <Text style={[styles.headerCol, { flex: 1.5, textAlign: 'right' }]}>관리</Text>
                    </View>
                    <FlatList
                        data={categories}
                        renderItem={({ item, index }) => <CategoryRow item={item} index={index} />}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View variant="transparent" style={styles.emptyTable}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>등록된 카테고리가 없습니다.</Text>
                            </View>
                        }
                    />
                </Card>
            </View>

            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <Card style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editingCategory ? '카테고리 이름 수정' : '새 카테고리 추가'}</Text>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>이름</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            placeholder="예: 비즈니스 영어, JLPT N1 등"
                            placeholderTextColor={colors.textSecondary}
                            value={title}
                            onChangeText={setTitle}
                            autoFocus
                        />
                        <View variant="transparent" style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: colors.border + '30' }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={{ color: colors.text }}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: colors.tint }]}
                                onPress={handleSave}
                            >
                                <Text style={styles.modalBtnText}>저장하기</Text>
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
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cellText: {
        fontSize: 15,
        fontWeight: '600',
    },
    cellSubText: {
        fontSize: 13,
        fontWeight: '600',
    },
    moveBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    divider: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginHorizontal: 4,
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTable: {
        padding: 60,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: 400,
        borderRadius: 24,
        padding: 32,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 24,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    modalBtn: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    modalBtnText: {
        color: '#fff',
        fontWeight: '700',
    }
});
