// Chat API endpoint with Vertex AI grounding

import { NextRequest, NextResponse } from 'next/server';
import { sendGroundedMessage } from '@/lib/ai/grounding';
import type { ConversationContext } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body as { message: string; context?: ConversationContext };

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: 'Message is too long (max 1000 characters)' }, { status: 400 });
    }

    console.log(`\n[Chat API] New message: "${message.substring(0, 50)}..."`);

    // Send grounded message to Vertex AI
    const response = await sendGroundedMessage(message, context);

    console.log(`[Chat API] Response generated\n`);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[Chat API] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate response',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
