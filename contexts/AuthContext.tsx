import { createContext, useContext, useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { runQuery, runCommand } from '../lib/db';
import { Profile } from '../types';

type LocalUser = {
    id: string;
};

type AuthContextType = {
    user: LocalUser | null;
    profile: Profile | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    isLoading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

const LOCAL_USER_ID_KEY = 'local_user_id';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<LocalUser | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isInitializing = useRef(false);

    const initializeAuth = async () => {
        if (isInitializing.current) return;
        isInitializing.current = true;

        try {
            console.log('[AuthContext] Initializing local auth...');
            let localUserId = await AsyncStorage.getItem(LOCAL_USER_ID_KEY);

            if (!localUserId) {
                localUserId = Crypto.randomUUID();
                console.log(`[AuthContext] Generating new local user ID: ${localUserId}`);
                await AsyncStorage.setItem(LOCAL_USER_ID_KEY, localUserId);

                // Create initial local profile
                const now = new Date().toISOString();
                const randomIdNumber = Math.floor(100000 + Math.random() * 900000).toString();
                await runCommand(
                    'INSERT INTO profiles (id, email, nickname, user_id_number, role, membership_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [localUserId, 'local@mem-app.com', '학습자', randomIdNumber, 'user', 'BASIC', now]
                );
            }

            setUser({ id: localUserId });
            await fetchProfile(localUserId);
        } catch (error) {
            console.error('[AuthContext] Error initializing local auth:', error);
        } finally {
            setIsLoading(false);
            isInitializing.current = false;
        }
    };

    const fetchProfile = async (userId: string) => {
        try {
            const results = await runQuery('SELECT * FROM profiles WHERE id = ?', [userId]);
            if (results && results.length > 0) {
                setProfile(results[0] as Profile);
            } else {
                console.warn('[AuthContext] Profile not found in local DB, creating one...');
                const now = new Date().toISOString();
                const randomIdNumber = Math.floor(100000 + Math.random() * 900000).toString();
                await runCommand(
                    'INSERT OR REPLACE INTO profiles (id, email, nickname, user_id_number, role, membership_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [userId, 'local@mem-app.com', '학습자', randomIdNumber, 'user', 'BASIC', now]
                );
                const refreshed = await runQuery('SELECT * FROM profiles WHERE id = ?', [userId]);
                setProfile(refreshed[0] as Profile);
            }
        } catch (error) {
            console.error('[AuthContext] Error fetching profile:', error);
        }
    };

    useEffect(() => {
        initializeAuth();
    }, []);

    const signOut = async () => {
        // For local-first, sign out could mean clearing everything or just unsetting ID
        // The user asked to remove login, so we'll just keep the local identity.
        // If they really want to "sign out" (reset), we'd clear AsyncStorage.
        console.log('[AuthContext] signOut called in local mode (no-op or reset)');
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    const value = {
        user,
        profile,
        isLoading,
        signOut,
        refreshProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
