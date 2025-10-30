import { NextRequest, NextResponse } from 'next/server';
import { getSessions, createSession, deleteSession, updateSessionTitle, getSession } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (sessionId) {
      const session = getSession(sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      return NextResponse.json({ session });
    }

    const sessions = getSessions(userId);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error getting sessions:', error);
    return NextResponse.json({ error: 'Failed to get sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId, title } = body;

    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'User ID and session ID are required' }, { status: 400 });
    }

    const session = createSession(userId, sessionId, title);
    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, title } = body;

    if (!sessionId || !title) {
      return NextResponse.json({ error: 'Session ID and title are required' }, { status: 400 });
    }

    updateSessionTitle(sessionId, title);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    deleteSession(sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
