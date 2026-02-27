import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

export interface HeaderAction {
    id: string;
    icon: string;
    onPress: () => void;
    color?: string;
    label?: string;
    disabled?: boolean;
    loading?: boolean;
}

interface HeaderContextType {
    actions: HeaderAction[];
    title: string | null;
    setActions: (actions: HeaderAction[]) => void;
    setTitle: (title: string | null) => void;
    clearActions: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
    const [actions, setActionsState] = useState<HeaderAction[]>([]);
    const [title, setTitleState] = useState<string | null>(null);

    const setActions = (newActions: HeaderAction[]) => {
        setActionsState(newActions);
    };

    const setTitle = (newTitle: string | null) => {
        setTitleState(newTitle);
    };

    const clearActions = () => {
        setActionsState([]);
        setTitleState(null);
    };

    return (
        <HeaderContext.Provider value={{ actions, title, setActions, setTitle, clearActions }}>
            {children}
        </HeaderContext.Provider>
    );
}

export function useHeader() {
    const context = useContext(HeaderContext);
    if (context === undefined) {
        throw new Error('useHeader must be used within a HeaderProvider');
    }
    return context;
}

/**
 * 전역 헤더 액션을 설정하고, 해당 화면이 포커스를 잃을 때(또는 언마운트 시) 
 * 자동으로 액션을 초기화해주는 편리한 훅입니다.
 */
export function useHeaderActions(actions: HeaderAction[], deps: any[] = []) {
    const { setActions, clearActions } = useHeader();

    useFocusEffect(
        useCallback(() => {
            if (Platform.OS === 'web') {
                setActions(actions);
            }
            return () => clearActions();
        }, deps)
    );
}

/**
 * 웹 헤더의 제목을 동적으로 설정합니다.
 */
export function useWebHeaderTitle(title: string | null, deps: any[] = []) {
    const { setTitle } = useHeader();

    useFocusEffect(
        useCallback(() => {
            if (Platform.OS === 'web' && title) {
                setTitle(title);
            }
            return () => {
                if (Platform.OS === 'web') setTitle(null);
            };
        }, [title, ...deps])
    );
}
