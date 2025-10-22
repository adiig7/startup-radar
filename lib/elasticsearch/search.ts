// Hybrid search implementation (BM25 + Vector search)

import { esClient, SIGNALS_INDEX } from './client';
import { generateEmbedding } from '../ai/embeddings';
import type { SearchRequest, SearchResponse, SocialPost, SearchFilters } from '../types';

export async function hybridSearch(request: SearchRequest): Promise<SearchResponse> {
  const startTime = Date.now();

  try {
    console.log(`\n[Hybrid Search] Query: "${request.query}"`);

    // Generate query embedding for semantic search (optional - falls back to keyword-only)
    let queryEmbedding: number[] = [];
    try {
      queryEmbedding = await generateEmbedding(request.query);
      console.log('[Hybrid Search] Using semantic + keyword search');
    } catch (error: any) {
      console.warn('[Hybrid Search] Embedding generation failed, falling back to keyword-only search');
      console.warn('[Hybrid Search] Error:', error.message);
    }

    // Build Elasticsearch query
    const esQuery = buildHybridQuery(request.query, queryEmbedding, request.filters);

    // Execute search
    const searchResponse = await esClient.search({
      index: SIGNALS_INDEX,
      body: esQuery,
      size: request.limit || 20,
      from: request.offset || 0,
    });

    const totalResults = typeof searchResponse.hits.total === 'number'
      ? searchResponse.hits.total
      : searchResponse.hits.total?.value || 0;

    console.log(`[Hybrid Search] Found ${totalResults} results`);

    // Format results
    const results: SocialPost[] = searchResponse.hits.hits.map((hit: any) => ({
      id: hit._source.id,
      platform: hit._source.platform,
      title: hit._source.title,
      content: hit._source.content,
      author: hit._source.author,
      url: hit._source.url,
      created_at: new Date(hit._source.created_at),
      score: hit._source.score,
      num_comments: hit._source.num_comments,
      tags: hit._source.tags,
      indexed_at: new Date(hit._source.indexed_at),
    }));

    return {
      query: request.query,
      results,
      total_results: totalResults,
      search_time_ms: Date.now() - startTime,
    };
  } catch (error) {
    console.error('[Hybrid Search] Error:', error);
    throw error;
  }
}

function buildHybridQuery(query: string, embedding: number[], filters?: SearchFilters) {
  const shouldClauses: any[] = [];
  const filterClauses: any[] = [];

  // 1. BM25 Keyword Search (traditional full-text search)
  shouldClauses.push({
    multi_match: {
      query: query,
      fields: ['title^3', 'content^2', 'tags^1.5'],
      type: 'best_fields',
      fuzziness: 'AUTO',
      boost: 1.5,
    },
  });

  // 2. Vector Similarity Search (semantic understanding)
  const hasValidEmbedding = embedding && embedding.some((val) => val !== 0);
  if (hasValidEmbedding) {
    shouldClauses.push({
      knn: {
        field: 'embedding',
        query_vector: embedding,
        k: 50,
        num_candidates: 100,
        boost: 2.0,
      },
    });
  }

  // Apply filters
  if (filters) {
    // Platform filter
    if (filters.platforms && filters.platforms.length > 0) {
      filterClauses.push({
        terms: { platform: filters.platforms },
      });
    }

    // Date range filter
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

    // Minimum score filter
    if (filters.minScore) {
      filterClauses.push({
        range: { score: { gte: filters.minScore } },
      });
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filterClauses.push({
        terms: { tags: filters.tags },
      });
    }

    // Keywords filter (must appear in content)
    if (filters.keywords && filters.keywords.length > 0) {
      filterClauses.push({
        bool: {
          should: filters.keywords.map((keyword) => ({
            match: { content: keyword },
          })),
          minimum_should_match: 1,
        },
      });
    }

    // Sentiment filter
    if (filters.sentiment) {
      filterClauses.push({
        term: { 'sentiment.label': filters.sentiment },
      });
    }

    // Domain filter
    if (filters.domains && filters.domains.length > 0) {
      filterClauses.push({
        terms: { domain_context: filters.domains },
      });
    }

    // Quality filter (low spam)
    if (filters.minQuality !== undefined) {
      filterClauses.push({
        range: { 'quality.spamScore': { lte: 1 - filters.minQuality } },
      });
    }

    // Problems only (negative sentiment or problem keywords)
    if (filters.problemsOnly) {
      filterClauses.push({
        bool: {
          should: [
            { term: { 'sentiment.label': 'negative' } },
            { range: { 'sentiment.score': { lt: 0 } } },
          ],
          minimum_should_match: 1,
        },
      });
    }
  }

  return {
    query: {
      bool: {
        should: shouldClauses,
        filter: filterClauses.length > 0 ? filterClauses : undefined,
        minimum_should_match: 1,
      },
    },
    // Sort by relevance (combining BM25 + vector scores)
    sort: [{ _score: { order: 'desc' as const } }],
  };
}

// Get trending posts (high engagement recently)
export async function getTrendingPosts(limit: number = 20): Promise<SocialPost[]> {
  const response = await esClient.search({
    index: SIGNALS_INDEX,
    body: {
      query: {
        range: {
          created_at: {
            gte: 'now-7d', // Last 7 days
          },
        },
      },
      sort: [
        { score: { order: 'desc' as const } },
        { num_comments: { order: 'desc' as const } },
      ],
    },
    size: limit,
  });

  return response.hits.hits.map((hit: any) => ({
    id: hit._source.id,
    platform: hit._source.platform,
    title: hit._source.title,
    content: hit._source.content,
    author: hit._source.author,
    url: hit._source.url,
    created_at: new Date(hit._source.created_at),
    score: hit._source.score,
    num_comments: hit._source.num_comments,
    tags: hit._source.tags,
    indexed_at: new Date(hit._source.indexed_at),
  }));
}

// Get posts by platform
export async function getPostsByPlatform(platform: string, limit: number = 20): Promise<SocialPost[]> {
  const response = await esClient.search({
    index: SIGNALS_INDEX,
    body: {
      query: {
        term: { platform },
      },
      sort: [{ created_at: { order: 'desc' as const } }],
    },
    size: limit,
  });

  return response.hits.hits.map((hit: any) => ({
    id: hit._source.id,
    platform: hit._source.platform,
    title: hit._source.title,
    content: hit._source.content,
    author: hit._source.author,
    url: hit._source.url,
    created_at: new Date(hit._source.created_at),
    score: hit._source.score,
    num_comments: hit._source.num_comments,
    tags: hit._source.tags,
    indexed_at: new Date(hit._source.indexed_at),
  }));
}
