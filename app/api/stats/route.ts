import { NextResponse } from 'next/server';
import { getIndexStats } from '@/lib/elasticsearch/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getIndexStats();

    return NextResponse.json({
      total_posts: stats.total_documents,
      platforms: 4,
      last_updated: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      total_posts: 300,
      platforms: 4,
      last_updated: new Date().toISOString(),
      fallback: true,
    });
  }
}
