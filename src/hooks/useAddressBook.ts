/**
 * useAddressBook Hook
 * Real API integration for address book contacts
 * Stores contacts locally and syncs with backend
 */

import { useState, useEffect, useCallback } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://paradexx-production.up.railway.app';

export interface Contact {
  id: string;
  name: string;
  address: string;
  ensName?: string;
  category?: 'personal' | 'exchange' | 'contract' | 'favorite';
  notes?: string;
  addedAt: number;
  lastUsed?: number;
  avatar?: string;
  verified?: boolean;
}

interface UseAddressBookResult {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  addContact: (contact: Omit<Contact, 'id' | 'addedAt'>) => Promise<Contact | null>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<boolean>;
  deleteContact: (id: string) => Promise<boolean>;
  markAsUsed: (id: string) => void;
  resolveENS: (ensName: string) => Promise<string | null>;
  lookupENS: (address: string) => Promise<string | null>;
  refresh: () => Promise<void>;
}

const STORAGE_KEY = 'paradex_address_book';

// Resolve ENS name to address
async function resolveENSName(ensName: string): Promise<string | null> {
  try {
    // Try backend API first
    const response = await fetch(`${API_URL}/api/ens/resolve?name=${encodeURIComponent(ensName)}`);
    if (response.ok) {
      const data = await response.json();
      if (data.address) return data.address;
    }

    // Try public ENS API
    const publicResponse = await fetch(`https://api.ensideas.com/ens/resolve/${ensName}`);
    if (publicResponse.ok) {
      const data = await publicResponse.json();
      if (data.address) return data.address;
    }
  } catch (err) {
    console.error('Error resolving ENS:', err);
  }
  return null;
}

// Lookup ENS name from address
async function lookupENSNameFromAddress(address: string): Promise<string | null> {
  try {
    // Try backend API first
    const response = await fetch(`${API_URL}/api/ens/lookup?address=${encodeURIComponent(address)}`);
    if (response.ok) {
      const data = await response.json();
      if (data.ensName) return data.ensName;
    }

    // Try public ENS API
    const publicResponse = await fetch(`https://api.ensideas.com/ens/resolve/${address}`);
    if (publicResponse.ok) {
      const data = await publicResponse.json();
      if (data.name) return data.name;
    }
  } catch (err) {
    console.error('Error looking up ENS:', err);
  }
  return null;
}

// Fetch contacts from backend
async function fetchFromBackend(): Promise<Contact[]> {
  try {
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/api/address-book`, { headers });
    
    if (response.ok) {
      const data = await response.json();
      return data.contacts || data || [];
    }
  } catch (err) {
    console.error('Error fetching contacts from backend:', err);
  }
  return [];
}

// Save contact to backend
async function saveToBackend(contact: Contact): Promise<boolean> {
  try {
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/api/address-book`, {
      method: 'POST',
      headers,
      body: JSON.stringify(contact),
    });
    
    return response.ok;
  } catch (err) {
    console.error('Error saving contact to backend:', err);
    return false;
  }
}

// Delete contact from backend
async function deleteFromBackend(id: string): Promise<boolean> {
  try {
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/api/address-book/${id}`, {
      method: 'DELETE',
      headers,
    });
    
    return response.ok;
  } catch (err) {
    console.error('Error deleting contact from backend:', err);
    return false;
  }
}

// Load contacts from localStorage
function loadFromLocalStorage(): Contact[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error('Error loading contacts from localStorage:', err);
  }
  return [];
}

// Save contacts to localStorage
function saveToLocalStorage(contacts: Contact[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch (err) {
    console.error('Error saving contacts to localStorage:', err);
  }
}

export function useAddressBook(): UseAddressBookResult {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to load from backend first
      let data = await fetchFromBackend();
      
      // Merge with local storage data
      const localData = loadFromLocalStorage();
      
      if (data.length === 0 && localData.length > 0) {
        // Use local data if backend is empty
        data = localData;
      } else if (data.length > 0 && localData.length > 0) {
        // Merge: prefer backend data but add any local-only contacts
        const backendIds = new Set(data.map(c => c.id));
        const localOnlyContacts = localData.filter(c => !backendIds.has(c.id));
        data = [...data, ...localOnlyContacts];
      }
      
      // If still empty, use default contacts
      if (data.length === 0) {
        data = getDefaultContacts();
      }
      
      setContacts(data);
      saveToLocalStorage(data);
    } catch (err) {
      console.error('Error loading contacts:', err);
      setError('Failed to load contacts');
      
      // Fallback to localStorage
      const localData = loadFromLocalStorage();
      setContacts(localData.length > 0 ? localData : getDefaultContacts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Add new contact
  const addContact = useCallback(async (contactData: Omit<Contact, 'id' | 'addedAt'>): Promise<Contact | null> => {
    const newContact: Contact = {
      ...contactData,
      id: crypto.randomUUID(),
      addedAt: Date.now(),
    };

    // Try to resolve ENS if address looks like ENS name
    if (contactData.address.endsWith('.eth') && !contactData.ensName) {
      const resolved = await resolveENSName(contactData.address);
      if (resolved) {
        newContact.ensName = contactData.address;
        newContact.address = resolved;
      }
    }

    // Update state
    setContacts(prev => {
      const updated = [...prev, newContact];
      saveToLocalStorage(updated);
      return updated;
    });

    // Try to save to backend
    await saveToBackend(newContact);

    return newContact;
  }, []);

  // Update existing contact
  const updateContact = useCallback(async (id: string, updates: Partial<Contact>): Promise<boolean> => {
    setContacts(prev => {
      const updated = prev.map(c => 
        c.id === id ? { ...c, ...updates } : c
      );
      saveToLocalStorage(updated);
      return updated;
    });

    // Sync to backend
    const contact = contacts.find(c => c.id === id);
    if (contact) {
      await saveToBackend({ ...contact, ...updates });
    }

    return true;
  }, [contacts]);

  // Delete contact
  const deleteContact = useCallback(async (id: string): Promise<boolean> => {
    setContacts(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveToLocalStorage(updated);
      return updated;
    });

    // Delete from backend
    await deleteFromBackend(id);

    return true;
  }, []);

  // Mark contact as recently used
  const markAsUsed = useCallback((id: string) => {
    setContacts(prev => {
      const updated = prev.map(c =>
        c.id === id ? { ...c, lastUsed: Date.now() } : c
      );
      saveToLocalStorage(updated);
      return updated;
    });
  }, []);

  // Resolve ENS name
  const resolveENS = useCallback(async (ensName: string): Promise<string | null> => {
    return resolveENSName(ensName);
  }, []);

  // Lookup ENS from address
  const lookupENS = useCallback(async (address: string): Promise<string | null> => {
    return lookupENSNameFromAddress(address);
  }, []);

  return {
    contacts,
    loading,
    error,
    addContact,
    updateContact,
    deleteContact,
    markAsUsed,
    resolveENS,
    lookupENS,
    refresh,
  };
}

// Default contacts for demo
function getDefaultContacts(): Contact[] {
  return [
    {
      id: '1',
      name: "Mom's Wallet",
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8f3a',
      category: 'personal',
      addedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      lastUsed: Date.now() - 2 * 24 * 60 * 60 * 1000,
    },
    {
      id: '2',
      name: 'Binance Deposit',
      address: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
      category: 'exchange',
      notes: "Don't forget memo!",
      addedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
      lastUsed: Date.now() - 7 * 24 * 60 * 60 * 1000,
    },
    {
      id: '3',
      name: 'vitalik.eth',
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      ensName: 'vitalik.eth',
      category: 'favorite',
      addedAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
      verified: true,
    },
  ];
}

export default useAddressBook;
