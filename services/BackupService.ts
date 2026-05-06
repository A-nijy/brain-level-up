import * as FileSystem from 'expo-file-system/legacy';
import { Buffer } from 'buffer';

export class BackupService {
    private static readonly DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
    private static readonly DB_NAME = 'mem_app.db';
    private static readonly DB_PATH = `${FileSystem.documentDirectory}SQLite/mem_app.db`;

    /**
     * 1. 드라이브에서 기존 백업 파일 찾기 (appDataFolder 내에서)
     */
    static async findBackupFile(accessToken: string) {
        console.log('[BackupService] Searching for existing backup file...');
        const query = encodeURIComponent(`name = '${this.DB_NAME}' and 'appDataFolder' in parents and trashed = false`);
        const url = `${this.DRIVE_API_URL}?q=${query}&spaces=appDataFolder&fields=files(id, name, modifiedTime)`;
        
        const response = await fetch(url, { 
            headers: { Authorization: `Bearer ${accessToken}` } 
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[BackupService] findBackupFile error:', errorText);
            throw new Error(`백업 파일 조회 실패: ${response.status}`);
        }

        const data = await response.json();
        const file = data.files && data.files.length > 0 ? data.files[0] : null;
        console.log('[BackupService] Find result:', file ? `Found (ID: ${file.id})` : 'Not Found');
        return file;
    }

    /**
     * 2. 백업 실행 (업로드 - Multipart 관련 로직 포함)
     */
    static async backup(accessToken: string) {
        console.log('[BackupService] Starting backup...');
        
        // DB 파일 존재 여부 확인
        const fileInfo = await FileSystem.getInfoAsync(this.DB_PATH);
        if (!fileInfo.exists) {
            console.error('[BackupService] DB file not found at:', this.DB_PATH);
            throw new Error('백업할 데이터베이스 파일을 찾을 수 없습니다.');
        }

        // DB 파일을 Base64로 읽기
        const base64Content = await FileSystem.readAsStringAsync(this.DB_PATH, { 
            encoding: FileSystem.EncodingType.Base64 
        });

        // 기존 파일 확인
        const existingFile = await this.findBackupFile(accessToken);
        
        // 메타데이터 설정 (신규 생성 시에만 parents 설정)
        const metadata = { 
            name: this.DB_NAME, 
            parents: existingFile ? undefined : ['appDataFolder'] 
        };

        const boundary = 'foo_bar_baz';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        // 멀티파트 바디 구성 (Metadata + File Content)
        const multipartBody = 
            delimiter + 
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' + 
            JSON.stringify(metadata) +
            delimiter + 
            'Content-Type: application/octet-stream\r\n' + 
            'Content-Transfer-Encoding: base64\r\n\r\n' +
            base64Content + 
            closeDelimiter;

        const url = existingFile 
            ? `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`
            : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

        console.log('[BackupService] Uploading to Google Drive...', existingFile ? '(Update)' : '(New)');
        
        const response = await fetch(url, {
            method: existingFile ? 'PATCH' : 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: multipartBody,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[BackupService] Backup error:', errorText);
            throw new Error(`업로드 실패: ${response.status}`);
        }

        console.log('[BackupService] Backup successful');
        return true;
    }

    /**
     * 3. 복원 실행 (다운로드 및 덮어쓰기)
     */
    static async restore(accessToken: string) {
        console.log('[BackupService] Starting restore...');
        
        const backup = await this.findBackupFile(accessToken);
        if (!backup) {
            throw new Error('구글 드라이브에 저장된 백업 파일이 없습니다.');
        }

        console.log('[BackupService] Downloading file content...');
        const downloadResponse = await fetch(`${this.DRIVE_API_URL}/${backup.id}?alt=media`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!downloadResponse.ok) {
            throw new Error(`다운로드 실패: ${downloadResponse.status}`);
        }

        // ArrayBuffer를 Base64로 변환
        const buffer = await downloadResponse.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString('base64');

        // SQLite 폴더 존재 확인 (없으면 생성)
        const sqliteDir = `${FileSystem.documentDirectory}SQLite/`;
        const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
        }

        // DB 파일 덮어쓰기
        console.log('[BackupService] Overwriting local database...');
        await FileSystem.writeAsStringAsync(this.DB_PATH, base64Data, { 
            encoding: FileSystem.EncodingType.Base64 
        });

        console.log('[BackupService] Restore successful');
        return true;
    }

    /**
     * 보조: 액세스 토큰 가져오기 (useGoogleAuth 훅과 연동)
     */
    static async getAccessToken(signInAndGetToken: () => Promise<string | null>) {
        return await signInAndGetToken();
    }
}
