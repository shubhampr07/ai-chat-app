/**
 * Database Initialization Script for PostgreSQL (Neon)
 *
 * Run this script once after setting up your Neon database to create all necessary tables.
 *
 * Usage:
 *   npx tsx scripts/init-db.ts
 */

import { config } from 'dotenv';
import { initializeDatabase } from '../lib/db-postgres';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function main() {
  console.log('🔧 Initializing PostgreSQL database...');

  try {
    await initializeDatabase();
    console.log('✅ Database initialized successfully!');
    console.log('');
    console.log('Tables created:');
    console.log('  - users');
    console.log('  - chat_sessions');
    console.log('  - messages');
    console.log('  - artifacts');
    console.log('');
    console.log('Indexes created:');
    console.log('  - idx_chat_sessions_user_id');
    console.log('  - idx_messages_session_id');
    console.log('  - idx_artifacts_message_id');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

main();
