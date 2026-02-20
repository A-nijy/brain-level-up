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

    const renderItem = ({ item, index }: { item: SharedLibraryCategory; index: number }) => (
        <Card style={styles.card}>
            <View variant="transparent" style={styles.cardContent}>
                <View variant="transparent">
                    <Text style={styles.categoryTitle}>{item.title}</Text>
                    <Text style={[styles.subText, { color: colors.textSecondary }]}>순서: {index + 1}</Text>
                </View>
                <View variant="transparent" style={styles.actionGroup}>
                    <TouchableOpacity
                        style={[styles.moveButton, { opacity: index === 0 ? 0.3 : 1 }]}
                        onPress={() => handleMove(index, 'up')}
                        disabled={index === 0}
                    >
                        <FontAwesome name="chevron-up" size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.moveButton, { opacity: index === categories.length - 1 ? 0.3 : 1 }]}
                        onPress={() => handleMove(index, 'down')}
                        disabled={index === categories.length - 1}
                    >
                        <FontAwesome name="chevron-down" size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.miniButton, { backgroundColor: colors.tint }]}
                        onPress={() => {
                            setEditingCategory(item);
                            setTitle(item.title);
                            setModalVisible(true);
                        }}
                    >
                        <FontAwesome name="pencil" size={14} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.miniButton, { backgroundColor: colors.error }]}
                        onPress={() => handleDelete(item)}
                    >
                        <FontAwesome name="trash" size={14} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </Card>
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
            <View variant="transparent" style={styles.header}>
                <View variant="transparent">
                    <Text style={styles.title}>카테고리 관리</Text>
                    <Text style={[styles.subText, { color: colors.textSecondary }]}>공유 자료실 분류 체계 설정</Text>
                </View>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.tint }]}
                    onPress={() => {
                        setEditingCategory(null);
                        setTitle('');
                        setModalVisible(true);
                    }}
                >
                    <FontAwesome name="plus" size={14} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.addButtonText}>추가</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={categories}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.emptyText}>등록된 카테고리가 없습니다.</Text>}
            />

            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                        <Text style={styles.modalTitle}>{editingCategory ? '카테고리 수정' : '카테고리 추가'}</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            placeholder="카테고리 이름을 입력하세요"
                            placeholderTextColor={colors.textSecondary}
                            value={title}
                            onChangeText={setTitle}
                            autoFocus
                        />
                        <View variant="transparent" style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.border }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                                onPress={handleSave}
                            >
                                <Text style={styles.modalButtonText}>저장</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
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
    header: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    subText: {
        fontSize: 14,
        marginTop: 4,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    list: {
        padding: 20,
    },
    card: {
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    actionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    moveButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#999',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 24,
        padding: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    modalButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});
