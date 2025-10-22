// Admin endpoint to trigger immediate collection (for demo purposes)

import { NextRequest, NextResponse } from 'next/server';
import { collectForQuery } from '@/lib/services/background-collector';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`[Admin] Triggering immediate collection for: "${query}"`);

    // Trigger collection immediately (doesn't wait for 10 searches)
    const posts = await collectForQuery(query);

    return NextResponse.json({
      success: true,
      message: `Collected and indexed ${posts.length} posts`,
      query,
      postsCollected: posts.length,
      platforms: {
        youtube: posts.filter(p => p.platform === 'youtube').length,
        reddit: posts.filter(p => p.platform === 'reddit').length,
        hackernews: posts.filter(p => p.platform === 'hackernews').length,
        producthunt: posts.filter(p => p.platform === 'producthunt').length,
      }
    });
  } catch (error: any) {
    console.error('[Admin] Collection error:', error);
    return NextResponse.json(
      {
        error: 'Collection failed',
        message: error.message
      },
      { status: 500 }
    );
  }
}
