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
            Alert.alert('오류', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = (lib: any) => {
        Alert.alert(
            '공유 마켓 게시',
            `"${lib.title}" 단어장을 공유 목록에 게시하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '게시하기',
                    onPress: async () => {
                        try {
                            await AdminService.publishToShared(lib.id);
                            Alert.alert('성공', '단어장이 성공적으로 게시되었습니다!');
                            loadData();
                        } catch (error: any) {
                            Alert.alert('오류', error.message);
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
            Alert.alert('성공', '단어장 정보가 수정되었습니다!');
            setEditingLib(null);
            loadData();
        } catch (error: any) {
            Alert.alert('오류', error.message);
        }
    };

    const handleDeleteShared = (lib: SharedLibrary) => {
        Alert.alert(
            '공유 단어장 삭제',
            `"${lib.title}" 단어장을 공유 마켓에서 삭제하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AdminService.deleteSharedLibrary(lib.id);
                            loadData();
                        } catch (error: any) {
                            Alert.alert('오류', error.message);
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
            if (!user.user) throw new Error('관리자 정보를 찾을 수 없습니다.');

            const { data: lib, error: libErr } = await supabase
                .from('libraries')
                .insert({
                    title: '[TEST] 프리미엄 콘텐츠',
                    description: '보상형 광고 흐름 테스트를 위한 라이브러리입니다.',
                    category: '테스트',
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

            Alert.alert('성공', '테스트용 공유 단어장이 생성되었습니다! "공유" 탭에서 확인해보세요.');
            loadData();
        } catch (error: any) {
            Alert.alert('오류', error.message);
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
                    <Text style={styles.title}>공유 마켓 관리자</Text>
                    <Text style={[styles.subText, { color: colors.textSecondary }]}>콘텐츠 큐레이션 및 품질 관리</Text>
                </View>
                <TouchableOpacity style={[styles.testButton, { backgroundColor: colors.tint + '15' }]} onPress={createTestSharedLibrary}>
                    <FontAwesome name="flask" size={16} color={colors.tint} style={{ marginRight: 8 }} />
                    <Text style={[styles.testButtonText, { color: colors.tint }]}>테스트 생성</Text>
                </TouchableOpacity>
            </View>

            <View variant="transparent" style={styles.section}>
                <View variant="transparent" style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>공개 단어장 (게시 후보)</Text>
                    <TouchableOpacity onPress={loadData}>
                        <FontAwesome name="refresh" size={16} color={colors.tint} />
                    </TouchableOpacity>
                </View>
                {publicLibs.map((item) => (
                    <Card key={item.id} style={styles.libCard}>
                        <View variant="transparent" style={styles.libInfo}>
                            <Text style={styles.libTitle}>{item.title}</Text>
                            <Text style={[styles.libSub, { color: colors.textSecondary }]}>
                                작성자: {item.profiles?.email} | 카테고리: {item.category || '없음'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.tint }]}
                            onPress={() => handlePublish(item)}
                        >
                            <Text style={styles.actionButtonText}>게시하기</Text>
                        </TouchableOpacity>
                    </Card>
                ))}
                {publicLibs.length === 0 && <Text style={styles.emptyText}>게시 후보가 없습니다.</Text>}
            </View>

            <View variant="transparent" style={styles.section}>
                <View variant="transparent" style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>게시 완료된 공유 단어장</Text>
                    <TouchableOpacity onPress={loadData}>
                        <FontAwesome name="refresh" size={16} color={colors.tint} />
                    </TouchableOpacity>
                </View>
                {sharedLibs.map((item) => (
                    <Card key={item.id} style={styles.libCard}>
                        <View variant="transparent" style={styles.libInfo}>
                            <Text style={styles.libTitle}>{item.title}</Text>
                            <Text style={[styles.libSub, { color: colors.textSecondary }]}>
                                다운로드: {item.download_count} | {item.category}
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
                        <Text style={styles.emptyText}>공유된 단어장이 없습니다.</Text>
                        <Text style={styles.helpText}>사용자 단어장을 먼저 '공개'로 설정하면 후보 목록에 나타납니다.</Text>
                    </View>
                )}
            </View>

            {/* Edit Modal */}
            <Modal visible={!!editingLib} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                        <Text style={styles.modalTitle}>공유 단어장 수정</Text>

                        <Text style={styles.label}>제목</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            value={editForm.title}
                            onChangeText={(text) => setEditForm(prev => ({ ...prev, title: text }))}
                        />

                        <Text style={styles.label}>설명</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border, height: 80 }]}
                            value={editForm.description}
                            onChangeText={(text) => setEditForm(prev => ({ ...prev, description: text }))}
                            multiline
                        />

                        <Text style={styles.label}>카테고리</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            value={editForm.category}
                            onChangeText={(text) => setEditForm(prev => ({ ...prev, category: text }))}
                        />

                        <View variant="transparent" style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.border }]} onPress={() => setEditingLib(null)}>
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.tint }]} onPress={handleUpdate}>
                                <Text style={styles.modalButtonText}>저장하기</Text>
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
