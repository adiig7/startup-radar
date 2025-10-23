import { NextRequest, NextResponse } from 'next/server';
import { getAnalytics } from '@/lib/elasticsearch/analytics';
import type { SearchFilters } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, filters } = body as { query: string; filters?: SearchFilters };

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    console.log(`\n[Analytics API] Generating analytics for: "${query.substring(0, 80)}..."`);

    const analytics = await getAnalytics(query, filters);

    console.log(`[Analytics API] Analytics generated successfully\n`);

    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error('[Analytics API] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate analytics',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
