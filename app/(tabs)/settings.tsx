import { StyleSheet, Alert, TouchableOpacity, useWindowDimensions, ScrollView, Platform, Switch, Modal, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { PushNotificationService, PushNotificationSettings } from '@/services/PushNotificationService';
import { LibraryService } from '@/services/LibraryService';
import { Library } from '@/types';

export default function SettingsScreen() {
  const { signOut, user, profile, session } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { width } = useWindowDimensions();

  // 푸시 알림 상태
  const [notificationSettings, setNotificationSettings] = useState<PushNotificationSettings | null>(null);
  const [tempSettings, setTempSettings] = useState<PushNotificationSettings | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    loadNotificationSettings();
    loadLibraries();
    loadProgress();
  }, []);

  const loadNotificationSettings = async () => {
    const settings = await PushNotificationService.getSettings();
    setNotificationSettings(settings || {
      enabled: false,
      libraryId: null,
      range: 'all',
      format: 'both',
      order: 'sequential',
      interval: 60,
    });
  };

  const loadLibraries = async () => {
    if (user) {
      const libs = await LibraryService.getLibraries(user.id);
      setLibraries(libs);
    }
  };

  const loadProgress = async () => {
    const prog = await PushNotificationService.getProgress();
    setProgress(prog);
  };

  const handleToggleNotification = async (value: boolean) => {
    if (!notificationSettings) return;

    if (value) {
      // 권한 요청
      const granted = await PushNotificationService.requestPermissions();
      if (!granted) {
        Alert.alert('권한 필요', '푸시 알림을 위해 알림 권한이 필요합니다. 설정에서 권한을 허용해주세요.');
        return;
      }

      // 켤 때는 바로 저장하지 않고 모달을 띄움
      setTempSettings({ ...notificationSettings, enabled: true });
      setShowNotificationModal(true);
    } else {
      // 끌 때는 바로 저장
      const newSettings = { ...notificationSettings, enabled: false };
      setNotificationSettings(newSettings);
      await PushNotificationService.saveSettings(newSettings, session?.user?.id);
      await loadProgress();
    }
  };

  // 상세 설정 변경하기 클릭 시
  const handleOpenSettings = () => {
    if (!notificationSettings) return;
    setTempSettings({ ...notificationSettings });
    setShowNotificationModal(true);
  };

  // 알림 설정 변경 핸들러 (모달 내 로컬 상태만 변경)
  const handleUpdateTempSettings = (newSettings: Partial<PushNotificationSettings>) => {
    if (!tempSettings) return;
    setTempSettings({ ...tempSettings, ...newSettings });
  };

  // 모달 내 '설정 완료' 클릭 시 최종 저장
  const handleSaveSettings = async () => {
    if (!tempSettings) return;

    if (!tempSettings.libraryId) {
      Alert.alert('단어장 선택 필요', '학습할 단어장을 선택해주세요.');
      return;
    }

    const finalSettings = { ...tempSettings, enabled: true };
    setNotificationSettings(finalSettings);
    await PushNotificationService.saveSettings(finalSettings, session?.user?.id);
    await loadProgress();
    setShowNotificationModal(false);
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
            await PushNotificationService.resetProgress();
            await loadProgress();
            Alert.alert('완료', '학습 진행도가 초기화되었습니다.');
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
        <View variant="transparent" style={styles.avatarWrapper}>
          <FontAwesome name="user-circle-o" size={80} color={colors.tint} />
        </View>
        <Text style={styles.email}>{user?.email || '게스트 사용자'}</Text>
        {/* 멤버십 등급 일시 숨김
        <Text style={[styles.roleText, { color: colors.tint }]}>
          BASIC MEMBER
        </Text>
        */}
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

          {/* 미구현 프로필 수정 기능 숨김
          <TouchableOpacity style={styles.item} activeOpacity={0.7}>
            <View variant="transparent" style={styles.itemLeft}>
              <View variant="transparent" style={styles.iconWrapper}>
                <FontAwesome name="user-o" size={18} color={colors.textSecondary} />
              </View>
              <Text style={styles.itemText}>프로필 수정</Text>
            </View>
            <FontAwesome name="angle-right" size={18} color={colors.border} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border, opacity: 0.3 }]} />
          */}

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
          <View style={styles.item}>
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
                <View style={[styles.item, { paddingTop: 0 }]}>
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

          <View style={styles.item}>
            <View variant="transparent" style={styles.itemLeft}>
              <View variant="transparent" style={styles.iconWrapper}>
                <FontAwesome name="info-circle" size={18} color={colors.textSecondary} />
              </View>
              <Text style={styles.itemText}>버전 정보</Text>
            </View>
            <Text style={[styles.valueText, { color: colors.textSecondary }]}>v1.4.3</Text>
          </View>
        </Card>

        <TouchableOpacity style={styles.deleteAccount} activeOpacity={0.6}>
          <Text style={[styles.deleteText, { color: colors.textSecondary }]}>회원 탈퇴</Text>
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
                {/* 단어장 선택 */}
                <Text style={[styles.modalLabel, { color: colors.text }]}>학습할 단어장</Text>
                <View style={styles.pickerContainer}>
                  {libraries.length > 0 ? (
                    libraries.map((lib) => (
                      <TouchableOpacity
                        key={lib.id}
                        style={[
                          styles.pickerItem,
                          { borderColor: colors.border },
                          tempSettings?.libraryId === lib.id && {
                            backgroundColor: `${colors.tint}20`,
                            borderColor: colors.tint,
                          },
                        ]}
                        onPress={() => handleUpdateTempSettings({ libraryId: lib.id })}
                      >
                        <Text
                          style={[
                            styles.pickerText,
                            { color: colors.text },
                            tempSettings?.libraryId === lib.id && {
                              color: colors.tint,
                              fontWeight: '800',
                            },
                          ]}
                        >
                          {lib.title}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={{ color: colors.textSecondary }}>생성된 단어장이 없습니다.</Text>
                  )}
                </View>

                {/* 단어 범위 */}
                <Text style={[styles.modalLabel, { color: colors.text }]}>단어 범위</Text>
                <View style={styles.chipContainer}>
                  {[
                    { label: '전체', value: 'all' },
                    { label: '오답만', value: 'incorrect' },
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
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#f5f5f5',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
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
