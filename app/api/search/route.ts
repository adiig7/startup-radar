// Search API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { hybridSearch } from '@/lib/elasticsearch/search';
import { collectForQuery } from '@/lib/services/background-collector';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('SearchAPI');

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    logger.info('Search request received');

    // Parse request body
    let body;
    try {
      body = await request.json();
      logger.debug('Request body parsed', { body });
    } catch (parseError: any) {
      logger.error('Failed to parse request body', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { query, filters, limit, offset, skipCollection } = body;

    // Validate query parameter
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      logger.warn('Invalid query parameter', { query, type: typeof query });
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    logger.info('Processing search query', {
      query: query.trim(),
      filters,
      limit: limit || 20,
      offset: offset || 0,
      skipCollection,
    });

    // Check environment variables
    logger.debug('Environment check', {
      hasElasticCloudId: !!process.env.ELASTIC_CLOUD_ID,
      hasElasticApiKey: !!process.env.ELASTIC_API_KEY,
      nodeEnv: process.env.NODE_ENV,
    });

    // Trigger immediate background collection for this query
    // This runs in the background and doesn't block the search
    if (!skipCollection) {
      logger.info('Triggering background data collection');
      collectForQuery(query.trim()).catch((error) => {
        logger.error('Background collection error', error);
        // Don't fail the search if collection fails
      });
    }

    // Execute hybrid search
    logger.info('Executing hybrid search');
    const results = await hybridSearch({
      query: query.trim(),
      filters: filters || {},
      limit: limit || 20,
      offset: offset || 0,
    });

    const responseTime = Date.now() - startTime;
    logger.info('Search completed successfully', {
      resultsCount: results.results.length,
      totalResults: results.total_results,
      responseTimeMs: responseTime,
      searchTimeMs: results.search_time_ms,
    });

    return NextResponse.json(results);
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    logger.error('Search failed', error, {
      responseTimeMs: responseTime,
      errorType: error?.constructor?.name,
    });

    return NextResponse.json(
      {
        error: 'Search failed',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
        ...(process.env.IS_LOGGING_ENABLED === 'true' && {
          details: {
            errorType: error?.constructor?.name,
            errorMessage: error?.message,
          }
        }),
      },
      { status: 500 }
    );
  }
}
