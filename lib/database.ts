import db from './db';
import { ChatSession, Message, Artifact } from '@/types/chat';

// User operations
export function createUser(userId: string, username: string): void {
  db.prepare('INSERT INTO users (id, username, created_at) VALUES (?, ?, ?)').run(userId, username, Date.now());
}

export function userExists(userId: string): boolean {
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as { id: string } | undefined;
  return !!user;
}

// Session operations
export function getSessions(userId: string): ChatSession[] {
  const sessions = db.prepare(`
    SELECT id, title, created_at as createdAt, updated_at as updatedAt
    FROM chat_sessions
    WHERE user_id = ?
    ORDER BY updated_at DESC
  `).all(userId) as Array<{ id: string; title: string; createdAt: number; updatedAt: number }>;

  return sessions.map(session => ({
    ...session,
    messages: getSessionMessages(session.id),
  }));
}

export function getSession(sessionId: string): ChatSession | null {
  const session = db.prepare(`
    SELECT id, title, created_at as createdAt, updated_at as updatedAt
    FROM chat_sessions
    WHERE id = ?
  `).get(sessionId) as { id: string; title: string; createdAt: number; updatedAt: number } | undefined;

  if (!session) return null;

  return {
    ...session,
    messages: getSessionMessages(session.id),
  };
}

export function createSession(userId: string, sessionId: string, title: string = 'New Chat'): ChatSession {
  const now = Date.now();

  db.prepare(`
    INSERT INTO chat_sessions (id, user_id, title, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(sessionId, userId, title, now, now);

  return {
    id: sessionId,
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function updateSessionTitle(sessionId: string, title: string): void {
  db.prepare(`
    UPDATE chat_sessions
    SET title = ?, updated_at = ?
    WHERE id = ?
  `).run(title, Date.now(), sessionId);
}

export function deleteSession(sessionId: string): void {
  db.prepare('DELETE FROM chat_sessions WHERE id = ?').run(sessionId);
}

export function updateSessionTimestamp(sessionId: string): void {
  db.prepare(`
    UPDATE chat_sessions
    SET updated_at = ?
    WHERE id = ?
  `).run(Date.now(), sessionId);
}

// Message operations
export function getSessionMessages(sessionId: string): Message[] {
  const messages = db.prepare(`
    SELECT id, role, content, timestamp, is_streaming as isStreaming
    FROM messages
    WHERE session_id = ?
    ORDER BY timestamp ASC
  `).all(sessionId) as Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: number; isStreaming: number }>;

  return messages.map(msg => {
    const artifacts = getMessageArtifacts(msg.id);
    return {
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      isStreaming: Boolean(msg.isStreaming),
      ...(artifacts.length > 0 && { artifacts }),
    };
  });
}

export function addMessage(sessionId: string, message: Message): void {
  db.prepare(`
    INSERT INTO messages (id, session_id, role, content, timestamp, is_streaming)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    message.id,
    sessionId,
    message.role,
    message.content,
    message.timestamp,
    message.isStreaming ? 1 : 0
  );

  if (message.artifacts && message.artifacts.length > 0) {
    const insertArtifact = db.prepare(`
      INSERT INTO artifacts (id, message_id, type, language, content, expanded)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const artifact of message.artifacts) {
      insertArtifact.run(
        artifact.id,
        message.id,
        artifact.type,
        artifact.language || null,
        artifact.content,
        artifact.expanded ? 1 : 0
      );
    }
  }

  updateSessionTimestamp(sessionId);
}

export function updateMessage(sessionId: string, messageId: string, updates: Partial<Message>): void {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content);
  }

  if (updates.isStreaming !== undefined) {
    fields.push('is_streaming = ?');
    values.push(updates.isStreaming ? 1 : 0);
  }

  if (fields.length === 0) return;

  values.push(messageId);

  db.prepare(`
    UPDATE messages
    SET ${fields.join(', ')}
    WHERE id = ?
  `).run(...values);

  updateSessionTimestamp(sessionId);
}

export function deleteMessagesFromIndex(sessionId: string, fromIndex: number): void {
  const messages = db.prepare(`
    SELECT id FROM messages
    WHERE session_id = ?
    ORDER BY timestamp ASC
  `).all(sessionId) as Array<{ id: string }>;

  const messagesToDelete = messages.slice(fromIndex);

  if (messagesToDelete.length > 0) {
    const placeholders = messagesToDelete.map(() => '?').join(',');
    const ids = messagesToDelete.map(m => m.id);
    db.prepare(`DELETE FROM messages WHERE id IN (${placeholders})`).run(...ids);
  }

  updateSessionTimestamp(sessionId);
}

// Artifact operations
export function getMessageArtifacts(messageId: string): Artifact[] {
  const artifacts = db.prepare(`
    SELECT id, type, language, content, expanded
    FROM artifacts
    WHERE message_id = ?
  `).all(messageId) as Array<{ id: string; type: 'code' | 'markdown'; language: string | null; content: string; expanded: number }>;

  return artifacts.map(artifact => ({
    id: artifact.id,
    type: artifact.type,
    content: artifact.content,
    ...(artifact.language && { language: artifact.language }),
    expanded: Boolean(artifact.expanded),
  }));
}

// Clear all data
export function clearAllSessions(userId: string): void {
  db.prepare('DELETE FROM chat_sessions WHERE user_id = ?').run(userId);
}
