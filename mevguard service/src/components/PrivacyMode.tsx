import { useState, createContext, useContext, ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { useLocalStorage } from '../lib/hooks';

interface PrivacyContextType {
  privacyMode: boolean;
  togglePrivacy: () => void;
  maskValue: (value: string | number) => string;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [privacyMode, setPrivacyMode] = useLocalStorage('privacy-mode', false);

  const togglePrivacy = () => {
    setPrivacyMode(!privacyMode);
  };

  const maskValue = (value: string | number): string => {
    if (!privacyMode) return String(value);
    
    const str = String(value);
    // Replace numbers with asterisks
    return str.replace(/\d/g, '*').replace(/\./g, '.');
  };

  return (
    <PrivacyContext.Provider value={{ privacyMode, togglePrivacy, maskValue }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within PrivacyProvider');
  }
  return context;
}

export function PrivacyToggle() {
  const { privacyMode, togglePrivacy } = usePrivacy();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={togglePrivacy}
      className="bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#2a2a2a]"
      title={privacyMode ? 'Show values' : 'Hide values'}
    >
      {privacyMode ? (
        <EyeOff className="w-4 h-4 text-gray-400" />
      ) : (
        <Eye className="w-4 h-4 text-gray-400" />
      )}
    </Button>
  );
}

interface PrivateValueProps {
  value: string | number;
  className?: string;
}

export function PrivateValue({ value, className = '' }: PrivateValueProps) {
  const { maskValue } = usePrivacy();

  return <span className={className}>{maskValue(value)}</span>;
}
