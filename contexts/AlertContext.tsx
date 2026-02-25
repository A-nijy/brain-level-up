import React, { createContext, useContext, useState, useCallback } from 'react';

export interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertConfig {
    title: string;
    message?: string;
    buttons?: AlertButton[];
    options?: {
        cancelable?: boolean;
        onDismiss?: () => void;
    };
}

interface AlertContextType {
    showAlert: (config: AlertConfig) => void;
    hideAlert: () => void;
    alertConfig: AlertConfig | null;
    isVisible: boolean;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [isVisible, setIsVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

    const showAlert = useCallback((config: AlertConfig) => {
        setAlertConfig(config);
        setIsVisible(true);
    }, []);

    const hideAlert = useCallback(() => {
        setIsVisible(false);
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert, alertConfig, isVisible }}>
            {children}
        </AlertContext.Provider>
    );
}

export function useAlert() {
    const context = useContext(AlertContext);
    if (context === undefined) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
}
