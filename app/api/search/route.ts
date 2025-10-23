import { NextRequest, NextResponse } from 'next/server';
import { hybridSearch } from '@/lib/elasticsearch/search';
import { collectForQuery } from '@/lib/services/background-collector';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError: any) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { query, filters, limit, offset, skipCollection } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!skipCollection) {
      collectForQuery(query.trim()).catch((error) => {
        // Silently handle background collection errors
      });
    }

    const results = await hybridSearch({
      query: query.trim(),
      filters: filters || {},
      limit: limit || 20,
      offset: offset || 0,
    });

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Search failed',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
