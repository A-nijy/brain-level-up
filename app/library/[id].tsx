import React, { useState } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, RefreshControl, Platform, Modal, TouchableWithoutFeedback, TextInput } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLibrarySections } from '@/hooks/useLibrarySections';
import { useLibraryDetail } from '@/hooks/useLibraryDetail'; // For library meta info
import { LibraryService } from '@/services/LibraryService';
import { Section } from '@/types';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function LibraryDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const libraryId = Array.isArray(id) ? id[0] : id;
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const { library } = useLibraryDetail(libraryId);
    const {
        sections,
        loading,
        refreshing,
        refresh,
        reorderSections,
        createSection,
        updateSection,
        deleteSection
    } = useLibrarySections(libraryId);

    const [reorderMode, setReorderMode] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [creating, setCreating] = useState(false);

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [editSectionTitle, setEditSectionTitle] = useState('');
    const [updating, setUpdating] = useState(false);

    const handleCreateSection = async () => {
        if (!newSectionTitle.trim()) {
            Alert.alert('오류', '이름을 입력해주세요.');
            return;
        }

        setCreating(true);
        try {
            await createSection(newSectionTitle.trim());
            setNewSectionTitle('');
            setCreateModalVisible(false);
        } catch (error: any) {
            Alert.alert('오류', '섹션 생성 실패: ' + error.message);
        } finally {
            setCreating(false);
        }
    };

    const handleEditSection = async () => {
        if (!editingSection || !editSectionTitle.trim()) {
            Alert.alert('오류', '이름을 입력해주세요.');
            return;
        }

        setUpdating(true);
        try {
            await updateSection(editingSection.id, { title: editSectionTitle.trim() });
            setEditSectionTitle('');
            setEditingSection(null);
            setEditModalVisible(false);
        } catch (error: any) {
            Alert.alert('오류', '섹션 수정 실패: ' + error.message);
        } finally {
            setUpdating(false);
        }
    };

    const openEditModal = (section: Section) => {
        setEditingSection(section);
        setEditSectionTitle(section.title);
        setEditModalVisible(true);
    };

    const handleDeleteSection = async (section: Section) => {
        Alert.alert(
            '섹션 삭제',
            `'${section.title}' 섹션을 삭제하시겠습니까? 내부의 모든 단어도 삭제됩니다.`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteSection(section.id);
                        } catch (error: any) {
                            Alert.alert('오류', '삭제 실패: ' + error.message);
                        }
                    }
                }
            ]
        );
    };

    const handleMoveUp = async (index: number) => {
        if (index === 0) return;
        const newSections = [...sections];
        [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
        await reorderSections(newSections);
    };

    const handleMoveDown = async (index: number) => {
        if (index === sections.length - 1) return;
        const newSections = [...sections];
        [newSections[index + 1], newSections[index]] = [newSections[index], newSections[index + 1]];
        await reorderSections(newSections);
    };

    const renderItem = ({ item, index }: { item: Section, index: number }) => (
        <Animated.View
            entering={FadeInUp.delay(index * 40).duration(400)}
            style={styles.cardWrapper}
        >
            <Card
                style={styles.sectionCard}
                onPress={reorderMode ? undefined : () => router.push({
                    pathname: "/library/[id]/section/[sectionId]",
                    params: { id: libraryId, sectionId: item.id }
                })}
            >
                <View variant="transparent" style={styles.sectionInfo}>
                    <Text style={styles.sectionTitle}>{item.title}</Text>
                </View>

                {reorderMode ? (
                    <View variant="transparent" style={styles.reorderControls}>
                        <TouchableOpacity
                            style={[styles.reorderButton, index === 0 && { opacity: 0.3 }]}
                            onPress={() => handleMoveUp(index)}
                            disabled={index === 0}
                        >
                            <FontAwesome name="arrow-up" size={16} color={colors.tint} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.reorderButton, index === sections.length - 1 && { opacity: 0.3 }]}
                            onPress={() => handleMoveDown(index)}
                            disabled={index === sections.length - 1}
                        >
                            <FontAwesome name="arrow-down" size={16} color={colors.tint} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View variant="transparent" style={styles.rightAction}>
                        <TouchableOpacity
                            onPress={() => openEditModal(item)}
                            style={styles.editIconButton}
                        >
                            <FontAwesome name="pencil" size={18} color={colors.tint} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleDeleteSection(item)}
                            style={styles.deleteIconButton}
                        >
                            <FontAwesome name="trash-o" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <FontAwesome name="angle-right" size={20} color={colors.border} />
                    </View>
                )}
            </Card>
        </Animated.View>
    );

    if (loading && !refreshing) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingHorizontal: Platform.OS === 'web' ? 24 : 0 }]}>
            <Stack.Screen
                options={{
                    headerTitle: library?.title || '암기장',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                    headerRight: () => (
                        <View variant="transparent" style={{ flexDirection: 'row', alignItems: 'center', marginRight: Platform.OS === 'web' ? 24 : 0 }}>
                            <TouchableOpacity
                                onPress={() => setCreateModalVisible(true)}
                                style={styles.headerIconButton}
                            >
                                <FontAwesome name="plus" size={18} color={colors.tint} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setReorderMode(!reorderMode)}
                                style={[styles.headerIconButton, { marginRight: 0 }]}
                            >
                                <FontAwesome name="sort" size={20} color={reorderMode ? colors.tint : colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    )
                }}
            />

            <FlatList
                data={sections}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.tint} />
                }
                ListHeaderComponent={
                    <View variant="transparent" style={styles.listHeader}>
                        {library?.description && (
                            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                                {library.description}
                            </Text>
                        )}
                        <Text style={styles.subHeaderTitle}>항목 목록 (Day, Chapter 등)</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <FontAwesome name="folder-open-o" size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>생성된 항목이 없습니다.</Text>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: colors.tint }]}
                            onPress={() => setCreateModalVisible(true)}
                        >
                            <Text style={styles.addButtonText}>첫 번째 항목 추가하기</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            <Modal
                visible={createModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setCreateModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setCreateModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <Card style={styles.modalContent}>
                                <Text style={styles.modalTitle}>새 항목 추가</Text>
                                <Text style={styles.modalSubtitle}>예: Day 1, Chapter 1, 업무용 단어 등</Text>
                                <TextInput
                                    style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                    placeholder="항목 이름을 입력하세요"
                                    placeholderTextColor={colors.textSecondary}
                                    value={newSectionTitle}
                                    onChangeText={setNewSectionTitle}
                                    autoFocus
                                />
                                <View variant="transparent" style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, { backgroundColor: colors.border + '30' }]}
                                        onPress={() => setCreateModalVisible(false)}
                                    >
                                        <Text style={{ fontWeight: '700' }}>취소</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, { backgroundColor: colors.tint }]}
                                        onPress={handleCreateSection}
                                        disabled={creating}
                                    >
                                        {creating ? <ActivityIndicator size="small" color="#fff" /> : (
                                            <Text style={{ color: '#fff', fontWeight: '800' }}>추가하기</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </Card>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Edit Section Modal */}
            <Modal
                visible={editModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <Card style={styles.modalContent}>
                                <Text style={styles.modalTitle}>항목 이름 수정</Text>
                                <TextInput
                                    style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                    placeholder="항목 이름을 입력하세요"
                                    placeholderTextColor={colors.textSecondary}
                                    value={editSectionTitle}
                                    onChangeText={setEditSectionTitle}
                                    autoFocus
                                />
                                <View variant="transparent" style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, { backgroundColor: colors.border + '30' }]}
                                        onPress={() => setEditModalVisible(false)}
                                    >
                                        <Text style={{ fontWeight: '700' }}>취소</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, { backgroundColor: colors.tint }]}
                                        onPress={handleEditSection}
                                        disabled={updating}
                                    >
                                        {updating ? <ActivityIndicator size="small" color="#fff" /> : (
                                            <Text style={{ color: '#fff', fontWeight: '800' }}>수정하기</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </Card>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listHeader: {
        paddingHorizontal: 4,
        paddingBottom: 24,
        marginTop: 12,
    },
    descriptionText: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500',
        marginBottom: 20,
    },
    subHeaderTitle: {
        fontSize: 14,
        fontWeight: '800',
        opacity: 0.5,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    cardWrapper: {
        marginBottom: 12,
    },
    sectionCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1.5,
    },
    sectionInfo: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    rightAction: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteIconButton: {
        padding: 10,
        marginRight: 4,
    },
    editIconButton: {
        padding: 10,
        marginRight: 4,
    },
    reorderControls: {
        flexDirection: 'row',
        gap: 12,
    },
    reorderButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(79, 70, 229, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerIconButton: {
        padding: 8,
        marginLeft: 10,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 32,
    },
    addButton: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        padding: 24,
        borderRadius: 32,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        opacity: 0.6,
        marginBottom: 24,
    },
    input: {
        height: 56,
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 20,
        fontSize: 16,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
