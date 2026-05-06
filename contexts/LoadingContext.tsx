import React, { createContext, useContext, useState, useCallback } from 'react';
import { LoadingOverlay } from '@/components/LoadingOverlay';

interface LoadingContextType {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('처리 중입니다...');

  const showLoading = useCallback((msg?: string) => {
    if (msg) setMessage(msg);
    setVisible(true);
  }, []);

  const hideLoading = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading, isLoading: visible }}>
      {children}
      <LoadingOverlay 
        visible={visible} 
        message={message} 
        onTimeout={hideLoading} 
      />
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
