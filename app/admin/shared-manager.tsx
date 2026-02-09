import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { AdminService } from '@/services/AdminService';
import { SharedLibraryService } from '@/services/SharedLibraryService';
import { SharedLibrary, Library } from '@/types';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function SharedManagerScreen() {
    const [publicLibs, setPublicLibs] = useState<any[]>([]);
    const [sharedLibs, setSharedLibs] = useState<SharedLibrary[]>([]);
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [pLibs, sLibs] = await Promise.all([
                AdminService.getPublicLibraries(),
                SharedLibraryService.getSharedLibraries()
            ]);
            setPublicLibs(pLibs);
            setSharedLibs(sLibs);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = (lib: any) => {
        Alert.alert(
            'Publish to Shared Market',
            `Publish "${lib.title}" to the Shared Library list?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Publish',
                    onPress: async () => {
                        try {
                            await AdminService.publishToShared(lib.id);
                            Alert.alert('Success', 'Library published successfully!');
                            loadData();
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    const [editingLib, setEditingLib] = useState<SharedLibrary | null>(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', category: '' });

    const handleEditOpen = (lib: SharedLibrary) => {
        setEditingLib(lib);
        setEditForm({
            title: lib.title,
            description: lib.description || '',
            category: lib.category || ''
        });
    };

    const handleUpdate = async () => {
        if (!editingLib) return;
        try {
            await AdminService.updateSharedLibrary(editingLib.id, editForm);
            Alert.alert('Success', 'Library updated successfully!');
            setEditingLib(null);
            loadData();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleDeleteShared = (lib: SharedLibrary) => {
        Alert.alert(
            'Delete Shared Library',
            `Remove "${lib.title}" from the Shared Market?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AdminService.deleteSharedLibrary(lib.id);
                            loadData();
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    const createTestSharedLibrary = async () => {
        try {
            setLoading(true);
            // 1. Create a dummy library
            const { data: user } = await supabase.auth.getUser();
            if (!user.user) throw new Error('No admin user found');

            const { data: lib, error: libErr } = await supabase
                .from('libraries')
                .insert({
                    title: '[TEST] Premium Content',
                    description: 'This is a test library for rewarded ad flow.',
                    category: 'TEST',
                    user_id: user.user.id,
                    is_public: true
                })
                .select()
                .single();

            if (libErr) throw libErr;

            // 2. Add some items
            const { error: itemsErr } = await supabase
                .from('items')
                .insert([
                    { library_id: lib.id, question: 'Ad Test 1', answer: 'Success 1' },
                    { library_id: lib.id, question: 'Ad Test 2', answer: 'Success 2' }
                ]);

            if (itemsErr) throw itemsErr;

            // 3. Publish to shared
            await AdminService.publishToShared(lib.id);

            Alert.alert('Success', 'Test Shared Library created! Go to the "Shared" tab to test downloading.');
            loadData();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View variant="transparent" style={styles.header}>
                <View variant="transparent">
                    <Text style={styles.title}>Shared Market Manager</Text>
                    <Text style={[styles.subText, { color: colors.textSecondary }]}>Curation and quality control</Text>
                </View>
                <TouchableOpacity style={[styles.testButton, { backgroundColor: colors.tint + '15' }]} onPress={createTestSharedLibrary}>
                    <FontAwesome name="flask" size={16} color={colors.tint} style={{ marginRight: 8 }} />
                    <Text style={[styles.testButtonText, { color: colors.tint }]}>Create Test Lib</Text>
                </TouchableOpacity>
            </View>

            <View variant="transparent" style={styles.section}>
                <View variant="transparent" style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Public Libraries (Candidates)</Text>
                    <TouchableOpacity onPress={loadData}>
                        <FontAwesome name="refresh" size={16} color={colors.tint} />
                    </TouchableOpacity>
                </View>
                {publicLibs.map((item) => (
                    <Card key={item.id} style={styles.libCard}>
                        <View variant="transparent" style={styles.libInfo}>
                            <Text style={styles.libTitle}>{item.title}</Text>
                            <Text style={[styles.libSub, { color: colors.textSecondary }]}>
                                By: {item.profiles?.email} | Category: {item.category || 'None'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.tint }]}
                            onPress={() => handlePublish(item)}
                        >
                            <Text style={styles.actionButtonText}>Publish</Text>
                        </TouchableOpacity>
                    </Card>
                ))}
                {publicLibs.length === 0 && <Text style={styles.emptyText}>No candidates available.</Text>}
            </View>

            <View variant="transparent" style={styles.section}>
                <View variant="transparent" style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Published Shared Libraries</Text>
                    <TouchableOpacity onPress={loadData}>
                        <FontAwesome name="refresh" size={16} color={colors.tint} />
                    </TouchableOpacity>
                </View>
                {sharedLibs.map((item) => (
                    <Card key={item.id} style={styles.libCard}>
                        <View variant="transparent" style={styles.libInfo}>
                            <Text style={styles.libTitle}>{item.title}</Text>
                            <Text style={[styles.libSub, { color: colors.textSecondary }]}>
                                Downloads: {item.download_count} | {item.category}
                            </Text>
                        </View>
                        <View variant="transparent" style={styles.actionGroup}>
                            <TouchableOpacity
                                style={[styles.miniButton, { backgroundColor: colors.tint }]}
                                onPress={() => handleEditOpen(item)}
                            >
                                <FontAwesome name="edit" size={14} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.miniButton, { backgroundColor: colors.error }]}
                                onPress={() => handleDeleteShared(item)}
                            >
                                <FontAwesome name="trash" size={14} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </Card>
                ))}
                {sharedLibs.length === 0 && (
                    <View variant="transparent" style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No shared libraries yet.</Text>
                        <Text style={styles.helpText}>Make a user library "Public" first to see it in candidates above.</Text>
                    </View>
                )}
            </View>

            {/* Edit Modal */}
            <Modal visible={!!editingLib} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                        <Text style={styles.modalTitle}>Edit Shared Library</Text>

                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            value={editForm.title}
                            onChangeText={(text) => setEditForm(prev => ({ ...prev, title: text }))}
                        />

                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border, height: 80 }]}
                            value={editForm.description}
                            onChangeText={(text) => setEditForm(prev => ({ ...prev, description: text }))}
                            multiline
                        />

                        <Text style={styles.label}>Category</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            value={editForm.category}
                            onChangeText={(text) => setEditForm(prev => ({ ...prev, category: text }))}
                        />

                        <View variant="transparent" style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.border }]} onPress={() => setEditingLib(null)}>
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.tint }]} onPress={handleUpdate}>
                                <Text style={styles.modalButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
    },
    testButtonText: {
        fontWeight: 'bold',
        fontSize: 13,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 16,
        textTransform: 'uppercase',
    },
    libCard: {
        padding: 18,
        borderRadius: 20,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    libInfo: {
        flex: 1,
        marginRight: 10,
    },
    libTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    libSub: {
        fontSize: 12,
        marginTop: 4,
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
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontStyle: 'italic',
    },
    helpText: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 8,
        textAlign: 'center',
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
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 30,
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
