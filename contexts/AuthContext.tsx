import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const lastFetchedUserId = useRef<string | null>(null);

    const fetchProfile = async (userId: string, force = false) => {
        // Prevent redundant fetches for the same user in quick succession
        if (!force && lastFetchedUserId.current === userId && profile) return;

        try {
            console.log(`[AuthContext] Fetching profile for: ${userId} (force: ${force})`);
            lastFetchedUserId.current = userId;

            let retries = 3;
            let success = false;

            while (retries > 0 && !success) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error) {
                    console.warn(`[AuthContext] Profile not found or error, retries left: ${retries - 1}`);
                    retries--;
                    if (retries === 0) throw error;
                    await new Promise(resolve => setTimeout(resolve, 800)); // wait before retry
                } else {
                    console.log('[AuthContext] Profile fetched successfully.');
                    const modifiedData = data ? { ...data, membership_level: 'BASIC' } : null;
                    setProfile(modifiedData);
                    success = true;
                }
            }
        } catch (e) {
            console.warn('[AuthContext] Error fetching profile (final). Attempting fallback profile creation...', e);

            try {
                // Get user email for the fallback profile
                const { data: { session } } = await supabase.auth.getSession();
                const userEmail = session?.user?.email ?? 'guest@mem-app.com';

                // Try to force insert a profile (Upsert)
                const { data: newData, error: insertError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        email: userEmail,
                        role: 'user',
                        membership_level: 'BASIC'
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('[AuthContext] Fallback creation failed:', insertError);
                    setProfile(null);
                } else {
                    console.log('[AuthContext] Fallback profile created successfully.');
                    setProfile(newData);
                }
            } catch (fallbackErr) {
                console.error('[AuthContext] Critical fallback error:', fallbackErr);
                setProfile(null);
            }
        }
    };

    useEffect(() => {
        let isMounted = true;
        console.log('[AuthContext] Initializing auth...');

        // Fail-safe timeout: Ensure isLoading is ALWAYS set to false after 8 seconds
        const timeoutId = setTimeout(() => {
            if (isMounted && isLoading) {
                console.warn('[AuthContext] Initialization timeout reached. Forcing isLoading = false.');
                setIsLoading(false);
            }
        }, 8000);

        const handleAuthChange = async (newSession: Session | null) => {
            if (!isMounted) return;

            console.log(`[AuthContext] Session update: ${!!newSession}`);
            setSession(newSession);

            if (newSession?.user) {
                await fetchProfile(newSession.user.id);
            } else {
                setProfile(null);
                lastFetchedUserId.current = null;
            }

            if (isMounted) {
                setIsLoading(false);
                clearTimeout(timeoutId);
            }
        };

        // Get initial session
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (s) {
                console.log('[AuthContext] Initial session found.');
                handleAuthChange(s);
            } else {
                console.log('[AuthContext] No initial session.');
                // If no initial session, we still wait for onAuthStateChange to confirm or timeout
                setTimeout(() => {
                    if (isMounted && isLoading) {
                        setIsLoading(false);
                        clearTimeout(timeoutId);
                    }
                }, 3000);
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log(`[AuthContext] Auth event: ${event}`);
            if (event === 'SIGNED_OUT') {
                setSession(null);
                setProfile(null);
                lastFetchedUserId.current = null;
                setIsLoading(false);
                clearTimeout(timeoutId);
            } else if (newSession) {
                handleAuthChange(newSession);
            }
        });

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const refreshProfile = async () => {
        if (session?.user) {
            await fetchProfile(session.user.id, true);
        }
    };

    const value = {
        session,
        user: session?.user ?? null,
        profile,
        isLoading,
        signOut,
        refreshProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
