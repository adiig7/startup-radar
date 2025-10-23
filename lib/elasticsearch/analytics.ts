import { getEsClient, SIGNALS_INDEX } from './client';
import type { SearchFilters } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('Analytics');

export interface AnalyticsData {
  trendOverTime: {
    buckets: Array<{
      date: string;
      count: number;
    }>;
  };
  platformBreakdown: {
    buckets: Array<{
      platform: string;
      count: number;
      percentage: number;
    }>;
  };
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  engagementStats: {
    avgScore: number;
    avgComments: number;
    totalEngagement: number;
    topPosts: Array<{
      title: string;
      platform: string;
      engagement: number;
      url: string;
    }>;
  };
  timeOfDayHeatmap: {
    buckets: Array<{
      hour: number;
      count: number;
    }>;
  };
}

export async function getAnalytics(
  query: string,
  filters?: SearchFilters
): Promise<AnalyticsData> {
  logger.info('Getting analytics', { query, filters });

  const client = getEsClient();

  const filterClauses: any[] = [];

  if (filters) {
    if (filters.platforms && filters.platforms.length > 0) {
      filterClauses.push({
        terms: { platform: filters.platforms },
      });
    }

    if (filters.dateRange) {
      filterClauses.push({
        range: {
          created_at: {
            gte: filters.dateRange.from,
            lte: filters.dateRange.to,
          },
        },
      });
    }
  }

  let calendarInterval: 'hour' | 'day' = 'day';

  if (filters?.dateRange) {
    const fromDate = filters.dateRange.from instanceof Date
      ? filters.dateRange.from
      : new Date(filters.dateRange.from);
    const toDate = filters.dateRange.to instanceof Date
      ? filters.dateRange.to
      : new Date(filters.dateRange.to);

    const diffMs = toDate.getTime() - fromDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours <= 24) {
      calendarInterval = 'hour';
    }
  }

  const baseQuery = {
    bool: {
      must: [
        {
          multi_match: {
            query: query,
            fields: ['title^3', 'content^2', 'tags^1.5'],
            type: 'best_fields' as const,
          },
        },
      ],
      filter: filterClauses.length > 0 ? filterClauses : undefined,
    },
  };

  const response = await client.search({
    index: SIGNALS_INDEX,
    body: {
      query: baseQuery,
      size: 0,
      aggs: {
        // 1. Trend over time (hourly or daily buckets based on date range)
        trend_over_time: {
          date_histogram: {
            field: 'created_at',
            calendar_interval: calendarInterval,
            min_doc_count: 1,
            order: { _key: 'asc' },
          },
        },

        // 2. Platform breakdown
        platform_breakdown: {
          terms: {
            field: 'platform',
            size: 10,
          },
        },

        // 3. Sentiment distribution
        sentiment_distribution: {
          terms: {
            field: 'sentiment.label',
            size: 10,
          },
        },

        // 4. Engagement stats
        avg_score: {
          avg: {
            field: 'score',
          },
        },
        avg_comments: {
          avg: {
            field: 'num_comments',
          },
        },

        // 5. Time of day heatmap - simplified approach
        time_of_day: {
          terms: {
            script: {
              source: "doc['created_at'].value.getHour()",
              lang: 'painless',
            },
            size: 24,
          },
        },

        // Top posts by engagement (simplified - sort by score only)
        top_posts: {
          top_hits: {
            size: 5,
            sort: [
              { score: { order: 'desc' } },
              { num_comments: { order: 'desc' } },
            ],
            _source: ['title', 'platform', 'score', 'num_comments', 'url'],
          },
        },
      },
    },
  });

  const trendBuckets = (response.aggregations?.trend_over_time as any)?.buckets || [];
  const trendOverTime = {
    buckets: trendBuckets.map((bucket: any) => {
      const date = new Date(bucket.key);
      let dateLabel: string;

      if (calendarInterval === 'hour') {
        dateLabel = date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          hour12: true,
        });
      } else {
        dateLabel = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }

      return {
        date: dateLabel,
        count: bucket.doc_count,
      };
    }),
  };

  // Process platform breakdown
  const platformBuckets = (response.aggregations?.platform_breakdown as any)?.buckets || [];
  const totalDocs = platformBuckets.reduce((sum: number, b: any) => sum + b.doc_count, 0);
  const platformBreakdown = {
    buckets: platformBuckets.map((bucket: any) => ({
      platform: bucket.key,
      count: bucket.doc_count,
      percentage: totalDocs > 0 ? Math.round((bucket.doc_count / totalDocs) * 100) : 0,
    })),
  };

  // Process sentiment distribution
  const sentimentBuckets = (response.aggregations?.sentiment_distribution as any)?.buckets || [];
  const sentimentMap = sentimentBuckets.reduce((acc: any, bucket: any) => {
    acc[bucket.key] = bucket.doc_count;
    return acc;
  }, {});

  const totalSentiment = Object.values(sentimentMap).reduce((sum: number, count: any) => sum + count, 0) || 1;
  const sentimentDistribution = {
    positive: sentimentMap.positive || 0,
    neutral: sentimentMap.neutral || 0,
    negative: sentimentMap.negative || 0,
  };

  // Process engagement stats
  const avgScore = (response.aggregations?.avg_score as any)?.value || 0;
  const avgComments = (response.aggregations?.avg_comments as any)?.value || 0;
  const topPostsHits = (response.aggregations?.top_posts as any)?.hits?.hits || [];

  const engagementStats = {
    avgScore: Math.round(avgScore * 10) / 10,
    avgComments: Math.round(avgComments * 10) / 10,
    totalEngagement: Math.round((avgScore + avgComments) * 10) / 10,
    topPosts: topPostsHits.map((hit: any) => ({
      title: hit._source.title,
      platform: hit._source.platform,
      engagement: hit._source.score + hit._source.num_comments,
      url: hit._source.url,
    })),
  };

  const timeOfDayBuckets = (response.aggregations?.time_of_day as any)?.buckets || [];
  const hourCounts: { [key: number]: number } = {};

  for (let i = 0; i < 24; i++) {
    hourCounts[i] = 0;
  }

  timeOfDayBuckets.forEach((bucket: any) => {
    const hour = bucket.key;
    hourCounts[hour] = bucket.doc_count;
  });

  const timeOfDayHeatmap = {
    buckets: Object.entries(hourCounts)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
      }))
      .sort((a, b) => a.hour - b.hour),
  };

  logger.info('Analytics completed', {
    trendPoints: trendOverTime.buckets.length,
    platforms: platformBreakdown.buckets.length,
    topPosts: engagementStats.topPosts.length,
  });

  return {
    trendOverTime,
    platformBreakdown,
    sentimentDistribution,
    engagementStats,
    timeOfDayHeatmap,
  };
}
