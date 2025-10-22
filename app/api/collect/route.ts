import { NextRequest, NextResponse } from 'next/server';
import { collectForQuery, getQueueStatus } from '@/lib/services/background-collector';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    console.log(`\n[Collect API] Triggering immediate collection for: "${query}"`);

    const posts = await collectForQuery(query.trim());

    return NextResponse.json({
      success: true,
      message: `Started collection for "${query}"`,
      collected: posts.length,
      posts: posts.map((p) => ({
        id: p.id,
        title: p.title,
        url: p.url,
      })),
    });
  } catch (error: any) {
    console.error('[Collect API] Error:', error);

    return NextResponse.json(
      {
        error: 'Collection failed',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const status = getQueueStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('[Collect API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get queue status' },
      { status: 500 }
    );
  }
}
