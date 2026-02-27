import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Platform, Modal, TouchableWithoutFeedback, TextInput } from 'react-native';
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
import { SharedLibraryService } from '@/services/SharedLibraryService';
import { useAuth } from '@/contexts/AuthContext';
import { useHeader, useHeaderActions, useWebHeaderTitle } from '@/contexts/HeaderContext';
import { useAlert } from '@/contexts/AlertContext';
import { useSectionActions } from '@/hooks/useSectionActions';
import { Strings } from '@/constants/Strings';

export default function LibraryDetailScreen() {
    const { id, title: paramTitle } = useLocalSearchParams<{ id: string; title?: string }>();
    const router = useRouter();
    const libraryId = id;
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { showAlert } = useAlert();

    const { profile } = useAuth();

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

    // 웹 헤더 제목 설정
    useWebHeaderTitle(library?.title || paramTitle || Strings.libraryDetail.title, [library?.title, paramTitle]);

    const {
        sharing,
        reorderMode,
        setReorderMode,
        createModalVisible,
        setCreateModalVisible,
        newSectionTitle,
        setNewSectionTitle,
        creating,
        editModalVisible,
        setEditModalVisible,
        editingSection,
        editSectionTitle,
        setEditSectionTitle,
        updating,
        handleShare,
        handleCreateSection,
        handleEditSection,
        openEditModal,
        handleDeleteSection,
        handleMoveUp,
        handleMoveDown
    } = useSectionActions(
        library,
        sections,
        createSection,
        updateSection,
        deleteSection,
        reorderSections
    );

    const renderItem = ({ item, index }: { item: Section, index: number }) => (
        <Animated.View
            entering={FadeInUp.delay(index * 40).duration(400)}
            style={styles.cardWrapper}
        >
            <Card
                style={styles.sectionCard}
                onPress={reorderMode ? undefined : () => router.push({
                    pathname: "/library/[id]/section/[sectionId]",
                    params: { id: libraryId, sectionId: item.id, title: item.title }
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
                            <FontAwesome name={Strings.settings.icons.down as any} size={16} color={colors.tint} style={{ transform: [{ rotate: '180deg' }] }} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.reorderButton, index === sections.length - 1 && { opacity: 0.3 }]}
                            onPress={() => handleMoveDown(index)}
                            disabled={index === sections.length - 1}
                        >
                            <FontAwesome name={Strings.settings.icons.down as any} size={16} color={colors.tint} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View variant="transparent" style={styles.rightAction}>
                        <TouchableOpacity
                            onPress={() => openEditModal(item)}
                            style={styles.editIconButton}
                        >
                            <FontAwesome name={Strings.settings.icons.pencil as any} size={18} color={colors.tint} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleDeleteSection(item)}
                            style={styles.deleteIconButton}
                        >
                            <FontAwesome name={Strings.common.icons.delete as any} size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <FontAwesome name={Strings.home.icons.arrowRight as any} size={20} color={colors.border} />
                    </View>
                )}
            </Card>
        </Animated.View>
    );


    // 웹 헤더 액션 등록 (자동 정리 기능 포함)
    useHeaderActions([
        {
            id: 'share',
            icon: Strings.shared.icons.globe,
            onPress: handleShare,
            loading: sharing
        },
        {
            id: 'create-section',
            icon: Strings.shared.icons.plus,
            onPress: () => setCreateModalVisible(true)
        },
        {
            id: 'toggle-reorder',
            icon: Strings.settings.icons.refresh,
            onPress: () => setReorderMode(prev => !prev),
            color: reorderMode ? colors.tint : colors.textSecondary
        }
    ], [sharing, reorderMode, library]);

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
                    headerTitle: library?.title || paramTitle || Strings.libraryDetail.title,
                    headerTintColor: colors.text,
                    headerRight: () => (
                        <View variant="transparent" style={{ flexDirection: 'row', alignItems: 'center', marginRight: Platform.OS === 'web' ? 24 : 0 }}>
                            <TouchableOpacity
                                onPress={handleShare}
                                style={styles.headerIconButton}
                                disabled={sharing}
                            >
                                {sharing ? (
                                    <ActivityIndicator size="small" color={colors.tint} />
                                ) : (
                                    <FontAwesome name={Strings.shared.icons.globe as any} size={18} color={colors.tint} />
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setCreateModalVisible(true)}
                                style={styles.headerIconButton}
                            >
                                <FontAwesome name={Strings.shared.icons.plus as any} size={18} color={colors.tint} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setReorderMode(!reorderMode)}
                                style={[styles.headerIconButton, { marginRight: 0 }]}
                            >
                                <FontAwesome name={Strings.settings.icons.refresh as any} size={20} color={reorderMode ? colors.tint : colors.textSecondary} />
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
                        <Text style={styles.subHeaderTitle}>{Strings.libraryDetail.sectionListHeader}</Text>

                        {Platform.OS === 'web' && (
                            <TouchableOpacity
                                style={[styles.webAddButton, { backgroundColor: colors.tint + '10', borderColor: colors.tint + '30' }]}
                                onPress={() => setCreateModalVisible(true)}
                            >
                                <FontAwesome name={Strings.shared.icons.plus as any} size={16} color={colors.tint} style={{ marginRight: 10 }} />
                                <Text style={[styles.webAddButtonText, { color: colors.tint }]}>{Strings.libraryDetail.modal.createTitle}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    <View variant="transparent" style={styles.emptyContainer}>
                        <FontAwesome name={Strings.tabs.icons.libraries as any} size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{Strings.libraryDetail.empty}</Text>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: colors.tint }]}
                            onPress={() => setCreateModalVisible(true)}
                        >
                            <Text style={styles.addButtonText}>{Strings.libraryDetail.addFirst}</Text>
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
                                <Text style={styles.modalTitle}>{Strings.libraryDetail.modal.createTitle}</Text>
                                <Text style={styles.modalSubtitle}>{Strings.libraryDetail.modal.subtitle}</Text>
                                <TextInput
                                    style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                    placeholder={Strings.libraryDetail.modal.placeholder}
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
                                        <Text style={{ fontWeight: '700' }}>{Strings.common.cancel}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, { backgroundColor: colors.tint }]}
                                        onPress={handleCreateSection}
                                        disabled={creating}
                                    >
                                        {creating ? <ActivityIndicator size="small" color="#fff" /> : (
                                            <Text style={{ color: '#fff', fontWeight: '800' }}>{Strings.libraryDetail.modal.btnAdd}</Text>
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
                                <Text style={styles.modalTitle}>{Strings.libraryDetail.modal.editTitle}</Text>
                                <TextInput
                                    style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                    placeholder={Strings.libraryDetail.modal.placeholder}
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
                                        <Text style={{ fontWeight: '700' }}>{Strings.common.cancel}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, { backgroundColor: colors.tint }]}
                                        onPress={handleEditSection}
                                        disabled={updating}
                                    >
                                        {updating ? <ActivityIndicator size="small" color="#fff" /> : (
                                            <Text style={{ color: '#fff', fontWeight: '800' }}>{Strings.libraryDetail.modal.btnEdit}</Text>
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
    webAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1.5,
        marginTop: 20,
        marginBottom: 8,
    },
    webAddButtonText: {
        fontSize: 16,
        fontWeight: '800',
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
