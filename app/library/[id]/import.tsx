import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function ImportItemsScreen() {
    const { id } = useLocalSearchParams(); // library_id
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];
            setFileName(file.name);
            setLoading(true);

            // Read file content
            const response = await fetch(file.uri);
            const blob = await response.blob();
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(sheet);

                    setParsedData(json);
                } catch (error) {
                    Alert.alert('Error', '파일을 읽는 중 오류가 발생했습니다.');
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            };

            reader.readAsBinaryString(blob);

        } catch (error) {
            console.error(error);
            Alert.alert('Error', '파일 선택 중 오류가 발생했습니다.');
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (parsedData.length === 0) {
            Alert.alert('알림', '가져올 데이터가 없습니다.');
            return;
        }

        setLoading(true);
        try {
            // Data mapping: assume columns 'question', 'answer' exist.
            // If header is different, we might need mapping logic. 
            // For MVP, simplistic check.

            const itemsToInsert = parsedData.map((row: any) => {
                // Try to find question/answer columns case-insensitively
                const keys = Object.keys(row);
                const qKey = keys.find(k => k.toLowerCase().includes('question') || k.toLowerCase().includes('문제') || k.toLowerCase().includes('단어'));
                const aKey = keys.find(k => k.toLowerCase().includes('answer') || k.toLowerCase().includes('정답') || k.toLowerCase().includes('뜻'));
                const mKey = keys.find(k => k.toLowerCase().includes('memo') || k.toLowerCase().includes('메모'));

                if (!qKey || !aKey) return null;

                return {
                    library_id: id,
                    question: row[qKey],
                    answer: row[aKey],
                    memo: mKey ? row[mKey] : null,
                };
            }).filter(item => item !== null);

            if (itemsToInsert.length === 0) {
                throw new Error('유효한 데이터 컬럼(문제/정답)을 찾지 못했습니다.');
            }

            const { error } = await supabase.from('items').insert(itemsToInsert);

            if (error) throw error;

            Alert.alert('성공', `${itemsToInsert.length}개의 항목을 가져왔습니다.`, [
                { text: '확인', onPress: () => router.back() }
            ]);

        } catch (error: any) {
            Alert.alert('Import Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: '데이터 가져오기' }} />

            <View style={styles.content}>
                <View style={styles.guide}>
                    <Text style={styles.guideTitle}>사용 가이드</Text>
                    <Text style={styles.guideText}>1. 엑셀(xlsx) 또는 CSV 파일을 준비하세요.</Text>
                    <Text style={styles.guideText}>2. 첫 번째 줄(헤더)에 '문제(question)', '정답(answer)' 컬럼이 포함되어야 합니다.</Text>
                    <Text style={styles.guideText}>3. 아래 버튼을 눌러 파일을 선택하세요.</Text>
                </View>

                <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                    <FontAwesome name="cloud-upload" size={40} color="#666" />
                    <Text style={styles.uploadText}>
                        {fileName ? fileName : '파일 선택하기'}
                    </Text>
                </TouchableOpacity>

                {parsedData.length > 0 && (
                    <View style={styles.preview}>
                        <Text style={styles.previewTitle}>미리보기 ({parsedData.length}개 항목 확인됨)</Text>
                        <ScrollView style={styles.previewList}>
                            {parsedData.slice(0, 5).map((row, idx) => (
                                <Text key={idx} style={styles.previewItem}>
                                    {JSON.stringify(row).slice(0, 50)}...
                                </Text>
                            ))}
                            {parsedData.length > 5 && <Text>...</Text>}
                        </ScrollView>
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.importButton, (parsedData.length === 0 || loading) && styles.disabledButton]}
                    onPress={handleImport}
                    disabled={parsedData.length === 0 || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.importButtonText}>가져오기 시작</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 24,
        flex: 1,
    },
    guide: {
        marginBottom: 30,
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    guideTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    guideText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 4,
    },
    uploadButton: {
        height: 150,
        borderWidth: 2,
        borderColor: '#ddd',
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fdfdfd',
    },
    uploadText: {
        marginTop: 10,
        color: '#888',
        fontSize: 16,
    },
    preview: {
        marginTop: 30,
        flex: 1,
    },
    previewTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    previewList: {
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 8,
    },
    previewItem: {
        fontSize: 12,
        color: '#333',
        marginBottom: 4,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    importButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    importButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
