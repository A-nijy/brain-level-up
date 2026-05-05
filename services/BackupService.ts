import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as FileSystem from 'expo-file-system';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_AUTH_STORAGE_KEY = 'google_auth_token';
const BACKUP_FILE_NAME = 'brain_level_up_backup.db';

export const BackupService = {
    /**
     * 구글 로그인 및 토큰 획득
     */
    async getAccessToken(request: any, response: any, promptAsync: any): Promise<string | null> {
        // 이미 저장된 토큰이 있는지 확인
        const savedToken = await AsyncStorage.getItem(GOOGLE_AUTH_STORAGE_KEY);
        if (savedToken) return savedToken;

        // 로그인 창 띄우기
        const result = await promptAsync();
        if (result?.type === 'success') {
            const { accessToken } = result.authentication;
            await AsyncStorage.setItem(GOOGLE_AUTH_STORAGE_KEY, accessToken);
            return accessToken;
        }

        return null;
    },

    /**
     * 구글 드라이브에 DB 파일 백업
     */
    async backup(accessToken: string): Promise<boolean> {
        try {
            const dbPath = `${FileSystem.documentDirectory}SQLite/mem_app.db`;
            const fileInfo = await FileSystem.getInfoAsync(dbPath);
            
            if (!fileInfo.exists) {
                throw new Error('데이터베이스 파일을 찾을 수 없습니다.');
            }

            // 1. 기존 백업 파일이 있는지 검색
            const searchResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILE_NAME}'&fields=files(id)`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            const searchResult = await searchResponse.json();
            const existingFileId = searchResult.files?.[0]?.id;

            // 2. 파일 업로드 (Multipart)
            const metadata = {
                name: BACKUP_FILE_NAME,
                mimeType: 'application/octet-stream',
            };

            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            
            // expo-file-system으로 파일을 읽어 base64로 변환 후 전송 (또는 직접 업로드 지원 시 사용)
            const fileContent = await FileSystem.readAsStringAsync(dbPath, { encoding: FileSystem.EncodingType.Base64 });
            formData.append('file', {
                uri: `data:application/octet-stream;base64,${fileContent}`,
                name: BACKUP_FILE_NAME,
                type: 'application/octet-stream',
            } as any);

            let uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
            let method = 'POST';

            if (existingFileId) {
                uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`;
                method = 'PATCH';
            }

            const uploadResponse = await fetch(uploadUrl, {
                method,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                const err = await uploadResponse.json();
                throw new Error(`백업 업로드 실패: ${err.error?.message || uploadResponse.statusText}`);
            }

            return true;
        } catch (error) {
            console.error('[BackupService] Backup error:', error);
            throw error;
        }
    },

    /**
     * 구글 드라이브에서 DB 파일 복구
     */
    async restore(accessToken: string): Promise<boolean> {
        try {
            // 1. 백업 파일 검색
            const searchResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILE_NAME}'&fields=files(id)`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            const searchResult = await searchResponse.json();
            const existingFileId = searchResult.files?.[0]?.id;

            if (!existingFileId) {
                throw new Error('구글 드라이브에서 백업 파일을 찾을 수 없습니다.');
            }

            // 2. 파일 다운로드
            const downloadUrl = `https://www.googleapis.com/drive/v3/files/${existingFileId}?alt=media`;
            const downloadRes = await fetch(downloadUrl, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!downloadRes.ok) throw new Error('백업 파일 다운로드 실패');

            const blob = await downloadRes.blob();
            const reader = new FileReader();
            
            const base64Content = await new Promise<string>((resolve) => {
                reader.onloadend = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    resolve(base64);
                };
                reader.readAsDataURL(blob);
            });

            // 3. 로컬 DB 덮어쓰기
            const dbPath = `${FileSystem.documentDirectory}SQLite/mem_app.db`;
            
            // 기존 DB 연결 종료는 Expo SQLite에서 자동으로 처리되길 기대하거나, 
            // 앱 재시작을 유도해야 함.
            await FileSystem.writeAsStringAsync(dbPath, base64Content, { encoding: FileSystem.EncodingType.Base64 });

            return true;
        } catch (error) {
            console.error('[BackupService] Restore error:', error);
            throw error;
        }
    },

    /**
     * 로그아웃 (토큰 삭제)
     */
    async logout() {
        await AsyncStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
    }
};
