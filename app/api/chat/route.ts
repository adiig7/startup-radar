// Chat API endpoint with Vertex AI grounding

import { NextRequest, NextResponse } from 'next/server';
import { sendGroundedMessage } from '@/lib/ai/grounding';
import type { ConversationContext } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, searchResults, context } = body as {
      message: string;
      searchResults?: any[];
      context?: ConversationContext;
    };

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
    console.log(`[Chat API] Using ${searchResults?.length || 0} pre-fetched results`);

    const { stream, citations } = await sendGroundedMessage(message, context, searchResults);

    // Create a ReadableStream to send data to the client
    const encoder = new TextEncoder();
    let fullContent = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              fullContent += text;
              // Send chunk to client
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: text, done: false })}\n\n`)
              );
            }
          }

          // Send final message with citations
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                fullContent,
                citations,
                timestamp: new Date().toISOString(),
              })}\n\n`
            )
          );

          controller.close();
          console.log(`[Chat API] Streaming completed (${fullContent.length} chars)\n`);
        } catch (error) {
          console.error('[Chat API] Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
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
