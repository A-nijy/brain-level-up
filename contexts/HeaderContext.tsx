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
    setActions: (actions: HeaderAction[]) => void;
    clearActions: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
    const [actions, setActionsState] = useState<HeaderAction[]>([]);

    const setActions = (newActions: HeaderAction[]) => {
        setActionsState(newActions);
    };

    const clearActions = () => {
        setActionsState([]);
    };

    return (
        <HeaderContext.Provider value={{ actions, setActions, clearActions }}>
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
