// Search API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { hybridSearch } from '@/lib/elasticsearch/search';
import { queueSearchQuery } from '@/lib/services/background-collector';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, filters, limit, offset } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    console.log(`\n[Search API] Query: "${query}"`);

    // Queue query for background YouTube data collection
    // This will trigger collection every 10 unique searches
    queueSearchQuery(query.trim());

    const results = await hybridSearch({
      query: query.trim(),
      filters: filters || {},
      limit: limit || 20,
      offset: offset || 0,
    });

    console.log(`[Search API] Returning ${results.results.length} results\n`);

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('[Search API] Error:', error);

    return NextResponse.json(
      {
        error: 'Search failed',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
