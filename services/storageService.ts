import { User, HistoryRecord, GeneratedContent } from "../types";

const USERS_KEY = 'kazakh_edugen_users';
const SESSION_KEY = 'kazakh_edugen_session';

// --- IndexedDB Configuration for History ---
const DB_NAME = 'KazakhEduGenDB';
const DB_VERSION = 1;
const HISTORY_STORE = 'history';

/**
 * Opens the IndexedDB database.
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB is not supported"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        const store = db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
        // Create an index to search by userId
        store.createIndex('userId', 'userId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// --- History API (Async - using IndexedDB) ---

export const saveHistory = async (userId: string, content: GeneratedContent): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(HISTORY_STORE, 'readwrite');
    const store = tx.objectStore(HISTORY_STORE);

    // Clone content to ensure we store a snapshot
    const contentToSave: GeneratedContent = JSON.parse(JSON.stringify(content));

    const record: HistoryRecord = {
      id: Date.now().toString(),
      userId,
      topic: content.topic,
      data: contentToSave,
      createdAt: new Date().toISOString()
    };

    store.add(record);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("Failed to save history to IndexedDB:", error);
    throw error;
  }
};

export const getHistory = async (userId: string): Promise<HistoryRecord[]> => {
  try {
    const db = await openDB();
    const tx = db.transaction(HISTORY_STORE, 'readonly');
    const store = tx.objectStore(HISTORY_STORE);
    const index = store.index('userId');
    const request = index.getAll(IDBKeyRange.only(userId));

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const results = request.result as HistoryRecord[];
        // Sort by date descending (newest first)
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to fetch history:", error);
    return [];
  }
};

// --- Auth Helpers (Sync - using localStorage) ---

export const getCurrentUser = (): User | null => {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const login = (email: string): User | null => {
  try {
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    }
  } catch (e) {
    console.error("Login failed", e);
  }
  return null;
};

export const signup = (name: string, email: string): User => {
  try {
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("Бұл email тіркелген");
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      isFirstLogin: true
    };

    users.push(newUser);
    
    // Save to users list
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    // Set current session
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    
    return newUser;
  } catch (e: any) {
    // Check for localStorage quota
    if (e.name === 'QuotaExceededError') {
       throw new Error("Жад толып кетті. Құрылғының жадын тазалаңыз.");
    }
    throw new Error(e.message || "Тіркелу қатесі");
  }
};

export const markOnboardingSeen = (userId: string) => {
  try {
    const usersStr = localStorage.getItem(USERS_KEY);
    let users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    users = users.map(u => {
      if (u.id === userId) {
        const updated = { ...u, isFirstLogin: false };
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id === userId) {
          localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
        }
        return updated;
      }
      return u;
    });
    
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn("Failed to mark onboarding seen", e);
  }
};