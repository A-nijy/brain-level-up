import { StyleSheet, Alert, TouchableOpacity, useWindowDimensions, ScrollView, Platform, Switch, Modal, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, TouchableWithoutFeedback } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { PushNotificationSettings } from '@/services/PushNotificationService';
import { Library, Section } from '@/types';

import { usePushSettings } from '@/hooks/usePushSettings';

export default function SettingsScreen() {
  const { signOut, profile } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { width } = useWindowDimensions();

  const {
    notificationSettings,
    libraries,
    sections,
    loadingSections,
    progress,
    fetchSections,
    saveSettings,
    resetProgress,
    requestPermissions,
    refresh: refreshSettings
  } = usePushSettings();

  // UI State for Modal
  const [tempSettings, setTempSettings] = useState<PushNotificationSettings | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showLibraryList, setShowLibraryList] = useState(false);
  const [showSectionList, setShowSectionList] = useState(false);

  useEffect(() => {
    if (tempSettings?.libraryId) {
      fetchSections(tempSettings.libraryId);
    }
  }, [tempSettings?.libraryId, fetchSections]);

  const handleToggleNotification = async (value: boolean) => {
    if (!notificationSettings) return;

    if (value) {
      let granted = false;
      if (Platform.OS === 'web') {
        const { WebPushService } = require('@/services/WebPushService');
        granted = await WebPushService.requestPermission();
      } else {
        granted = await requestPermissions();
      }

      if (!granted) {
        Alert.alert('권한 필요', '푸시 알림을 위해 알림 권한이 필요합니다. 브라우저나 기기 설정에서 권한을 허용해주세요.');
        return;
      }
      setTempSettings({ ...notificationSettings, enabled: true });
      setShowNotificationModal(true);
    } else {
      const newSettings = { ...notificationSettings, enabled: false };
      await saveSettings(newSettings);
      if (Platform.OS === 'web') {
        const { WebPushService } = require('@/services/WebPushService');
        await WebPushService.saveSettings(newSettings);
      }
    }
  };

  const handleOpenSettings = () => {
    if (!notificationSettings) return;
    setTempSettings({ ...notificationSettings });
    setShowNotificationModal(true);
  };

  const handleUpdateTempSettings = (newSettings: Partial<PushNotificationSettings>) => {
    if (!tempSettings) return;
    setTempSettings({ ...tempSettings, ...newSettings });
  };

  const handleSaveSettings = async () => {
    if (!tempSettings) return;

    if (!tempSettings.libraryId) {
      Alert.alert('암기장 선택 필요', '학습할 암기장을 선택해주세요.');
      return;
    }

    const finalSettings: PushNotificationSettings = {
      ...tempSettings,
      enabled: true,
      libraryId: tempSettings.libraryId,
      sectionId: tempSettings.sectionId ?? null,
    };

    try {
      await saveSettings(finalSettings);

      if (Platform.OS === 'web') {
        const { WebPushService } = require('@/services/WebPushService');
        await WebPushService.saveSettings(finalSettings);
      }

      setShowNotificationModal(false);
    } catch (error: any) {
      Alert.alert('저장 실패', error.message);
    }
  };

  const handleResetProgress = async () => {
    Alert.alert(
      '진행도 초기화',
      '학습 진행도를 초기화하시겠습니까? 처음부터 다시 시작됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetProgress();
              Alert.alert('완료', '학습 진행도가 초기화되었습니다.');
            } catch (error) {
              Alert.alert('오류', '초기화에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert('로그아웃 실패', error.message);
    }
  };

  const handleThemeChange = () => {
    if (Platform.OS === 'web') {
      const options: ThemeMode[] = ['light', 'dark', 'system'];
      const currentIndex = options.indexOf(themeMode);
      const nextIndex = (currentIndex + 1) % options.length;
      setThemeMode(options[nextIndex]);
    } else {
      Alert.alert(
        '테마 설정',
        '앱의 테마를 선택해주세요.',
        [
          { text: '라이트 모드', onPress: () => setThemeMode('light') },
          { text: '다크 모드', onPress: () => setThemeMode('dark') },
          { text: '시스템 설정 따르기', onPress: () => setThemeMode('system') },
          { text: '취소', style: 'cancel' }
        ]
      );
    }
  };

  const getThemeText = (mode: ThemeMode) => {
    switch (mode) {
      case 'light': return '라이트 모드';
      case 'dark': return '다크 모드';
      case 'system': return '시스템 설정';
    }
  };

  const isWeb = Platform.OS === 'web' && width > 768;

  console.log('[Settings] Modal State:', { showNotificationModal, hasSettings: !!notificationSettings, librariesCount: libraries.length });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        isWeb && { maxWidth: 800, alignSelf: 'center', width: '100%', paddingVertical: 40 }
      ]}
    >
      <Animated.View entering={FadeIn.duration(800)} style={styles.profileSection}>
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={() => router.push('/settings/profile')}
          activeOpacity={0.7}
        >
          <FontAwesome name="user-circle-o" size={80} color={colors.tint} />
          <View variant="transparent" style={styles.editBadge}>
            <FontAwesome name="pencil" size={12} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.email}>{profile?.nickname || '게스트 사용자'}</Text>
        <Text style={[styles.userIdBadge, { color: colors.textSecondary }]}>
          ID: #{profile?.user_id_number || '-----'}
        </Text>
      </Animated.View>

      <View variant="transparent" style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>계정 서비스</Text>
        <Card style={styles.menuCard}>
          {/* 멤버십 기능 일시 비활성화
          <TouchableOpacity style={styles.item} onPress={() => router.push('/membership')} activeOpacity={0.7}>
            <View variant="transparent" style={styles.itemLeft}>
              <View variant="transparent" style={styles.iconWrapper}>
                <FontAwesome name="star" size={18} color="#F59E0B" />
              </View>
              <Text style={styles.itemText}>멤버십 관리</Text>
            </View>
            <FontAwesome name="angle-right" size={18} color={colors.border} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border, opacity: 0.3 }]} />
          */}

          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push('/settings/profile')}
            activeOpacity={0.7}
          >
            <View variant="transparent" style={styles.itemLeft}>
              <View variant="transparent" style={styles.iconWrapper}>
                <FontAwesome name="user-o" size={18} color={colors.textSecondary} />
              </View>
              <Text style={styles.itemText}>프로필 관리</Text>
            </View>
            <FontAwesome name="angle-right" size={18} color={colors.border} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border, opacity: 0.3 }]} />

          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push('/settings/notices')}
            activeOpacity={0.7}
          >
            <View variant="transparent" style={styles.itemLeft}>
              <View variant="transparent" style={styles.iconWrapper}>
                <FontAwesome name="bullhorn" size={18} color={colors.textSecondary} />
              </View>
              <Text style={styles.itemText}>공지사항</Text>
            </View>
            <FontAwesome name="angle-right" size={18} color={colors.border} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border, opacity: 0.3 }]} />

          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push('/support/new')}
            activeOpacity={0.7}
          >
            <View variant="transparent" style={styles.itemLeft}>
              <View variant="transparent" style={styles.iconWrapper}>
                <FontAwesome name="question-circle-o" size={18} color={colors.textSecondary} />
              </View>
              <Text style={styles.itemText}>Q&A 및 건의사항</Text>
            </View>
            <FontAwesome name="angle-right" size={18} color={colors.border} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border, opacity: 0.3 }]} />

          <TouchableOpacity style={styles.item} onPress={handleSignOut} activeOpacity={0.7}>
            <View variant="transparent" style={styles.itemLeft}>
              <View variant="transparent" style={styles.iconWrapper}>
                <FontAwesome name="sign-out" size={18} color={colors.error} />
              </View>
              <Text style={[styles.itemText, { color: colors.error }]}>로그아웃</Text>
            </View>
            <FontAwesome name="angle-right" size={18} color={colors.border} />
          </TouchableOpacity>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>앱 환경 설정</Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity style={styles.item} onPress={handleThemeChange} activeOpacity={0.7}>
            <View variant="transparent" style={styles.itemLeft}>
              <View variant="transparent" style={styles.iconWrapper}>
                <FontAwesome name={colorScheme === 'dark' ? "moon-o" : "sun-o"} size={18} color={colors.tint} />
              </View>
              <Text style={styles.itemText}>테마 설정</Text>
            </View>
            <View variant="transparent" style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.valueText, { color: colors.textSecondary, marginRight: 8 }]}>{getThemeText(themeMode)}</Text>
              <FontAwesome name="angle-right" size={18} color={colors.border} />
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border, opacity: 0.3 }]} />

          {/* 푸시 단어 암기 알림 */}
          <View variant="transparent" style={styles.item}>
            <View variant="transparent" style={styles.itemLeft}>
              <View variant="transparent" style={styles.iconWrapper}>
                <FontAwesome name="bell-o" size={18} color={colors.tint} />
              </View>
              <Text style={styles.itemText}>푸시 단어 암기 알림</Text>
            </View>
            <Switch
              value={notificationSettings?.enabled}
              onValueChange={handleToggleNotification}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#fff'}
            />
          </View>

          {notificationSettings?.enabled && (
            <>
              <TouchableOpacity
                style={[styles.item, { paddingTop: 0 }]}
                onPress={handleOpenSettings}
                activeOpacity={0.7}
              >
                <View variant="transparent" style={[styles.itemLeft, { marginLeft: 48 }]}>
                  <Text style={[styles.valueText, { color: colors.textSecondary }]}>상세 설정 변경하기</Text>
                </View>
                <FontAwesome name="cog" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              {progress && (
                <View variant="transparent" style={[styles.item, { paddingTop: 0 }]}>
                  <View variant="transparent" style={[styles.itemLeft, { marginLeft: 48 }]}>
                    <Text style={[styles.valueText, { color: colors.textSecondary }]}>
                      학습 진행도: {progress.current}/{progress.total}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleResetProgress}>
                    <FontAwesome name="refresh" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border, opacity: 0.3 }]} />

          <View variant="transparent" style={styles.item}>
            <View variant="transparent" style={styles.itemLeft}>
              <View variant="transparent" style={styles.iconWrapper}>
                <FontAwesome name="info-circle" size={18} color={colors.textSecondary} />
              </View>
              <Text style={styles.itemText}>버전 정보</Text>
            </View>
            <Text style={[styles.valueText, { color: colors.textSecondary }]}>v1.4.3</Text>
          </View>
        </Card>

        {/* 회원 탈퇴는 프로필 관리 내부로 이동했으나, 하단 버튼 그대로 유지하거나 숨김 처리 가능.
            여기서는 프로필 관리 화면 강조를 위해 숨기거나 유지. 일단 유지하되 디자인 수정 */}
        <TouchableOpacity
          style={styles.deleteAccount}
          onPress={() => router.push('/settings/profile')}
          activeOpacity={0.6}
        >
          <Text style={[styles.deleteText, { color: colors.textSecondary }]}>계정 관리 및 탈퇴</Text>
        </TouchableOpacity>
      </View>

      {/* 푸시 알림 상세 설정 모달 */}
      <Modal
        visible={showNotificationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>알림 상세 설정</Text>
              <TouchableOpacity onPress={() => setShowNotificationModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <FontAwesome name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {tempSettings ? (
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              >
                {/* 1단계: 암기장 선택 */}
                <Text style={[styles.modalLabel, { color: colors.text }]}>1. 학습할 암기장 선택</Text>
                <TouchableOpacity
                  style={[styles.selectBox, { borderColor: colors.border }]}
                  onPress={() => setShowLibraryList(true)}
                >
                  <Text style={[styles.selectBoxText, { color: tempSettings?.libraryId ? colors.text : colors.textSecondary }]}>
                    {tempSettings?.libraryId
                      ? libraries.find(l => l.id === tempSettings.libraryId)?.title || '암기장 선택됨'
                      : '암기장을 선택해주세요'}
                  </Text>
                  <FontAwesome name="chevron-down" size={12} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* 2단계: 세부 항목(섹션) 선택 */}
                {tempSettings?.libraryId && (
                  <>
                    <Text style={[styles.modalLabel, { color: colors.text }]}>2. 세부 항목 선택 (소분)</Text>
                    <TouchableOpacity
                      style={[styles.selectBox, { borderColor: colors.border }]}
                      onPress={() => !loadingSections && setShowSectionList(true)}
                      disabled={loadingSections}
                    >
                      {loadingSections ? (
                        <ActivityIndicator size="small" color={colors.tint} />
                      ) : (
                        <Text style={[styles.selectBoxText, { color: colors.text }]}>
                          {tempSettings.sectionId === 'all' || !tempSettings.sectionId
                            ? '전체'
                            : sections.find(s => s.id === tempSettings.sectionId)?.title || '섹션 선택됨'}
                        </Text>
                      )}
                      <FontAwesome name="chevron-down" size={12} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </>
                )}

                {/* 단어 범위 */}
                <Text style={[styles.modalLabel, { color: colors.text }]}>단어 범위</Text>
                <View style={styles.chipContainer}>
                  {[
                    { label: '전체', value: 'all' },
                    { label: '외움만', value: 'learned' },
                    { label: '헷갈림만', value: 'confused' },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.chip,
                        { borderColor: colors.border, backgroundColor: colors.background },
                        tempSettings?.range === opt.value && {
                          backgroundColor: colors.tint,
                          borderColor: colors.tint,
                        },
                      ]}
                      onPress={() => handleUpdateTempSettings({ range: opt.value as any })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: colors.text },
                          tempSettings?.range === opt.value && { color: '#fff' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 노출 형식 */}
                <Text style={[styles.modalLabel, { color: colors.text }]}>노출 형식</Text>
                <View style={styles.chipContainer}>
                  {[
                    { label: '단어+뜻', value: 'both' },
                    { label: '단어만', value: 'word_only' },
                    { label: '뜻만', value: 'meaning_only' },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.chip,
                        { borderColor: colors.border, backgroundColor: colors.background },
                        tempSettings?.format === opt.value && {
                          backgroundColor: colors.tint,
                          borderColor: colors.tint,
                        },
                      ]}
                      onPress={() => handleUpdateTempSettings({ format: opt.value as any })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: colors.text },
                          tempSettings?.format === opt.value && { color: '#fff' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 출력 순서 */}
                <Text style={[styles.modalLabel, { color: colors.text }]}>출력 순서</Text>
                <View style={styles.chipContainer}>
                  {[
                    { label: '순차적', value: 'sequential' },
                    { label: '랜덤', value: 'random' },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.chip,
                        { borderColor: colors.border, backgroundColor: colors.background },
                        tempSettings?.order === opt.value && {
                          backgroundColor: colors.tint,
                          borderColor: colors.tint,
                        },
                      ]}
                      onPress={() => handleUpdateTempSettings({ order: opt.value as any })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: colors.text },
                          tempSettings?.order === opt.value && { color: '#fff' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 알림 간격 */}
                <Text style={[styles.modalLabel, { color: colors.text }]}>알림 간격 (분)</Text>
                <View style={styles.intervalContainer}>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    keyboardType="numeric"
                    value={tempSettings?.interval.toString()}
                    onChangeText={(text) =>
                      handleUpdateTempSettings({ interval: parseInt(text) || 1 })
                    }
                  />
                  <Text style={{ marginLeft: 12, color: colors.text, fontWeight: '700' }}>
                    분 마다 알림
                  </Text>
                </View>
              </ScrollView>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.tint} />
                <Text style={{ marginTop: 16, color: colors.textSecondary }}>설정을 불러오는 중...</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.tint }]}
              onPress={handleSaveSettings}
            >
              <Text style={styles.confirmButtonText}>설정 완료</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 암기장 선택 모달 */}
      <Modal
        visible={showLibraryList}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLibraryList(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowLibraryList(false)}>
          <View style={styles.subModalOverlay}>
            <View style={[styles.subModalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.subModalTitle, { color: colors.text }]}>암기장 선택</Text>
              <ScrollView style={{ maxHeight: 300 }}>
                {libraries.map((lib) => (
                  <TouchableOpacity
                    key={lib.id}
                    style={[
                      styles.listItem,
                      tempSettings?.libraryId === lib.id && { backgroundColor: `${colors.tint}10` }
                    ]}
                    onPress={() => {
                      handleUpdateTempSettings({ libraryId: lib.id, sectionId: 'all' });
                      setShowLibraryList(false);
                    }}
                  >
                    <Text style={[
                      styles.listItemText,
                      { color: colors.text },
                      tempSettings?.libraryId === lib.id && { color: colors.tint, fontWeight: '800' }
                    ]}>
                      {lib.title}
                    </Text>
                    {tempSettings?.libraryId === lib.id && <FontAwesome name="check" size={14} color={colors.tint} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 섹션 선택 모달 */}
      <Modal
        visible={showSectionList}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSectionList(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSectionList(false)}>
          <View style={styles.subModalOverlay}>
            <View style={[styles.subModalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.subModalTitle, { color: colors.text }]}>세부 항목 선택</Text>
              <ScrollView style={{ maxHeight: 300 }}>
                <TouchableOpacity
                  style={[
                    styles.listItem,
                    (tempSettings?.sectionId === 'all' || !tempSettings?.sectionId) && { backgroundColor: `${colors.tint}10` }
                  ]}
                  onPress={() => {
                    handleUpdateTempSettings({ sectionId: 'all' });
                    setShowSectionList(false);
                  }}
                >
                  <Text style={[
                    styles.listItemText,
                    { color: colors.text },
                    (tempSettings?.sectionId === 'all' || !tempSettings?.sectionId) && { color: colors.tint, fontWeight: '800' }
                  ]}>
                    전체
                  </Text>
                  {(tempSettings?.sectionId === 'all' || !tempSettings?.sectionId) && <FontAwesome name="check" size={14} color={colors.tint} />}
                </TouchableOpacity>
                {sections.map((section) => (
                  <TouchableOpacity
                    key={section.id}
                    style={[
                      styles.listItem,
                      tempSettings?.sectionId === section.id && { backgroundColor: `${colors.tint}10` }
                    ]}
                    onPress={() => {
                      handleUpdateTempSettings({ sectionId: section.id });
                      setShowSectionList(false);
                    }}
                  >
                    <Text style={[
                      styles.listItemText,
                      { color: colors.text },
                      tempSettings?.sectionId === section.id && { color: colors.tint, fontWeight: '800' }
                    ]}>
                      {section.title}
                    </Text>
                    {tempSettings?.sectionId === section.id && <FontAwesome name="check" size={14} color={colors.tint} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  email: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  userIdBadge: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
    marginTop: 4,
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#4F46E5',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 16,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuCard: {
    borderRadius: 24,
    paddingHorizontal: 8,
    marginBottom: 32,
    borderWidth: 1.5,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginHorizontal: 12,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteAccount: {
    alignItems: 'center',
    marginTop: 8,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)', // 더 어둡게 하여 잔상 방지
    justifyContent: 'center', // 중앙 정렬로 변경
    padding: 20,
  },
  modalContent: {
    width: '90%', // 너비 확실히 지정
    alignSelf: 'center',
    maxHeight: '85%',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1.5,
    elevation: 5,
    shadowColor: '#000', // iOS 그림자
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalScroll: {
    // flex: 1 removed to allow content to dictate height
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 12,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  pickerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  selectBox: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  selectBoxText: {
    fontSize: 15,
    fontWeight: '600',
  },
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  subModalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
  },
  subModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  listItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  intervalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    width: 80,
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
  },
  confirmButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
});
