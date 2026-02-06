import React from 'react';
import { StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/contexts/AuthContext';
import { useSharedLibraries } from '@/hooks/useSharedLibraries';
import { SharedLibrary } from '@/types';

export default function SharedLibraryScreen() {
    const { session } = useAuth();
    const { libraries, loading, refreshing, refresh, downloadLibrary } = useSharedLibraries();
    const router = useRouter();

    const handleDownload = async (item: SharedLibrary) => {
        if (!session?.user) {
            Alert.alert('로그인 필요', '자료를 다운로드하려면 로그인이 필요합니다.');
            return;
        }

        Alert.alert(
            '다운로드',
            `'${item.title}' 암기장을 내 보관함으로 가져오시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '가져오기',
                    onPress: async () => {
                        try {
                            const newLib = await downloadLibrary(session.user.id, item);

                            Alert.alert('성공', '내 암기장에 추가되었습니다.', [
                                { text: '바로가기', onPress: () => router.push(`/library/${newLib.id}`) },
                                { text: '확인' }
                            ]);
                            refresh(); // Refresh to update download count
                        } catch (e: any) {
                            Alert.alert('다운로드 실패', e.message);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: SharedLibrary }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <FontAwesome name="globe" size={24} color="#fff" />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.cardCategory}>{item.category || '기타'}</Text>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {item.description && (
                        <Text style={styles.cardDescription} numberOfLines={2}>
                            {item.description}
                        </Text>
                    )}
                    <View style={styles.cardFooter}>
                        <FontAwesome name="download" size={12} color="#999" style={{ marginRight: 4 }} />
                        <Text style={styles.statText}>{item.download_count}회 다운로드</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => handleDownload(item)}
                >
                    <FontAwesome name="download" size={16} color="#007AFF" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={libraries}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        {loading ? <ActivityIndicator size="large" /> : (
                            <>
                                <FontAwesome name="search" size={48} color="#ccc" />
                                <Text style={styles.emptyText}>공유된 자료가 없습니다.</Text>
                            </>
                        )}
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardCategory: {
        fontSize: 12,
        color: '#4A90E2',
        fontWeight: 'bold',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#333',
    },
    cardDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
        lineHeight: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        fontSize: 12,
        color: '#999',
    },
    downloadButton: {
        padding: 10,
        backgroundColor: '#F0F8FF',
        borderRadius: 50,
        marginLeft: 8,
        alignSelf: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 16,
        color: '#999',
        fontSize: 16,
    }
});
