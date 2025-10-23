import { NextRequest, NextResponse } from 'next/server';
import { analyzeOpportunity } from '@/lib/ai/opportunity-analyzer';
import type { SocialPost } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, posts } = body as { query: string; posts: SocialPost[] };

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json(
        { error: 'Posts array is required and must not be empty' },
        { status: 400 }
      );
    }

    console.log(`\n[Opportunity API] Analyzing opportunity for: "${query}"`);
    console.log(`[Opportunity API] Using ${posts.length} posts for analysis`);

    const report = await analyzeOpportunity(query, posts);

    console.log(`[Opportunity API] Analysis complete. Overall score: ${report.overallScore}\n`);

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('[Opportunity API] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to analyze opportunity',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
