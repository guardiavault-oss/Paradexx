/**
 * Transaction Flow State Machine
 * Manages complex transaction flow with animations and error handling
 */

import { useState, useCallback, useEffect } from 'react';

// ==============================================
// TYPES & INTERFACES
// ==============================================

export type TransactionState =
  | 'idle'
  | 'inputting'
  | 'validating'
  | 'confirming'
  | 'signing'
  | 'broadcasting'
  | 'pending'
  | 'success'
  | 'error';

export interface TransactionContext {
  from?: string;
  to?: string;
  amount?: string;
  gasPrice?: string;
  data?: string;
  error?: string;
  txHash?: string;
  retryCount?: number;
}

export interface TransactionEvent {
  type:
    | 'INPUT'
    | 'VALIDATE'
    | 'CONFIRM'
    | 'SIGN'
    | 'BROADCAST'
    | 'SUCCESS'
    | 'ERROR'
    | 'RETRY'
    | 'CANCEL'
    | 'RESET';
  payload?: Partial<TransactionContext>;
}

export interface StateTransition {
  from: TransactionState;
  to: TransactionState;
  animation?: {
    enter: string;
    exit: string;
  };
}

// ==============================================
// STATE MACHINE CONFIGURATION
// ==============================================

const TRANSITIONS: Record<TransactionState, Partial<Record<TransactionEvent['type'], TransactionState>>> = {
  idle: {
    INPUT: 'inputting',
  },
  inputting: {
    VALIDATE: 'validating',
    CANCEL: 'idle',
  },
  validating: {
    CONFIRM: 'confirming',
    ERROR: 'error',
    INPUT: 'inputting',
  },
  confirming: {
    SIGN: 'signing',
    INPUT: 'inputting',
    CANCEL: 'idle',
  },
  signing: {
    BROADCAST: 'broadcasting',
    ERROR: 'error',
    CANCEL: 'idle',
  },
  broadcasting: {
    SUCCESS: 'pending',
    ERROR: 'error',
  },
  pending: {
    SUCCESS: 'success',
    ERROR: 'error',
  },
  success: {
    RESET: 'idle',
  },
  error: {
    RETRY: 'inputting',
    RESET: 'idle',
  },
};

const STATE_ANIMATIONS: Record<TransactionState, { enter: string; exit: string }> = {
  idle: { enter: 'fadeIn', exit: 'fadeOut' },
  inputting: { enter: 'slideUp', exit: 'slideDown' },
  validating: { enter: 'scale', exit: 'scale' },
  confirming: { enter: 'slideLeft', exit: 'slideRight' },
  signing: { enter: 'scale', exit: 'fadeOut' },
  broadcasting: { enter: 'fadeIn', exit: 'fadeOut' },
  pending: { enter: 'fadeIn', exit: 'fadeOut' },
  success: { enter: 'scale', exit: 'fadeOut' },
  error: { enter: 'shake', exit: 'fadeOut' },
};

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

// ==============================================
// TRANSACTION MACHINE HOOK
// ==============================================

export function useTransactionMachine() {
  const [state, setState] = useState<TransactionState>('idle');
  const [context, setContext] = useState<TransactionContext>({});
  const [history, setHistory] = useState<TransactionState[]>(['idle']);

  // Get current animation config
  const getCurrentAnimation = useCallback(() => {
    return STATE_ANIMATIONS[state];
  }, [state]);

  // Check if transition is valid
  const canTransition = useCallback(
    (eventType: TransactionEvent['type']): boolean => {
      return !!TRANSITIONS[state]?.[eventType];
    },
    [state]
  );

  // Send event to machine
  const send = useCallback(
    async (event: TransactionEvent) => {
      const { type, payload } = event;

      // Check if transition is valid
      if (!canTransition(type)) {
        console.warn(`Invalid transition: ${state} -> ${type}`);
        return;
      }

      const nextState = TRANSITIONS[state][type];
      if (!nextState) return;

      // Update context
      if (payload) {
        setContext((prev) => ({ ...prev, ...payload }));
      }

      // Special handling for errors
      if (type === 'ERROR') {
        const retryCount = (context.retryCount || 0) + 1;
        setContext((prev) => ({
          ...prev,
          error: payload?.error,
          retryCount,
        }));

        // Auto-retry with exponential backoff
        if (retryCount <= MAX_RETRIES) {
          const delay = RETRY_DELAYS[retryCount - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
          setTimeout(() => {
            send({ type: 'RETRY' });
          }, delay);
        }
      }

      // Update state
      setState(nextState);
      setHistory((prev) => [...prev, nextState]);
    },
    [state, context, canTransition]
  );

  // Reset machine
  const reset = useCallback(() => {
    setState('idle');
    setContext({});
    setHistory(['idle']);
  }, []);

  // Get previous state
  const getPreviousState = useCallback((): TransactionState | null => {
    return history.length > 1 ? history[history.length - 2] : null;
  }, [history]);

  // Check if in specific state
  const is = useCallback(
    (checkState: TransactionState): boolean => {
      return state === checkState;
    },
    [state]
  );

  // Check if in any of the given states
  const isAny = useCallback(
    (states: TransactionState[]): boolean => {
      return states.includes(state);
    },
    [state]
  );

  return {
    state,
    context,
    history,
    send,
    reset,
    canTransition,
    getCurrentAnimation,
    getPreviousState,
    is,
    isAny,
  };
}

// ==============================================
// MODAL STACK MACHINE
// ==============================================

export interface Modal {
  id: string;
  component: React.ComponentType<any>;
  props?: any;
  zIndex?: number;
  backdrop?: boolean;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
}

export function useModalStack() {
  const [stack, setStack] = useState<Modal[]>([]);

  // Open modal
  const open = useCallback((modal: Omit<Modal, 'zIndex'>) => {
    setStack((prev) => {
      const baseZIndex = 1000;
      const zIndex = baseZIndex + prev.length * 10;
      return [...prev, { ...modal, zIndex }];
    });
  }, []);

  // Close modal by ID
  const close = useCallback((id: string) => {
    setStack((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // Close top modal
  const closeTop = useCallback(() => {
    setStack((prev) => prev.slice(0, -1));
  }, []);

  // Close all modals
  const closeAll = useCallback(() => {
    setStack([]);
  }, []);

  // Get top modal
  const getTop = useCallback((): Modal | null => {
    return stack.length > 0 ? stack[stack.length - 1] : null;
  }, [stack]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const top = getTop();
        if (top?.closeOnEscape !== false) {
          closeTop();
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeTop, getTop]);

  return {
    stack,
    open,
    close,
    closeTop,
    closeAll,
    getTop,
  };
}

// ==============================================
// FORM WIZARD MACHINE
// ==============================================

export interface WizardStep {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  validate?: () => Promise<boolean>;
  skip?: boolean;
}

export function useFormWizard(steps: WizardStep[]) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const [isValidating, setIsValidating] = useState(false);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Go to next step
  const next = useCallback(async () => {
    if (isLastStep) return;

    // Validate current step
    if (currentStep.validate) {
      setIsValidating(true);
      const isValid = await currentStep.validate();
      setIsValidating(false);

      if (!isValid) return;
    }

    // Mark as completed
    setCompletedSteps((prev) => new Set(prev).add(currentStep.id));

    // Move to next step
    setCurrentStepIndex((prev) => prev + 1);
  }, [currentStepIndex, isLastStep, currentStep]);

  // Go to previous step
  const previous = useCallback(() => {
    if (isFirstStep) return;
    setCurrentStepIndex((prev) => prev - 1);
  }, [isFirstStep]);

  // Go to specific step
  const goTo = useCallback((stepId: string) => {
    const index = steps.findIndex((s) => s.id === stepId);
    if (index !== -1) {
      setCurrentStepIndex(index);
    }
  }, [steps]);

  // Update step data
  const updateStepData = useCallback((stepId: string, data: any) => {
    setStepData((prev) => ({
      ...prev,
      [stepId]: { ...(prev[stepId] || {}), ...data },
    }));
  }, []);

  // Get progress percentage
  const getProgress = useCallback((): number => {
    return ((currentStepIndex + 1) / steps.length) * 100;
  }, [currentStepIndex, steps.length]);

  // Reset wizard
  const reset = useCallback(() => {
    setCurrentStepIndex(0);
    setCompletedSteps(new Set());
    setStepData({});
  }, []);

  return {
    currentStep,
    currentStepIndex,
    completedSteps,
    stepData,
    isValidating,
    isFirstStep,
    isLastStep,
    next,
    previous,
    goTo,
    updateStepData,
    getProgress,
    reset,
  };
}

// ==============================================
// NOTIFICATION QUEUE MACHINE
// ==============================================

export type NotificationPriority = 'error' | 'warning' | 'info' | 'success';

export interface Notification {
  id: string;
  message: string;
  priority: NotificationPriority;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
  timestamp: number;
}

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 5000;

export function useNotificationQueue() {
  const [queue, setQueue] = useState<Notification[]>([]);
  const [visible, setVisible] = useState<Notification[]>([]);

  // Add notification to queue
  const add = useCallback(
    (
      notification: Omit<Notification, 'id' | 'timestamp'>
    ) => {
      const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        duration: notification.duration || DEFAULT_DURATION,
      };

      setQueue((prev) => {
        // Remove duplicates (same message)
        const filtered = prev.filter((n) => n.message !== notification.message);
        
        // Sort by priority
        const priorityOrder: Record<NotificationPriority, number> = {
          error: 4,
          warning: 3,
          success: 2,
          info: 1,
        };

        const sorted = [...filtered, newNotification].sort(
          (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
        );

        return sorted;
      });
    },
    []
  );

  // Remove notification
  const remove = useCallback((id: string) => {
    setQueue((prev) => prev.filter((n) => n.id !== id));
    setVisible((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Clear all notifications
  const clear = useCallback(() => {
    setQueue([]);
    setVisible([]);
  }, []);

  // Process queue
  useEffect(() => {
    if (visible.length < MAX_VISIBLE && queue.length > 0) {
      const nextNotification = queue[0];
      setVisible((prev) => [...prev, nextNotification]);
      setQueue((prev) => prev.slice(1));

      // Auto-dismiss
      if (nextNotification.duration) {
        setTimeout(() => {
          remove(nextNotification.id);
        }, nextNotification.duration);
      }
    }
  }, [queue, visible, remove]);

  return {
    visible,
    queue,
    add,
    remove,
    clear,
  };
}

// ==============================================
// EXPORTS
// ==============================================

export default {
  useTransactionMachine,
  useModalStack,
  useFormWizard,
  useNotificationQueue,
};
