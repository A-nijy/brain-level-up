import React, { useState } from 'react';
import { StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Modal, TextInput, TouchableWithoutFeedback } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SharedSection } from '@/types';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useSharedDetail } from '@/hooks/useSharedDetail';
import { Strings } from '@/constants/Strings';
import { useAlert } from '@/contexts/AlertContext';

export default function SharedLibraryDetailScreen() {
    const { id, title: paramTitle } = useLocalSearchParams<{ id: string; title?: string }>();
    const router = useRouter();

    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { showAlert } = useAlert();

    const {
        library,
        sections,
        loading,
        createSharedSection,
        updateSharedSection,
        deleteSharedSection,
        reorderSharedSections
    } = useSharedDetail(id as string || '');

    // Section creation modal
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [creating, setCreating] = useState(false);

    // Section edit modal
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingSection, setEditingSection] = useState<SharedSection | null>(null);
    const [editSectionTitle, setEditSectionTitle] = useState('');
    const [updating, setUpdating] = useState(false);

    const handleCreateSection = async () => {
        if (!newSectionTitle.trim()) {
            showAlert({ title: Strings.common.warning, message: Strings.adminSharedDetail.alerts.enterName });
            return;
        }

        setCreating(true);
        try {
            await createSharedSection(newSectionTitle.trim());
            setNewSectionTitle('');
            setCreateModalVisible(false);
        } catch (error: any) {
            showAlert({ title: Strings.common.error, message: `${Strings.adminSharedDetail.alerts.createFail}: ${error.message}` });
        } finally {
            setCreating(false);
        }
    };

    const handleEditSection = async () => {
        if (!editingSection || !editSectionTitle.trim()) {
            showAlert({ title: Strings.common.warning, message: Strings.adminSharedDetail.alerts.enterName });
            return;
        }

        setUpdating(true);
        try {
            await updateSharedSection(editingSection.id, { title: editSectionTitle.trim() });
            setEditSectionTitle('');
            setEditingSection(null);
            setEditModalVisible(false);
        } catch (error: any) {
            showAlert({ title: Strings.common.error, message: `${Strings.adminSharedDetail.alerts.editFail}: ${error.message}` });
        } finally {
            setUpdating(false);
        }
    };

    const openEditModal = (section: SharedSection) => {
        setEditingSection(section);
        setEditSectionTitle(section.title);
        setEditModalVisible(true);
    };

    const handleDeleteSection = async (section: SharedSection) => {
        showAlert({
            title: Strings.common.deleteConfirmTitle,
            message: Strings.adminSharedDetail.alerts.deleteConfirm(section.title),
            buttons: [
                { text: Strings.common.cancel, style: 'cancel' },
                {
                    text: Strings.common.delete,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteSharedSection(section.id);
                        } catch (error: any) {
                            showAlert({ title: Strings.common.error, message: `${Strings.common.delete} ${Strings.common.error}: ${error.message}` });
                        }
                    }
                }
            ]
        });
    };

    const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
        const newSections = [...sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newSections.length) return;

        [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];

        const updates = newSections.map((s, idx) => ({
            id: s.id,
            display_order: idx
        }));

        try {
            await reorderSharedSections(updates);
        } catch (error: any) {
            showAlert({ title: Strings.common.error, message: `${Strings.adminSharedDetail.alerts.reorderFail}: ${error.message}` });
        }
    };

    const renderItem = ({ item, index }: { item: SharedSection, index: number }) => (
        <Animated.View entering={FadeInUp.delay(index * 40).duration(400)}>
            <Card style={styles.sectionCard}>
                <View variant="transparent" style={styles.sectionInfo}>
                    <Text style={styles.sectionTitle}>{item.title}</Text>
                </View>
                <View variant="transparent" style={styles.actionGroup}>
                    <TouchableOpacity
                        style={[styles.moveButton, { opacity: index === 0 ? 0.3 : 1 }]}
                        onPress={() => handleMoveSection(index, 'up')}
                        disabled={index === 0}
                    >
                        <FontAwesome name={Strings.settings.icons.down as any} size={14} color={colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.moveButton, { opacity: index === sections.length - 1 ? 0.3 : 1 }]}
                        onPress={() => handleMoveSection(index, 'down')}
                        disabled={index === sections.length - 1}
                    >
                        <FontAwesome name={Strings.settings.icons.down as any} size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.miniButton, { backgroundColor: colors.tint }]}
                        onPress={() => router.push({
                            pathname: "/admin/shared-library/[id]/section/[sectionId]" as any,
                            params: { id: id, sectionId: item.id }
                        })}
                    >
                        <FontAwesome name={Strings.shared.icons.globe as any} size={14} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.miniButton, { backgroundColor: '#F59E0B' }]}
                        onPress={() => openEditModal(item)}
                    >
                        <FontAwesome name={Strings.settings.icons.pencil as any} size={14} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.miniButton, { backgroundColor: colors.error }]}
                        onPress={() => handleDeleteSection(item)}
                    >
                        <FontAwesome name="trash" size={14} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Card>
        </Animated.View>
    );

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ headerTitle: paramTitle || Strings.adminSharedDetail.title }} />
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    headerTitle: library?.title || paramTitle || Strings.adminSharedDetail.title,
                    headerTintColor: colors.text,
                    headerRight: () => (
                        <TouchableOpacity onPress={() => setCreateModalVisible(true)} style={{ marginRight: 16 }}>
                            <FontAwesome name={Strings.shared.icons.plus as any} size={20} color={colors.tint} />
                        </TouchableOpacity>
                    )
                }}
            />

            <ScrollView contentContainerStyle={styles.content}>
                <View variant="transparent" style={styles.topHeader}>
                    <View variant="transparent" style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.push('/admin/shared-manager')}
                        >
                            <FontAwesome name="chevron-left" size={18} color={colors.text} />
                        </TouchableOpacity>
                        <View variant="transparent">
                            <Text style={styles.titleText}>{library?.title || Strings.adminSharedDetail.title}</Text>
                            <Text style={[styles.countText, { color: colors.textSecondary }]}>{Strings.adminSharedDetail.count(sections.length)}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colors.tint }]}
                        onPress={() => setCreateModalVisible(true)}
                    >
                        <FontAwesome name={Strings.shared.icons.plus as any} size={14} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.addButtonText}>{Strings.adminSharedDetail.addSection}</Text>
                    </TouchableOpacity>
                </View>

                <View variant="transparent" style={styles.header}>
                    {library?.description && (
                        <Text style={[styles.description, { color: colors.textSecondary }]}>
                            {library.description}
                        </Text>
                    )}
                </View>

                <View variant="transparent" style={styles.sectionList}>
                    <Text style={[styles.subHeaderTitle, { color: colors.textSecondary }]}>{Strings.adminSharedDetail.sectionList}</Text>
                    {sections.map((item, index) => renderItem({ item, index }))}
                    {sections.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <FontAwesome name={Strings.shared.icons.globe as any} size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{Strings.adminSharedDetail.empty}</Text>
                            <TouchableOpacity
                                style={[styles.addButton, { backgroundColor: colors.tint }]}
                                onPress={() => setCreateModalVisible(true)}
                            >
                                <Text style={styles.addButtonText}>{Strings.adminSharedDetail.addFirstSection}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Create Section Modal */}
            <Modal visible={createModalVisible} transparent animationType="fade">
                <TouchableWithoutFeedback onPress={() => setCreateModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                                <Text style={styles.modalTitle}>{Strings.adminSharedDetail.modal.createTitle}</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                    value={newSectionTitle}
                                    onChangeText={setNewSectionTitle}
                                    placeholder={Strings.adminSharedDetail.modal.placeholder}
                                    placeholderTextColor={colors.textSecondary}
                                    autoFocus
                                />
                                <View variant="transparent" style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, { backgroundColor: colors.border }]}
                                        onPress={() => setCreateModalVisible(false)}
                                    >
                                        <Text style={[styles.modalButtonText, { color: colors.text }]}>{Strings.common.cancel}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, { backgroundColor: colors.tint }]}
                                        onPress={handleCreateSection}
                                        disabled={creating}
                                    >
                                        <Text style={styles.modalButtonText}>{creating ? Strings.common.creating : Strings.common.confirm}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Edit Section Modal */}
            <Modal visible={editModalVisible} transparent animationType="fade">
                <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                                <Text style={styles.modalTitle}>{Strings.adminSharedDetail.modal.editTitle}</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                    value={editSectionTitle}
                                    onChangeText={setEditSectionTitle}
                                    placeholder={Strings.adminSharedDetail.modal.placeholder}
                                    placeholderTextColor={colors.textSecondary}
                                    autoFocus
                                />
                                <View variant="transparent" style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, { backgroundColor: colors.border }]}
                                        onPress={() => setEditModalVisible(false)}
                                    >
                                        <Text style={[styles.modalButtonText, { color: colors.text }]}>{Strings.common.cancel}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, { backgroundColor: colors.tint }]}
                                        onPress={handleEditSection}
                                        disabled={updating}
                                    >
                                        <Text style={styles.modalButtonText}>{updating ? Strings.common.saving : Strings.common.save}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
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
    content: {
        padding: 32,
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    titleText: {
        fontSize: 24,
        fontWeight: '800',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginLeft: -8,
    },
    header: {
        marginBottom: 24,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 12,
    },
    countText: {
        fontSize: 14,
        fontWeight: '700',
        opacity: 0.6,
    },
    sectionList: {
        marginBottom: 24,
    },
    subHeaderTitle: {
        fontSize: 14,
        fontWeight: '800',
        opacity: 0.5,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    sectionCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1.5,
        marginBottom: 12,
    },
    sectionInfo: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
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
    actionGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    miniButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    moveButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        maxWidth: 400,
        padding: 24,
        borderRadius: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
