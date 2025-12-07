// Keyboard shortcuts for power users

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;  // Cmd on Mac
  shift?: boolean;
  description: string;
  action: () => void;
}

let shortcuts: KeyboardShortcut[] = [];

export function registerShortcut(shortcut: KeyboardShortcut) {
  shortcuts.push(shortcut);
}

export function unregisterShortcut(key: string, modifiers: { ctrl?: boolean; meta?: boolean; shift?: boolean }) {
  shortcuts = shortcuts.filter(s => 
    !(s.key === key && 
      s.ctrl === modifiers.ctrl && 
      s.meta === modifiers.meta && 
      s.shift === modifiers.shift)
  );
}

export function clearAllShortcuts() {
  shortcuts = [];
}

export function getRegisteredShortcuts(): KeyboardShortcut[] {
  return [...shortcuts];
}

export function initKeyboardShortcuts() {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      // Exception: Allow Esc to close modals even when focused on input
      if (e.key !== 'Escape') {
        return;
      }
    }

    shortcuts.forEach(shortcut => {
      const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey;
      const metaMatch = shortcut.meta ? e.metaKey : !e.metaKey;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;

      if (
        e.key.toLowerCase() === shortcut.key.toLowerCase() &&
        ctrlMatch &&
        metaMatch &&
        shiftMatch
      ) {
        e.preventDefault();
        shortcut.action();
      }
    });
  };

  window.addEventListener('keydown', handleKeyDown);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}

// Get keyboard shortcut display string
export function getShortcutDisplay(shortcut: KeyboardShortcut): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const parts: string[] = [];

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push('⇧');
  }
  
  parts.push(shortcut.key.toUpperCase());

  return parts.join(' + ');
}

// Common shortcuts
export const COMMON_SHORTCUTS = {
  CLOSE_MODAL: { key: 'Escape', description: 'Close modal or go back' },
  COMMAND_PALETTE: { key: 'k', ctrl: true, meta: true, description: 'Open command palette' },
  SEARCH: { key: '/', description: 'Focus search' },
  SEND: { key: 's', ctrl: true, meta: true, description: 'Open send modal' },
  RECEIVE: { key: 'r', ctrl: true, meta: true, description: 'Open receive modal' },
  SWAP: { key: 'w', ctrl: true, meta: true, description: 'Open swap modal' },
  REFRESH: { key: 'r', shift: true, ctrl: true, meta: true, description: 'Refresh balances' },
  SETTINGS: { key: ',', ctrl: true, meta: true, description: 'Open settings' }
};
