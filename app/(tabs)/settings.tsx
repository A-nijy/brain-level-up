import { StyleSheet, Alert, TouchableOpacity, useWindowDimensions, ScrollView, Platform } from 'react-native';
import { Text, View, Card } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { signOut, user, profile } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { width } = useWindowDimensions();

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
    flex: 1,
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
