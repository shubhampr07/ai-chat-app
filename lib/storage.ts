import { ChatSession, Message } from '@/types/chat';

const USER_KEY = 'chat-user-data';
const ACTIVE_SESSION_KEY = 'active-session-id';

// User operations
export const storage = {
  // Get user from localStorage only (device-specific)
  getUser: (): { id: string; username: string } | null => {
    if (typeof window === 'undefined') return null;
    try {
      const userData = localStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },

  // Create user with UUID and store in localStorage
  setUser: async (username: string): Promise<{ id: string; username: string } | null> => {
    if (typeof window === 'undefined') return null;
    try {
      // Generate UUID for this device
      const userId = crypto.randomUUID();
      const user = { id: userId, username };

      // Store in localStorage
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      // Ensure user exists in database for foreign key constraints
      await fetch('/api/db/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, username }),
      });

      return user;
    } catch (error) {
      console.error('Failed to set user:', error);
      return null;
    }
  },

  // Get all sessions for user
  getSessions: async (userId: string): Promise<ChatSession[]> => {
    if (typeof window === 'undefined') return [];
    try {
      const response = await fetch(`/api/db/sessions?userId=${userId}`);
      const data = await response.json();
      return data.sessions || [];
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }
  },

  // Create new session
  createSession: async (userId: string, sessionId: string, title: string = 'New Chat'): Promise<ChatSession | null> => {
    if (typeof window === 'undefined') return null;
    try {
      const response = await fetch('/api/db/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId, title }),
      });
      const data = await response.json();
      return data.session;
    } catch (error) {
      console.error('Failed to create session:', error);
      return null;
    }
  },

  // Update session title
  updateSessionTitle: async (sessionId: string, title: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
      await fetch('/api/db/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, title }),
      });
    } catch (error) {
      console.error('Failed to update session title:', error);
    }
  },

  // Delete session
  deleteSession: async (sessionId: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
      await fetch(`/api/db/sessions?sessionId=${sessionId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  },

  // Add message to session
  addMessage: async (sessionId: string, message: Message): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
      await fetch('/api/db/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message }),
      });
    } catch (error) {
      console.error('Failed to add message:', error);
    }
  },

  // Update message
  updateMessage: async (sessionId: string, messageId: string, updates: Partial<Message>): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
      await fetch('/api/db/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, messageId, updates }),
      });
    } catch (error) {
      console.error('Failed to update message:', error);
    }
  },

  // Delete messages from index
  deleteMessagesFromIndex: async (sessionId: string, fromIndex: number): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
      await fetch(`/api/db/messages?sessionId=${sessionId}&fromIndex=${fromIndex}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete messages:', error);
    }
  },

  // Get/Set active session ID (stored in localStorage for quick access)
  getActiveSessionId: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACTIVE_SESSION_KEY);
  },

  setActiveSessionId: (id: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACTIVE_SESSION_KEY, id);
  },

  // Clear all sessions for user
  clearAll: async (userId: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
      await fetch(`/api/db/user?userId=${userId}`, {
        method: 'DELETE',
      });
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear all sessions:', error);
    }
  },
};
