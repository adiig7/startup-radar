import { NextRequest, NextResponse } from 'next/server';
import { sendGroundedMessage } from '@/lib/ai/grounding';
import type { ConversationContext } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { message, searchResults, context } = body as {
      message: string;
      searchResults?: any[];
      context?: ConversationContext;
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: 'Message is too long (max 1000 characters)' }, { status: 400 });
    }

    const { stream, citations } = await sendGroundedMessage(message, context, searchResults);

    const encoder = new TextEncoder();
    let fullContent = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              fullContent += text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: text, done: false })}\n\n`)
              );
            }
          }

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
        } catch (error) {
          console.error(`Chat API streaming error: ${error}`);
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
    console.error(`Chat API error: ${error}`);

    return NextResponse.json(
      {
        error: 'Failed to generate response',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
