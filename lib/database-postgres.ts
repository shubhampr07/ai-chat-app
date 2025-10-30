import { sql } from './db-postgres';
import { ChatSession, Message, Artifact } from '@/types/chat';

// User operations
export async function createUser(userId: string, username: string): Promise<void> {
  await sql`
    INSERT INTO users (id, username, created_at)
    VALUES (${userId}, ${username}, ${Date.now()})
  `;
}

export async function userExists(userId: string): Promise<boolean> {
  const result = await sql`SELECT id FROM users WHERE id = ${userId}`;
  return result.length > 0;
}

// Session operations
export async function getSessions(userId: string): Promise<ChatSession[]> {
  const sessions = await sql`
    SELECT id, title, created_at as "createdAt", updated_at as "updatedAt"
    FROM chat_sessions
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
  `;

  const sessionsWithMessages = await Promise.all(
    sessions.map(async (session) => ({
      id: session.id,
      title: session.title,
      createdAt: Number(session.createdAt),
      updatedAt: Number(session.updatedAt),
      messages: await getSessionMessages(session.id),
    }))
  );

  return sessionsWithMessages;
}

export async function getSession(sessionId: string): Promise<ChatSession | null> {
  const result = await sql`
    SELECT id, title, created_at as "createdAt", updated_at as "updatedAt"
    FROM chat_sessions
    WHERE id = ${sessionId}
  `;

  if (result.length === 0) return null;

  const session = result[0];
  return {
    id: session.id,
    title: session.title,
    createdAt: Number(session.createdAt),
    updatedAt: Number(session.updatedAt),
    messages: await getSessionMessages(session.id),
  };
}

export async function createSession(userId: string, sessionId: string, title: string = 'New Chat'): Promise<ChatSession> {
  const now = Date.now();

  await sql`
    INSERT INTO chat_sessions (id, user_id, title, created_at, updated_at)
    VALUES (${sessionId}, ${userId}, ${title}, ${now}, ${now})
  `;

  return {
    id: sessionId,
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateSessionTitle(sessionId: string, title: string): Promise<void> {
  await sql`
    UPDATE chat_sessions
    SET title = ${title}, updated_at = ${Date.now()}
    WHERE id = ${sessionId}
  `;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await sql`DELETE FROM chat_sessions WHERE id = ${sessionId}`;
}

export async function updateSessionTimestamp(sessionId: string): Promise<void> {
  await sql`
    UPDATE chat_sessions
    SET updated_at = ${Date.now()}
    WHERE id = ${sessionId}
  `;
}

// Message operations
export async function getSessionMessages(sessionId: string): Promise<Message[]> {
  const messages = await sql`
    SELECT id, role, content, timestamp, is_streaming as "isStreaming"
    FROM messages
    WHERE session_id = ${sessionId}
    ORDER BY timestamp ASC
  `;

  const messagesWithArtifacts = await Promise.all(
    messages.map(async (msg) => {
      const artifacts = await getMessageArtifacts(msg.id);
      return {
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: Number(msg.timestamp),
        isStreaming: Boolean(msg.isStreaming),
        ...(artifacts.length > 0 && { artifacts }),
      };
    })
  );

  return messagesWithArtifacts;
}

export async function addMessage(sessionId: string, message: Message): Promise<void> {
  await sql`
    INSERT INTO messages (id, session_id, role, content, timestamp, is_streaming)
    VALUES (${message.id}, ${sessionId}, ${message.role}, ${message.content}, ${message.timestamp}, ${message.isStreaming || false})
  `;

  if (message.artifacts && message.artifacts.length > 0) {
    for (const artifact of message.artifacts) {
      await sql`
        INSERT INTO artifacts (id, message_id, type, language, content, expanded)
        VALUES (${artifact.id}, ${message.id}, ${artifact.type}, ${artifact.language || null}, ${artifact.content}, ${artifact.expanded || false})
      `;
    }
  }

  await updateSessionTimestamp(sessionId);
}

export async function updateMessage(sessionId: string, messageId: string, updates: Partial<Message>): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.content !== undefined) {
    fields.push('content');
    values.push(updates.content);
  }

  if (updates.isStreaming !== undefined) {
    fields.push('is_streaming');
    values.push(updates.isStreaming);
  }

  if (fields.length === 0) return;

  // Build dynamic update query
  if (updates.content !== undefined && updates.isStreaming !== undefined) {
    await sql`
      UPDATE messages
      SET content = ${updates.content}, is_streaming = ${updates.isStreaming}
      WHERE id = ${messageId}
    `;
  } else if (updates.content !== undefined) {
    await sql`
      UPDATE messages
      SET content = ${updates.content}
      WHERE id = ${messageId}
    `;
  } else if (updates.isStreaming !== undefined) {
    await sql`
      UPDATE messages
      SET is_streaming = ${updates.isStreaming}
      WHERE id = ${messageId}
    `;
  }

  await updateSessionTimestamp(sessionId);
}

export async function deleteMessagesFromIndex(sessionId: string, fromIndex: number): Promise<void> {
  const messages = await sql`
    SELECT id FROM messages
    WHERE session_id = ${sessionId}
    ORDER BY timestamp ASC
  `;

  const messagesToDelete = messages.slice(fromIndex);

  if (messagesToDelete.length > 0) {
    for (const msg of messagesToDelete) {
      await sql`DELETE FROM messages WHERE id = ${msg.id}`;
    }
  }

  await updateSessionTimestamp(sessionId);
}

// Artifact operations
export async function getMessageArtifacts(messageId: string): Promise<Artifact[]> {
  const artifacts = await sql`
    SELECT id, type, language, content, expanded
    FROM artifacts
    WHERE message_id = ${messageId}
  `;

  return artifacts.map((artifact) => ({
    id: artifact.id,
    type: artifact.type as 'code' | 'markdown',
    content: artifact.content,
    ...(artifact.language && { language: artifact.language }),
    expanded: Boolean(artifact.expanded),
  }));
}

// Clear all data
export async function clearAllSessions(userId: string): Promise<void> {
  await sql`DELETE FROM chat_sessions WHERE user_id = ${userId}`;
}
