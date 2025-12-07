import { logger } from '../services/logger.service';
// Form state persistence - "Don't Wipe" Rule
// Saves form state to sessionStorage and restores it

interface FormState {
  [key: string]: any;
}

const FORM_STORAGE_PREFIX = 'paradox_form_';

export const persistFormState = (formId: string, state: FormState) => {
  try {
    const key = `${FORM_STORAGE_PREFIX}${formId}`;
    sessionStorage.setItem(key, JSON.stringify({
      data: state,
      timestamp: Date.now()
    }));
  } catch (err) {
    logger.warn('Failed to persist form state:', err);
  }
};

export const restoreFormState = (formId: string): FormState | null => {
  try {
    const key = `${FORM_STORAGE_PREFIX}${formId}`;
    const stored = sessionStorage.getItem(key);
    
    if (!stored) return null;
    
    const { data, timestamp } = JSON.parse(stored);
    
    // Expire form state after 1 hour
    const ONE_HOUR = 60 * 60 * 1000;
    if (Date.now() - timestamp > ONE_HOUR) {
      sessionStorage.removeItem(key);
      return null;
    }
    
    return data;
  } catch (err) {
    logger.warn('Failed to restore form state:', err);
    return null;
  }
};

export const clearFormState = (formId: string) => {
  try {
    const key = `${FORM_STORAGE_PREFIX}${formId}`;
    sessionStorage.removeItem(key);
  } catch (err) {
    logger.warn('Failed to clear form state:', err);
  }
};

export const clearAllFormStates = () => {
  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(FORM_STORAGE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (err) {
    logger.warn('Failed to clear all form states:', err);
  }
};
