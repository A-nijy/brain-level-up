import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';

import { useSectionDetail } from '@/hooks/useSectionDetail';

export default function ImportItemsScreen() {
    const { id, sectionId } = useLocalSearchParams();
    const libraryId = Array.isArray(id) ? id[0] : id;
    const sid = Array.isArray(sectionId) ? sectionId[0] : sectionId;

    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);

    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { createItems } = useSectionDetail(sid);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'text/csv',
                    'text/comma-separated-values',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel',
                    'application/csv',
                    'public.comma-separated-values-text', // iOS UTI
                ],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];
            setFileName(file.name);
            setLoading(true);

            try {
                const isCSV = file.name.toLowerCase().endsWith('.csv');
                let json: any[] = [];

                if (isCSV) {
                    const data = await FileSystem.readAsStringAsync(file.uri, {
                        encoding: 'utf8',
                    });
                    const workbook = XLSX.read(data, { type: 'string' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    json = XLSX.utils.sheet_to_json(sheet);
                } else {
                    const base64 = await FileSystem.readAsStringAsync(file.uri, {
                        encoding: 'base64',
                    });
                    const workbook = XLSX.read(base64, { type: 'base64' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    json = XLSX.utils.sheet_to_json(sheet);
                }

                if (json.length === 0) {
                    Alert.alert('알림', '파일에 데이터가 없거나 형식이 올바르지 않습니다.');
                }
                setParsedData(json);
            } catch (error) {
                console.error('File parsing error:', error);
                Alert.alert('오류', '파일을 분석하는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
            } finally {
                setLoading(false);
            }

        } catch (error) {
            console.error('Document picking error:', error);
            Alert.alert('오류', '파일을 선택하는 중 오류가 발생했습니다.');
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (parsedData.length === 0) {
            Alert.alert('알림', '가져올 데이터가 없습니다.');
            return;
        }

        if (!libraryId || !sid) {
            Alert.alert('오류', '잘못된 접근입니다.');
            return;
        }

        setLoading(true);
        try {
            const itemsToInsert = parsedData.map((row: any) => {
                const keys = Object.keys(row);
                const qKey = keys.find(k => k.toLowerCase().includes('question') || k.toLowerCase().includes('문제') || k.toLowerCase().includes('단어'));
                const aKey = keys.find(k => k.toLowerCase().includes('answer') || k.toLowerCase().includes('정답') || k.toLowerCase().includes('뜻'));
                const mKey = keys.find(k => k.toLowerCase().includes('memo') || k.toLowerCase().includes('메모'));

                if (!qKey || !aKey) return null;

                return {
                    library_id: libraryId,
                    section_id: sid,
                    question: row[qKey],
                    answer: row[aKey],
                    memo: mKey ? row[mKey] : null,
                };
            }).filter(item => item !== null) as any[];

            if (itemsToInsert.length === 0) {
                throw new Error('유효한 데이터 컬럼(문제/정답)을 찾지 못했습니다.');
            }

            await createItems(itemsToInsert);

            Alert.alert('성공', `${itemsToInsert.length}개의 항목을 가져왔습니다.`, [
                { text: '확인', onPress: () => router.back() }
            ]);

        } catch (error: any) {
            Alert.alert('가져오기 실패', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: '데이터 가져오기',
                    headerTintColor: colors.text,
                }}
            />

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
                <Card style={styles.guideCard}>
                    <View style={[styles.guideHeader, { borderBottomColor: colors.border }]}>
                        <FontAwesome name="info-circle" size={18} color={colors.tint} />
                        <Text style={[styles.guideTitle, { color: colors.text }]}>사용 가이드</Text>
                    </View>
                    <View style={styles.guideBody}>
                        <Text style={[styles.guideText, { color: colors.textSecondary }]}>1. 엑셀(xlsx) 또는 CSV 파일을 준비하세요.</Text>
                        <Text style={[styles.guideText, { color: colors.textSecondary }]}>2. 헤더에 '문제', '정답' 컬럼이 포함되어야 합니다.</Text>
                        <Text style={[styles.guideText, { color: colors.textSecondary }]}>3. 아래 버튼을 눌러 파일을 선택하세요.</Text>
                    </View>
                </Card>

                <TouchableOpacity
                    style={[styles.uploadButton, { borderColor: fileName ? colors.tint : colors.border, backgroundColor: colors.cardBackground }]}
                    onPress={pickDocument}
                    activeOpacity={0.7}
                >
                    <LinearGradient
                        colors={fileName ? [colors.tint + '15', colors.tint + '05'] : ['transparent', 'transparent']}
                        style={StyleSheet.absoluteFill}
                    />
                    <FontAwesome
                        name={fileName ? "file-excel-o" : "cloud-upload"}
                        size={48}
                        color={fileName ? colors.tint : colors.border}
                    />
                    <Text style={[styles.uploadText, { color: fileName ? colors.text : colors.textSecondary }]}>
                        {fileName ? fileName : '파일 선택하기'}
                    </Text>
                    {fileName && <Text style={[styles.changeText, { color: colors.tint }]}>파일 변경</Text>}
                </TouchableOpacity>

                {parsedData.length > 0 && (
                    <View style={styles.previewSection}>
                        <Text style={[styles.previewTitle, { color: colors.text }]}>미리보기 ({parsedData.length}개 항목)</Text>
                        <Card style={styles.previewCard}>
                            {parsedData.slice(0, 3).map((row, idx) => (
                                <View key={idx} style={[styles.previewItem, idx < 2 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                                    <Text style={[styles.previewRowText, { color: colors.textSecondary }]} numberOfLines={1}>
                                        {JSON.stringify(row)}
                                    </Text>
                                </View>
                            ))}
                            {parsedData.length > 3 && (
                                <View style={styles.moreItems}>
                                    <Text style={[styles.moreText, { color: colors.textSecondary }]}>외 {parsedData.length - 3}개의 항목...</Text>
                                </View>
                            )}
                        </Card>
                    </View>
                )}
            </ScrollView>

            <LinearGradient
                colors={['transparent', colors.background]}
                style={styles.footerGradient}
            >
                <TouchableOpacity
                    style={[styles.importButton, { backgroundColor: colors.tint }, (parsedData.length === 0 || loading) && styles.disabledButton]}
                    onPress={handleImport}
                    disabled={parsedData.length === 0 || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <FontAwesome name="download" size={18} color="#fff" style={{ marginRight: 10 }} />
                            <Text style={styles.importButtonText}>데이터 가져오기</Text>
                        </>
                    )}
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    guideCard: {
        marginBottom: 24,
        padding: 0,
        overflow: 'hidden',
    },
    guideHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    guideTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    guideBody: {
        padding: 16,
    },
    guideText: {
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 20,
    },
    uploadButton: {
        height: 180,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    uploadText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
        paddingHorizontal: 20,
        textAlign: 'center',
    },
    changeText: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: 'bold',
    },
    previewSection: {
        marginTop: 32,
    },
    previewTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 12,
        marginLeft: 4,
    },
    previewCard: {
        padding: 0,
        overflow: 'hidden',
    },
    previewItem: {
        padding: 16,
    },
    previewRowText: {
        fontSize: 13,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    moreItems: {
        padding: 12,
        alignItems: 'center',
    },
    moreText: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    footerGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingTop: 40,
    },
    importButton: {
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    disabledButton: {
        opacity: 0.5,
    },
    importButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
