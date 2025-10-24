import { NextRequest, NextResponse } from 'next/server';
import { hybridSearch } from '@/lib/elasticsearch/search';
import { collectForQuery } from '@/lib/services/background-collector';

export const dynamic = 'force-dynamic';

export const POST = async (req: NextRequest) => {
  try {
    let body;
    try {
      body = await req.json();
    } catch (parseError: any) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { query, filters, limit, offset, skipCollection, useReranking } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!skipCollection) {
      collectForQuery(query.trim()).catch((error) => {console.error(error)});
    }

    const results = await hybridSearch({
      query: query.trim(),
      filters: filters || {},
      limit: limit || 20,
      offset: offset || 0,
      useReranking: useReranking === true
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Search API Error:', error.message);
    return NextResponse.json(
      {
        error: 'Search failed',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
