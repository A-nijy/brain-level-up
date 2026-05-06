import { useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import { Alert } from 'react-native';

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export const useGoogleAuth = () => {
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Expo Router가 인식할 수 있는 실제 페이지 경로(/settings)로 리다이렉트 설정
  const redirectUri = 'com.googleusercontent.apps.93551489917-8a5eule47c8ib1a5iu9imvvbg1jadp74:/settings';

  const signInAndGetToken = async (): Promise<string | null> => {
    try {
      setIsAuthLoading(true);
      
      console.log('--- [Auth Debug] Starting Manual Auth Flow ---');
      
      // 1. 인증 요청 생성 (PKCE 포함)
      const authRequest = new AuthSession.AuthRequest({
        clientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID || '',
        scopes: ['https://www.googleapis.com/auth/drive.appdata', 'profile', 'email'],
        redirectUri,
        usePKCE: true,
        responseType: AuthSession.ResponseType.Code,
      });

      // 2. 브라우저 실행
      console.log('[Auth] Opening browser...');
      const result = await authRequest.promptAsync(GOOGLE_DISCOVERY);
      console.log('[Auth] Prompt result:', result.type);

      if (result.type === 'success' && result.params.code) {
        console.log('[Auth] Exchanging code for token...');
        
        // 3. 토큰 교환 (우리가 명시적으로 한 번만 호출)
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID || '',
            code: result.params.code,
            redirectUri,
            extraParams: { code_verifier: authRequest.codeVerifier || '' },
          },
          GOOGLE_DISCOVERY
        );
        
        console.log('[Auth] Token exchange successful');
        return tokenResponse.accessToken;
      }
      
      return null;
    } catch (error: any) {
      console.error('[Auth] Manual Flow Error:', error);
      Alert.alert('인증 실패', error.message);
      return null;
    } finally {
      setIsAuthLoading(false);
    }
  };

  return { 
      signInAndGetToken, 
      isAuthLoading, 
      resetAuthLoading: () => setIsAuthLoading(false)
  };
};
