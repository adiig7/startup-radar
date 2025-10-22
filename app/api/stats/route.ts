import { NextResponse } from 'next/server';
import { getIndexStats } from '@/lib/elasticsearch/client';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('StatsAPI');

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    logger.info('Stats request received');

    const stats = await getIndexStats();
    
    logger.info('Stats retrieved successfully', {
      totalDocuments: stats.total_documents,
    });

    return NextResponse.json({
      total_posts: stats.total_documents,
      platforms: 4, // Reddit, Hacker News, YouTube, Product Hunt
      last_updated: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Stats retrieval failed', error);

    // Return fallback stats if Elasticsearch is unavailable
    return NextResponse.json({
      total_posts: 295, // Fallback number
      platforms: 4,
      last_updated: new Date().toISOString(),
      fallback: true,
    });
  }
}
