import { StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function SettingsScreen() {
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert('로그아웃 실패', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <FontAwesome name="user" size={40} color="#666" />
        </View>
        <Text style={styles.email}>{user?.email || '게스트 사용자'}</Text>
        <Text style={styles.role}>BASIC 회원</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>계정</Text>
        <TouchableOpacity style={styles.item} onPress={handleSignOut}>
          <Text style={[styles.itemText, styles.dangerText]}>로그아웃</Text>
          <FontAwesome name="sign-out" size={16} color="#ff4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>앱 설정</Text>
        <View style={styles.item}>
          <Text style={styles.itemText}>다크 모드</Text>
          <Text style={styles.valueText}>시스템 설정</Text>
          {/* 추후 구현 */}
        </View>
        <View style={styles.item}>
          <Text style={styles.itemText}>버전</Text>
          <Text style={styles.valueText}>1.0.0</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#fff', // Themed View might override, but explicit white for cards usually good in light mode
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  valueText: {
    fontSize: 14,
    color: '#999',
  },
  dangerText: {
    color: '#ff4444',
  },
});
