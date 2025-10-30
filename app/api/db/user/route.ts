import { NextRequest, NextResponse } from 'next/server';
import { createUser, userExists, clearAllSessions } from '@/lib/database-postgres';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, username } = body;

    if (!userId || !username || username.trim().length === 0) {
      return NextResponse.json({ error: 'User ID and username are required' }, { status: 400 });
    }

    // Only create user if doesn't exist (for foreign key constraint)
    if (!(await userExists(userId))) {
      await createUser(userId, username.trim());
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await clearAllSessions(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing sessions:', error);
    return NextResponse.json({ error: 'Failed to clear sessions' }, { status: 500 });
  }
}
