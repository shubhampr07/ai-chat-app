import { NextRequest, NextResponse } from 'next/server';
import { addMessage, updateMessage, deleteMessagesFromIndex, getSessionMessages } from '@/lib/database-postgres';
import { Message } from '@/types/chat';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const messages = await getSessionMessages(sessionId);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error getting messages:', error);
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message } = body as { sessionId: string; message: Message };

    if (!sessionId || !message) {
      return NextResponse.json({ error: 'Session ID and message are required' }, { status: 400 });
    }

    await addMessage(sessionId, message);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, messageId, updates } = body;

    if (!sessionId || !messageId || !updates) {
      return NextResponse.json({ error: 'Session ID, message ID, and updates are required' }, { status: 400 });
    }

    await updateMessage(sessionId, messageId, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const fromIndex = searchParams.get('fromIndex');

    if (!sessionId || fromIndex === null) {
      return NextResponse.json({ error: 'Session ID and fromIndex are required' }, { status: 400 });
    }

    await deleteMessagesFromIndex(sessionId, parseInt(fromIndex));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting messages:', error);
    return NextResponse.json({ error: 'Failed to delete messages' }, { status: 500 });
  }
}
