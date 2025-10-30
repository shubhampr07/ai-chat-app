'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatSession, Message, Artifact } from '@/types/chat';
import { storage } from '@/lib/storage';

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const isFirstRender = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize: Load user and sessions from database
  useEffect(() => {
    async function initializeUser() {
      try {
        // Get user from localStorage only (synchronous)
        const user = storage.getUser();

        if (user) {
          setUserId(user.id);
          setUsername(user.username);
          const dbSessions = await storage.getSessions(user.id);
          const storedActiveId = storage.getActiveSessionId();

          if (dbSessions.length > 0) {
            setSessions(dbSessions);
            setActiveSessionId(storedActiveId || dbSessions[0].id);
          } else {
            const newSession = createNewSession();
            await storage.createSession(user.id, newSession.id, newSession.title);
            setSessions([newSession]);
            setActiveSessionId(newSession.id);
          }
        }
      } catch (error) {
        console.error('Failed to initialize user:', error);
      } finally {
        setIsLoading(false);
      }
    }

    initializeUser();
  }, []);

  // Save active session ID to localStorage
  useEffect(() => {
    if (!activeSessionId) return;
    storage.setActiveSessionId(activeSessionId);
  }, [activeSessionId]);

  // Custom method to reload session from database (called manually when needed)
  const reloadSession = useCallback(async (sessionId: string) => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/db/sessions?userId=${userId}&sessionId=${sessionId}`);
      const data = await response.json();
      if (data.session) {
        setSessions(prev => {
          const newSessions = prev.map(s =>
            s.id === sessionId ? { ...data.session } : s
          );
          // Sort by updatedAt DESC (most recent first)
          return newSessions.sort((a, b) => b.updatedAt - a.updatedAt);
        });
      }
    } catch (error) {
      console.error('Failed to load session data:', error);
    }
  }, [userId]);

  const createNewSession = useCallback((): ChatSession => {
    return {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }, []);

  const addSession = useCallback(async () => {
    if (!userId) return;
    const newSession = createNewSession();
    await storage.createSession(userId, newSession.id, newSession.title);
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    return newSession;
  }, [createNewSession, userId]);

  const deleteSession = useCallback(async (sessionId: string) => {
    await storage.deleteSession(sessionId);
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      if (filtered.length === 0 && userId) {
        const newSession = createNewSession();
        storage.createSession(userId, newSession.id, newSession.title);
        setActiveSessionId(newSession.id);
        return [newSession];
      }
      if (sessionId === activeSessionId) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeSessionId, createNewSession, userId]);

  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    await storage.updateSessionTitle(sessionId, title);
    setSessions(prev =>
      prev.map(s => s.id === sessionId ? { ...s, title, updatedAt: Date.now() } : s)
    );
  }, []);

  const addMessage = useCallback(async (sessionId: string, message: Message) => {
    await storage.addMessage(sessionId, message);

    // Update state immediately with the new message and title
    setSessions(prev => {
      const updatedSessions = prev.map(s => {
        if (s.id !== sessionId) return s;

        const messages = [...s.messages, message];

        // Set title to first user message (like ChatGPT)
        let title = s.title;
        console.log('Current session title:', s.title, 'Message role:', message.role, 'Messages count:', s.messages.length);
        if (s.title === 'New Chat' && message.role === 'user') {
          title = message.content.length > 60
            ? message.content.slice(0, 60).trim() + '...'
            : message.content.trim();

          console.log('Updating title to:', title);

          // Update title in database asynchronously (don't wait)
          storage.updateSessionTitle(sessionId, title).catch(err =>
            console.error('Failed to update session title:', err)
          );
        }

        return {
          ...s,
          messages,
          title,
          updatedAt: Date.now(),
        };
      });

      // Sort by updatedAt DESC (most recent first) and return new array
      return updatedSessions.sort((a, b) => b.updatedAt - a.updatedAt);
    });
  }, []);

  const updateMessage = useCallback(async (sessionId: string, messageId: string, updates: Partial<Message>) => {
    // Debounce database updates during streaming
    const shouldUpdateDB = updates.isStreaming === false || updates.content;
    if (shouldUpdateDB) {
      await storage.updateMessage(sessionId, messageId, updates);
    }

    setSessions(prev => {
      const updatedSessions = prev.map(s => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          messages: s.messages.map(m =>
            m.id === messageId ? { ...m, ...updates } : m
          ),
          updatedAt: Date.now(),
        };
      });

      // Sort by updatedAt DESC (most recent first) and return new array
      return updatedSessions.sort((a, b) => b.updatedAt - a.updatedAt);
    });
  }, []);

  const streamMessage = useCallback(async (sessionId: string, prompt: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };

    addMessage(sessionId, userMessage);

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    addMessage(sessionId, assistantMessage);

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let lastUpdateTime = Date.now();
      const UPDATE_INTERVAL = 50; // Update UI every 50ms (20 fps)

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;

          // Throttle UI updates to avoid overwhelming React
          const now = Date.now();
          if (now - lastUpdateTime >= UPDATE_INTERVAL) {
            updateMessage(sessionId, assistantMessage.id, {
              content: accumulatedContent,
            });
            lastUpdateTime = now;
          }
        }

        // Final update with complete content
        updateMessage(sessionId, assistantMessage.id, {
          content: accumulatedContent,
        });
      }

      updateMessage(sessionId, assistantMessage.id, {
        isStreaming: false,
      });
    } catch (error: any) {
      // Handle abort separately
      if (error.name === 'AbortError') {
        console.log('Stream aborted by user');
        updateMessage(sessionId, assistantMessage.id, {
          isStreaming: false,
        });
      } else {
        console.error('Error streaming message:', error);
        updateMessage(sessionId, assistantMessage.id, {
          content: 'Sorry, there was an error processing your request.',
          isStreaming: false,
        });
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [addMessage, updateMessage]);

  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const regenerateMessage = useCallback(async (sessionId: string, messageId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const messageIndex = session.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || messageIndex === 0) return;

    const previousUserMessage = session.messages[messageIndex - 1];
    if (previousUserMessage.role !== 'user') return;

    await storage.deleteMessagesFromIndex(sessionId, messageIndex);

    setSessions(prev =>
      prev.map(s => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          messages: s.messages.slice(0, messageIndex),
        };
      })
    );

    await streamMessage(sessionId, previousUserMessage.content);
  }, [sessions, streamMessage]);

  const editPrompt = useCallback(async (sessionId: string, messageId: string, newPrompt: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const messageIndex = session.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    await storage.deleteMessagesFromIndex(sessionId, messageIndex);

    setSessions(prev =>
      prev.map(s => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          messages: s.messages.slice(0, messageIndex),
        };
      })
    );

    await streamMessage(sessionId, newPrompt);
  }, [sessions, streamMessage]);

  const clearHistory = useCallback(async () => {
    if (!userId) return;
    await storage.clearAll(userId);
    const newSession = createNewSession();
    await storage.createSession(userId, newSession.id, newSession.title);
    setSessions([newSession]);
    setActiveSessionId(newSession.id);
  }, [createNewSession, userId]);

  const updateMessageFollowUps = useCallback(async (sessionId: string, messageId: string, followUpQuestions: string[]) => {
    await updateMessage(sessionId, messageId, { followUpQuestions });
  }, [updateMessage]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  // Wrapper for setActiveSessionId that reloads session data only when switching to different session
  const switchSession = useCallback((sessionId: string) => {
    // Check if we're actually switching to a different session
    if (activeSessionId !== sessionId) {
      setActiveSessionId(sessionId);
      // Small delay to ensure any pending DB writes complete
      setTimeout(() => reloadSession(sessionId), 100);
    }
  }, [activeSessionId, reloadSession]);

  // Method to set user (for first-time setup)
  const setupUser = useCallback(async (username: string) => {
    const user = await storage.setUser(username);
    if (user) {
      setUserId(user.id);
      const newSession = createNewSession();
      await storage.createSession(user.id, newSession.id, newSession.title);
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
      setIsLoading(false);
    }
  }, [createNewSession]);

  return {
    sessions,
    activeSession,
    activeSessionId,
    userId,
    username,
    isLoading,
    setActiveSessionId: switchSession,
    addSession,
    deleteSession,
    updateSessionTitle,
    streamMessage,
    stopGenerating,
    regenerateMessage,
    editPrompt,
    clearHistory,
    setupUser,
    updateMessageFollowUps,
  };
}

async function mockStreamResponse(prompt: string): Promise<{ content: string; artifacts?: Artifact[] }> {
  const hasCodeRequest = /code|function|implement|example|snippet/i.test(prompt);

  let content = `This is a mock response to your question: "${prompt.slice(0, 50)}..."\n\n`;

  if (hasCodeRequest) {
    content += `Here's a detailed explanation of how to approach this:\n\n1. First, we need to understand the requirements\n2. Then, we can design the solution\n3. Finally, we implement and test\n\nLet me show you an example implementation that demonstrates the core concepts. This solution uses modern best practices and is fully type-safe.`;

    return {
      content,
      artifacts: [{
        id: crypto.randomUUID(),
        type: 'code',
        language: 'typescript',
        content: `// Example implementation\nfunction example(param: string): string {\n  // Process the parameter\n  const result = param.toUpperCase();\n  \n  // Return the processed result\n  return result;\n}\n\n// Usage example\nconst output = example("hello world");\nconsole.log(output); // "HELLO WORLD"`,
      }],
    };
  }

  content += `This is a comprehensive answer that covers multiple aspects:\n\n• Point one explains the fundamental concept\n• Point two provides additional context\n• Point three offers practical insights\n\nThe key takeaway is that understanding the underlying principles is crucial for making informed decisions. This approach ensures both theoretical understanding and practical application.`;

  return { content };
}
