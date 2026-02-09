import React, { useState } from 'react';
import { StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';

interface ExportModalProps {
    isVisible: boolean;
    onClose: () => void;
    onExport: (options: ExportOptions) => void;
    hasWrongItems: boolean;
}

export interface ExportOptions {
    range: 'all' | 'wrong';
    mode: 'both' | 'word_only' | 'meaning_only';
    order: 'sequential' | 'random';
    action: 'download' | 'share';
}

export function ExportModal({ isVisible, onClose, onExport, hasWrongItems }: ExportModalProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [range, setRange] = useState<'all' | 'wrong'>('all');
    const [mode, setMode] = useState<'both' | 'word_only' | 'meaning_only'>('both');
    const [order, setOrder] = useState<'sequential' | 'random'>('sequential');
    const [action, setAction] = useState<'download' | 'share'>('download');

    const handleExport = () => {
        onExport({ range, mode, order, action });
        onClose();
    };

    const OptionButton = ({ label, active, onPress, icon }: { label: string, active: boolean, onPress: () => void, icon?: string }) => (
        <TouchableOpacity
            style={[
                styles.optionButton,
                { borderColor: active ? colors.tint : colors.border },
                active && { backgroundColor: colors.tint + '10' }
            ]}
            onPress={onPress}
        >
            {icon && <FontAwesome name={icon as any} size={16} color={active ? colors.tint : colors.textSecondary} style={{ marginRight: 8 }} />}
            <Text style={[styles.optionText, { color: active ? colors.tint : colors.text }]}>{label}</Text>
            {active && <FontAwesome name="check-circle" size={16} color={colors.tint} />}
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View variant="transparent" style={styles.overlay}>
                <View variant="card" style={styles.content}>
                    <View variant="transparent" style={styles.header}>
                        <Text style={styles.title}>PDF 출력 설정</Text>
                        <TouchableOpacity onPress={onClose}>
                            <FontAwesome name="times" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                        <Text style={styles.sectionTitle}>출력 범위</Text>
                        <View variant="transparent" style={styles.row}>
                            <OptionButton label="전체 단어" active={range === 'all'} onPress={() => setRange('all')} />
                            {hasWrongItems && (
                                <OptionButton label="오답만" active={range === 'wrong'} onPress={() => setRange('wrong')} />
                            )}
                        </View>

                        <Text style={styles.sectionTitle}>출력 모드</Text>
                        <View variant="transparent" style={styles.column}>
                            <OptionButton label="단어 + 뜻" active={mode === 'both'} onPress={() => setMode('both')} icon="book" />
                            <OptionButton label="단어만 (시험용)" active={mode === 'word_only'} onPress={() => setMode('word_only')} icon="pencil" />
                            <OptionButton label="뜻만 (시험용)" active={mode === 'meaning_only'} onPress={() => setMode('meaning_only')} icon="list" />
                        </View>

                        <Text style={styles.sectionTitle}>정렬 순서</Text>
                        <View variant="transparent" style={styles.row}>
                            <OptionButton label="순차적" active={order === 'sequential'} onPress={() => setOrder('sequential')} />
                            <OptionButton label="무작위 (랜덤)" active={order === 'random'} onPress={() => setOrder('random')} />
                        </View>

                        {Platform.OS !== 'web' && (
                            <>
                                <Text style={styles.sectionTitle}>작업 선택</Text>
                                <View variant="transparent" style={styles.row}>
                                    <OptionButton label="기기에 저장" active={action === 'download'} onPress={() => setAction('download')} icon="download" />
                                    <OptionButton label="공유하기" active={action === 'share'} onPress={() => setAction('share')} icon="share-alt" />
                                </View>
                                {Platform.OS === 'ios' && action === 'share' && (
                                    <Text style={styles.note}>* iOS '공유하기' 내에 '파일에 저장' 옵션이 포함되어 있습니다.</Text>
                                )}
                            </>
                        )}
                    </ScrollView>

                    <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                        <LinearGradient
                            colors={[colors.tint, colors.primaryGradient[1]]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.gradient}
                        >
                            <FontAwesome name="file-pdf-o" size={18} color="#fff" style={{ marginRight: 10 }} />
                            <Text style={styles.exportButtonText}>PDF 생성 및 다운로드</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    content: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 44 : 24,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    scroll: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        opacity: 0.6,
        marginBottom: 12,
        marginTop: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
    },
    column: {
        gap: 10,
    },
    optionButton: {
        flex: 1,
        minWidth: '45%',
        height: 50,
        borderRadius: 12,
        borderWidth: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        justifyContent: 'space-between',
    },
    optionText: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
    exportButton: {
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
    },
    gradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    exportButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    note: {
        fontSize: 12,
        color: '#666',
        marginTop: 8,
        fontStyle: 'italic',
        paddingHorizontal: 4,
    },
});
