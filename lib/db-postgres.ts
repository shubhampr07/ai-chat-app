import { neon } from '@neondatabase/serverless';

// Lazy-load SQL client to allow dotenv to load first
let _sql: ReturnType<typeof neon> | null = null;

function getSQL() {
  if (!_sql) {
    const DATABASE_URL = process.env.DATABASE_URL;

    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    _sql = neon(DATABASE_URL);
  }
  return _sql;
}

// Export sql function that wraps the lazy-loaded client
export function sql(strings: TemplateStringsArray, ...values: any[]) {
  return getSQL()(strings, ...values);
}

// Initialize PostgreSQL database schema
export async function initializeDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      created_at BIGINT NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      timestamp BIGINT NOT NULL,
      is_streaming BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('code', 'markdown')),
      language TEXT,
      content TEXT NOT NULL,
      expanded BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE
    );
  `;

  // Create indexes
  await sql`
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions (user_id);
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages (session_id);
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_artifacts_message_id ON artifacts (message_id);
  `;
}
