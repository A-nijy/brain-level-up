import React, { useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/contexts/AuthContext';
import { useSharedLibraries } from '@/hooks/useSharedLibraries';
import { LibraryService } from '@/services/LibraryService';
import { SharedLibraryService } from '@/services/SharedLibraryService';
import { Library, SharedLibrary, SharedLibraryCategory } from '@/types';
import { Modal, TouchableWithoutFeedback, TextInput, ScrollView as RNScrollView } from 'react-native';
import { useAlert } from '@/contexts/AlertContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MembershipService } from '@/services/MembershipService';
import { AdService } from '@/services/AdService';
import { FeatureGatingModal } from '@/components/FeatureGatingModal';
import { useHeaderActions } from '@/contexts/HeaderContext';

import { Strings } from '@/constants/Strings';

export default function SharedLibraryScreen() {
    const { user, profile } = useAuth();
    const {
        libraries,
        categories,
        loading,
        refreshing,
        refresh,
        downloadLibrary,
        selectedCategoryId,
        setSelectedCategoryId,
        isOfficial,
        setIsOfficial
    } = useSharedLibraries();

    // ... (intermediate code omitted if needed, but replace_file_content requires TargetContent)
    // Actually I'll replace the whole header section including tabs

    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { width } = useWindowDimensions();
    const { showAlert } = useAlert();

    // 웹 헤더 액션 등록 (유저 자료실일 때만 공유 버튼 노출)
    useHeaderActions(!isOfficial ? [
        {
            id: 'share-material',
            icon: 'share-alt',
            onPress: () => openShareModal(),
            label: Strings.userShareModal.title
        }
    ] : [], [isOfficial]);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLib, setSelectedLib] = useState<SharedLibrary | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);

    // Share Material Modal State
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [shareStep, setShareStep] = useState(1);
    const [myLibraries, setMyLibraries] = useState<Library[]>([]);
    const [loadingMyLibs, setLoadingMyLibs] = useState(false);
    const [selectedMyLibId, setSelectedMyLibId] = useState<string>('');
    const [shareCategoryId, setShareCategoryId] = useState<string>('');
    const [hashtagText, setHashtagText] = useState('');
    const [sharing, setSharing] = useState(false);
    const [allCategories, setAllCategories] = useState<SharedLibraryCategory[]>([]);
    const [isLibPickerOpen, setIsLibPickerOpen] = useState(false);
    const [isCatPickerOpen, setIsCatPickerOpen] = useState(false);

    // Edit Mode State
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingSharedLibId, setEditingSharedLibId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [editingDesc, setEditingDesc] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const openShareModal = async (editItem?: SharedLibrary) => {
        if (!user) {
            showAlert({ title: Strings.common.loginRequired, message: Strings.sharedDetail.alerts.loginRequired });
            return;
        }

        if (editItem) {
            setIsEditMode(true);
            setEditingSharedLibId(editItem.id);
            setSelectedMyLibId('dummy');
            setShareCategoryId(editItem.category_id || '');
            setHashtagText(editItem.tags?.join(', ') || '');
            setShareStep(2);
        } else {
            setIsEditMode(false);
            setEditingSharedLibId(null);
            setSelectedMyLibId('');
            setShareCategoryId('');
            setHashtagText('');
            setShareStep(1);
        }

        setShareModalVisible(true);
        setLoadingMyLibs(true);
        try {
            const [libs, cats] = await Promise.all([
                LibraryService.getLibraries(user.id),
                SharedLibraryService.getAllSharedCategories()
            ]);
            setMyLibraries(libs);
            setAllCategories(cats);
            setIsLibPickerOpen(false);
            setIsCatPickerOpen(false);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMyLibs(false);
        }
    };

    const handleShareSubmit = async () => {
        if (!user || (!isEditMode && !selectedMyLibId) || !shareCategoryId) return;

        setSharing(true);
        try {
            const tags = hashtagText.split(',').map(t => t.trim()).filter(t => t.length > 0).slice(0, 5);

            if (isEditMode && editingSharedLibId) {
                await SharedLibraryService.updateSharedLibrary(editingSharedLibId, {
                    category_id: shareCategoryId,
                    tags: tags
                });
                showAlert({ title: Strings.common.success, message: Strings.shared.alerts.updateSuccess });
            } else {
                await SharedLibraryService.shareLibrary(user.id, selectedMyLibId, shareCategoryId, tags);
                showAlert({ title: Strings.common.success, message: Strings.userShareModal.alerts.uploadSuccess });
            }

            setShareModalVisible(false);
            refresh();
        } catch (error: any) {
            showAlert({ title: Strings.common.error, message: `${isEditMode ? '수정 실패' : Strings.userShareModal.alerts.uploadFail}: ${error.message}` });
        } finally {
            setSharing(false);
        }
    };

    const handleDeleteShared = async (sharedLibId: string) => {
        showAlert({
            title: Strings.common.deleteConfirmTitle,
            message: Strings.shared.alerts.deleteConfirm,
            buttons: [
                { text: Strings.common.cancel, style: 'cancel' },
                {
                    text: Strings.common.delete,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await SharedLibraryService.deleteSharedLibrary(sharedLibId);
                            showAlert({ title: Strings.common.success, message: Strings.shared.alerts.deleteSuccess });
                            refresh();
                        } catch (e: any) {
                            showAlert({ title: Strings.common.error, message: e.message });
                        }
                    }
                }
            ]
        });
    };

    const handleReportShared = async (sharedLibId: string) => {
        if (!user) {
            showAlert({ title: Strings.common.loginRequired, message: Strings.sharedDetail.alerts.loginRequired });
            return;
        }

        showAlert({
            title: Strings.shared.report,
            message: Strings.shared.alerts.reportConfirm,
            buttons: [
                { text: Strings.common.cancel, style: 'cancel' },
                {
                    text: Strings.shared.report,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const isReported = await SharedLibraryService.reportSharedLibrary(user.id, sharedLibId);
                            const msg = isReported ? Strings.shared.alerts.reportSuccess : Strings.shared.alerts.reportCancelSuccess;
                            showAlert({ title: Strings.common.success, message: msg });
                            refresh();
                        } catch (e: any) {
                            showAlert({ title: Strings.common.error, message: Strings.shared.alerts.reportFail });
                        }
                    }
                }
            ]
        });
    };

    const isWeb = Platform.OS === 'web';
    const numColumns = isWeb && width > 768 ? 2 : 1;
    const listKey = `shared-${numColumns}`;

    const filteredLibraries = libraries.filter(lib =>
        lib.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDownloadRequest = (item: SharedLibrary) => {
        if (!user) {
            showAlert({ title: Strings.common.loginRequired, message: Strings.sharedDetail.alerts.loginRequired });
            return;
        }

        const access = MembershipService.checkAccess('DOWNLOAD_SHARED', profile);

        if (access.status === 'REQUIRE_AD') {
            setSelectedLib(item);
            setModalVisible(true);
        } else {
            performDownload(item);
        }
    };

    const performDownload = async (item: SharedLibrary) => {
        if (!user || !item) return;

        setDownloading(item.id);
        try {
            const newLib = await downloadLibrary(user.id, item);

            showAlert({
                title: Strings.common.success,
                message: Strings.shared.alerts.downloadSuccess,
                buttons: [
                    { text: Strings.shared.alerts.goLibrary, onPress: () => router.push(`/library/${newLib.id}`) },
                    { text: Strings.common.confirm }
                ]
            });
            refresh();
        } catch (e: any) {
            showAlert({ title: Strings.shared.alerts.downloadFail, message: e.message });
        } finally {
            setDownloading(null);
            setModalVisible(false);
        }
    };

    const handleWatchAd = () => {
        AdService.showRewardedAd(() => {
            if (selectedLib) performDownload(selectedLib);
        }, showAlert);
    };

    const renderItem = ({ item, index }: { item: SharedLibrary; index: number }) => {
        const isOwner = user && item.created_by === user.id;

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 50).springify()}
                style={[
                    styles.cardContainer,
                    numColumns > 1 && { width: '48%', marginHorizontal: '1%' }
                ]}
            >
                <Card
                    style={styles.card}
                    onPress={() => router.push({
                        pathname: '/shared/[id]',
                        params: { id: item.id, title: item.title }
                    })}
                >
                    <View variant="transparent" style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                            <FontAwesome name={Strings.tabs.icons.shared as any} size={20} color={colors.tint} />
                        </View>
                        <View variant="transparent" style={styles.titleContainer}>
                            <Text type="title" style={styles.cardTitle}>{item.title}</Text>
                            {item.category && (
                                <Text style={[styles.categoryText, { color: colors.tint }]}>{item.category}</Text>
                            )}
                        </View>
                        <FontAwesome name={Strings.home.icons.arrowRight as any} size={18} color={colors.border} />
                    </View>


                    <View variant="transparent" style={styles.cardFooter}>
                        <View variant="transparent" style={styles.footerLeft}>
                            <View variant="transparent" style={styles.statItem}>
                                <FontAwesome name={Strings.admin.icons.download as any} size={12} color={colors.textSecondary} style={{ marginRight: 6 }} />
                                <Text style={styles.statText}>{Strings.shared.downloadCount(item.download_count)}</Text>
                            </View>

                            {isOwner ? (
                                <View variant="transparent" style={styles.managementButtons}>
                                    <TouchableOpacity
                                        style={styles.manageBtn}
                                        onPress={() => openShareModal(item)}
                                    >
                                        <FontAwesome name={Strings.common.icons.edit as any} size={14} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.manageBtn}
                                        onPress={() => handleDeleteShared(item.id)}
                                    >
                                        <FontAwesome name={Strings.common.icons.delete as any} size={14} color={colors.error} />
                                    </TouchableOpacity>
                                </View>
                            ) : !item.is_official && (
                                <View variant="transparent" style={styles.managementButtons}>
                                    <TouchableOpacity
                                        style={styles.manageBtn}
                                        onPress={() => handleReportShared(item.id)}
                                    >
                                        <FontAwesome name="flag-o" size={14} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.downloadButton, { backgroundColor: colors.tint + '10', borderColor: colors.tint + '20' }]}
                            onPress={() => handleDownloadRequest(item)}
                            disabled={downloading === item.id}
                        >
                            {downloading === item.id ? (
                                <ActivityIndicator size="small" color={colors.tint} />
                            ) : (
                                <>
                                    <FontAwesome name={Strings.common.icons.add as any} size={12} color={colors.tint} style={{ marginRight: 6 }} />
                                    <Text style={[styles.downloadButtonText, { color: colors.tint }]}>{Strings.shared.import}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </Card>
            </Animated.View>
        );
    };


    return (
        <View style={[styles.container, { backgroundColor: colors.background }]} >
            <FlatList
                key={listKey}
                data={filteredLibraries}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={numColumns}
                contentContainerStyle={[
                    styles.listContent,
                    isWeb && width > 1200 && { maxWidth: 1200, alignSelf: 'center', width: '100%' }
                ]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.tint} />
                }
                ListHeaderComponent={
                    <View variant="transparent" style={[styles.header, { marginBottom: 12 }]}>
                        <View variant="transparent" style={styles.headerInfoSection}>
                            {/* Shared Title/Subtitle info removed */}
                            <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginTop: 4, maxWidth: isWeb ? 400 : undefined }]}>
                                <FontAwesome name="search" size={14} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.searchInput, { color: colors.text }]}
                                    placeholder={Strings.shared.searchPlaceholder}
                                    placeholderTextColor={colors.textSecondary}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <FontAwesome name="times-circle" size={14} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Official / User Tabs */}
                        <View variant="transparent" style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, isOfficial && { backgroundColor: colors.tint }]}
                                onPress={() => {
                                    setIsOfficial(true);
                                    setSelectedCategoryId('all');
                                }}
                            >
                                <Text style={[styles.tabText, isOfficial && { color: '#fff' }]}>{Strings.shared.tabs.official}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, !isOfficial && { backgroundColor: colors.tint }]}
                                onPress={() => {
                                    setIsOfficial(false);
                                    setSelectedCategoryId('all');
                                }}
                            >
                                <Text style={[styles.tabText, !isOfficial && { color: '#fff' }]}>{Strings.shared.tabs.user}</Text>
                            </TouchableOpacity>
                        </View>

                        <Animated.ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.categoryScroll}
                            contentContainerStyle={styles.categoryContainer}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.chip,
                                    selectedCategoryId === 'all' && { backgroundColor: colors.tint, borderColor: colors.tint }
                                ]}
                                onPress={() => setSelectedCategoryId('all')}
                            >
                                <Text style={[styles.chipText, selectedCategoryId === 'all' && { color: '#fff' }]}>{Strings.shared.categoryAll}</Text>
                            </TouchableOpacity>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.chip,
                                        selectedCategoryId === cat.id && { backgroundColor: colors.tint, borderColor: colors.tint }
                                    ]}
                                    onPress={() => setSelectedCategoryId(cat.id)}
                                >
                                    <Text style={[styles.chipText, selectedCategoryId === cat.id && { color: '#fff' }]}>{cat.title}</Text>
                                </TouchableOpacity>
                            ))}
                        </Animated.ScrollView>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        {loading ? <ActivityIndicator size="large" color={colors.tint} /> :
                            searchQuery.length > 0 ? (
                                <>
                                    <FontAwesome name="search" size={40} color={colors.textSecondary} style={{ opacity: 0.2, marginBottom: 16 }} />
                                    <Text style={[styles.emptyText, { marginBottom: 8 }]}>검색 결과가 없습니다</Text>
                                    <Text style={[styles.emptyText, { fontSize: 14, marginTop: 0 }]}>'{searchQuery}'와 일치하는 자료를 찾을 수 없습니다.</Text>
                                    <TouchableOpacity
                                        style={[styles.downloadButton, { marginTop: 20, backgroundColor: colors.border }]}
                                        onPress={() => setSearchQuery('')}
                                    >
                                        <Text style={[styles.downloadButtonText, { color: colors.text }]}>검색 초기화</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <FontAwesome name={Strings.adminUsers.icons.search as any} size={40} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                                    <Text style={styles.emptyText}>{Strings.shared.empty}</Text>
                                </>
                            )}
                    </View>
                }
            />

            <FeatureGatingModal
                isVisible={modalVisible}
                onClose={() => setModalVisible(false)}
                onWatchAd={handleWatchAd}
                title={Strings.shared.adModal.title}
                description={Strings.shared.adModal.description}
            />

            {/* Share Material Modal */}
            <Modal
                visible={shareModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setShareModalVisible(false)
                }
            >
                <TouchableWithoutFeedback onPress={() => setShareModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <Card style={styles.shareModalContent}>
                                <View variant="transparent" style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>
                                        {isEditMode ? Strings.shared.edit.title : Strings.userShareModal.title}
                                    </Text>
                                    <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                                        <FontAwesome name="close" size={20} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                {shareStep === 1 && (
                                    <View variant="transparent" style={styles.stepContent}>
                                        <Text style={styles.stepTitle}>{Strings.userShareModal.step1.title}</Text>
                                        <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>{Strings.userShareModal.step1.label}</Text>
                                        {loadingMyLibs ? (
                                            <ActivityIndicator size="small" color={colors.tint} style={{ marginVertical: 20 }} />
                                        ) : myLibraries.length === 0 ? (
                                            <Text style={styles.emptyText}>{Strings.userShareModal.step1.empty}</Text>
                                        ) : (
                                            <View variant="transparent" style={styles.pickerContainer}>
                                                <TouchableOpacity
                                                    style={[styles.pickerTrigger, { borderColor: colors.border }]}
                                                    onPress={() => setIsLibPickerOpen(!isLibPickerOpen)}
                                                >
                                                    <Text style={[styles.pickerTriggerText, !selectedMyLibId && { color: colors.textSecondary }]}>
                                                        {myLibraries.find(l => l.id === selectedMyLibId)?.title || Strings.userShareModal.step1.label}
                                                    </Text>
                                                    <FontAwesome name={isLibPickerOpen ? "chevron-up" : "chevron-down"} size={14} color={colors.textSecondary} />
                                                </TouchableOpacity>

                                                {isLibPickerOpen && (
                                                    <View variant="transparent" style={[styles.pickerDropdown, { borderColor: colors.border }]}>
                                                        <RNScrollView style={styles.pickerScroll} nestedScrollEnabled>
                                                            {myLibraries.map(lib => (
                                                                <TouchableOpacity
                                                                    key={lib.id}
                                                                    style={[styles.pickerItem, selectedMyLibId === lib.id && { backgroundColor: colors.tint + '10' }]}
                                                                    onPress={() => {
                                                                        setSelectedMyLibId(lib.id);
                                                                        setIsLibPickerOpen(false);
                                                                    }}
                                                                >
                                                                    <Text style={[styles.pickerItemText, selectedMyLibId === lib.id && { color: colors.tint, fontWeight: '700' }]}>{lib.title}</Text>
                                                                    {selectedMyLibId === lib.id && <FontAwesome name="check" size={14} color={colors.tint} />}
                                                                </TouchableOpacity>
                                                            ))}
                                                        </RNScrollView>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                )}

                                {shareStep === 2 && (
                                    <View variant="transparent" style={styles.stepContent}>
                                        <Text style={styles.stepTitle}>{Strings.userShareModal.step2.title}</Text>
                                        <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>{Strings.userShareModal.step2.label}</Text>
                                        <View variant="transparent" style={styles.pickerContainer}>
                                            <TouchableOpacity
                                                style={[styles.pickerTrigger, { borderColor: colors.border }]}
                                                onPress={() => setIsCatPickerOpen(!isCatPickerOpen)}
                                            >
                                                <Text style={[styles.pickerTriggerText, !shareCategoryId && { color: colors.textSecondary }]}>
                                                    {allCategories.find(c => c.id === shareCategoryId)?.title || Strings.userShareModal.step2.label}
                                                </Text>
                                                <FontAwesome name={isCatPickerOpen ? "chevron-up" : "chevron-down"} size={14} color={colors.textSecondary} />
                                            </TouchableOpacity>

                                            {isCatPickerOpen && (
                                                <View variant="transparent" style={[styles.pickerDropdown, { borderColor: colors.border }]}>
                                                    <RNScrollView style={styles.pickerScroll} nestedScrollEnabled>
                                                        {allCategories.map(cat => (
                                                            <TouchableOpacity
                                                                key={cat.id}
                                                                style={[styles.pickerItem, shareCategoryId === cat.id && { backgroundColor: colors.tint + '10' }]}
                                                                onPress={() => {
                                                                    setShareCategoryId(cat.id);
                                                                    setIsCatPickerOpen(false);
                                                                }}
                                                            >
                                                                <Text style={[styles.pickerItemText, shareCategoryId === cat.id && { color: colors.tint, fontWeight: '700' }]}>{cat.title}</Text>
                                                                {shareCategoryId === cat.id && <FontAwesome name="check" size={14} color={colors.tint} />}
                                                            </TouchableOpacity>
                                                        ))}
                                                    </RNScrollView>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                )}

                                {shareStep === 3 && (
                                    <View variant="transparent" style={styles.stepContent}>
                                        <Text style={styles.stepTitle}>{Strings.userShareModal.step3.title}</Text>
                                        <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>{Strings.userShareModal.step3.label}</Text>
                                        <TextInput
                                            style={[styles.tagInput, { borderColor: colors.border, color: colors.text }]}
                                            placeholder={Strings.userShareModal.step3.placeholder}
                                            placeholderTextColor={colors.textSecondary}
                                            value={hashtagText}
                                            onChangeText={setHashtagText}
                                            autoFocus
                                        />
                                        <Text style={[styles.tagHint, { color: colors.textSecondary }]}>{Strings.userShareModal.step3.hint}</Text>
                                    </View>
                                )}

                                <View variant="transparent" style={styles.modalFooter}>
                                    {(shareStep > 1 && !isEditMode) && (
                                        <TouchableOpacity
                                            style={[styles.modalBtn, { backgroundColor: colors.border }]}
                                            onPress={() => setShareStep(prev => prev - 1)}
                                            disabled={sharing}
                                        >
                                            <Text style={styles.modalBtnText}>{Strings.userShareModal.btnPrev}</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={[styles.modalBtn, { backgroundColor: colors.tint, flex: 1 }]}
                                        onPress={() => {
                                            if (shareStep === 1) {
                                                if (!selectedMyLibId) return showAlert({ title: Strings.common.info, message: Strings.userShareModal.alerts.selectLibrary });
                                                setShareStep(2);
                                            } else if (shareStep === 2) {
                                                if (!shareCategoryId) return showAlert({ title: Strings.common.info, message: Strings.userShareModal.alerts.selectCategory });
                                                setShareStep(3);
                                            } else {
                                                handleShareSubmit();
                                            }
                                        }}
                                        disabled={sharing}
                                    >
                                        {sharing ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.modalBtnText}>
                                                {isEditMode ? Strings.shared.edit.btnSubmit : (shareStep < 3 ? Strings.userShareModal.btnNext : Strings.userShareModal.btnShare)}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </Card>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal >
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        marginBottom: 24,
        paddingHorizontal: 4,
        marginTop: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '500',
        paddingVertical: 8,
    },
    headerTitle: {
        fontSize: Platform.OS === 'web' ? 32 : 28,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    cardContainer: {
        marginBottom: 16,
    },
    card: {
        borderWidth: 1.5,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    titleContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 2,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
        opacity: 0.8,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.03)',
        paddingTop: 12,
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    managementButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(0,0,0,0.05)',
        paddingLeft: 12,
    },
    manageBtn: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    downloadButtonText: {
        fontSize: 13,
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#94A3B8',
        marginTop: 16,
    },
    categoryScroll: {
        marginTop: 20,
        marginHorizontal: -20,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        padding: 4,
        borderRadius: 12,
        marginTop: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    categoryContainer: {
        paddingHorizontal: 20,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        backgroundColor: '#F8FAFC',
    },
    chipText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        width: '100%',
    },
    headerInfoSection: {
        marginBottom: 8,
    },
    shareActionWrapper: {
        flexShrink: 0,
    },
    shareActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    shareActionBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '800',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareModalContent: {
        width: '90%',
        maxHeight: '80%',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1.5,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    stepContent: {
        marginVertical: 16,
    },
    stepTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    stepLabel: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 16,
    },
    pickerContainer: {
        marginTop: 4,
    },
    pickerTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 54,
        backgroundColor: '#F8FAFC',
    },
    pickerTriggerText: {
        fontSize: 15,
        fontWeight: '600',
    },
    pickerDropdown: {
        marginTop: 8,
        borderWidth: 1.5,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#fff',
        maxHeight: 250,
        // Elevation for android, Shadow for iOS
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    pickerScroll: {
        maxHeight: 250,
    },
    pickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    pickerItemText: {
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
    },
    tagInput: {
        height: 50,
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        fontWeight: '500',
    },
    tagHint: {
        fontSize: 12,
        marginTop: 8,
        marginLeft: 4,
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 16,
    },
    modalBtn: {
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
});
