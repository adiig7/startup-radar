import { getEsClient, SIGNALS_INDEX } from './client';
import { generateEmbedding } from '../ai/embeddings';
import type { SearchRequest, SearchResponse, SocialPost, SearchFilters } from '../types';

export async function hybridSearch(request: SearchRequest): Promise<SearchResponse> {
  try {

    let queryEmbedding: number[] = [];
    try {
      queryEmbedding = await generateEmbedding(request.query);
    } catch (error: any) {
      console.error(`Error generating embedding: ${error}`);
    }

    const esQuery = buildHybridQuery(request.query, queryEmbedding, request.filters);
    const client = getEsClient();

    const searchResponse = await client.search({
      index: SIGNALS_INDEX,
      body: esQuery,
      size: request.limit || 20,
      from: request.offset || 0,
    });

    const totalResults = typeof searchResponse.hits.total === 'number'
      ? searchResponse.hits.total
      : searchResponse.hits.total?.value || 0;

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
      search_time_ms: 0,
    };
  } catch (error: any) {
    throw error;
  }
}

function buildHybridQuery(query: string, embedding: number[], filters?: SearchFilters) {
  const shouldClauses: any[] = [];
  const filterClauses: any[] = [];

  shouldClauses.push({
    multi_match: {
      query: query,
      fields: ['title^3', 'content^2', 'tags^1.5'],
      type: 'best_fields',
      fuzziness: 'AUTO',
      boost: 1.5,
    },
  });

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

    if (filters.minScore) {
      filterClauses.push({
        range: { score: { gte: filters.minScore } },
      });
    }

    if (filters.tags && filters.tags.length > 0) {
      filterClauses.push({
        terms: { tags: filters.tags },
      });
    }

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

    if (filters.sentiment) {
      filterClauses.push({
        term: { 'sentiment.label': filters.sentiment },
      });
    }

    if (filters.domains && filters.domains.length > 0) {
      filterClauses.push({
        terms: { domain_context: filters.domains },
      });
    }

    if (filters.minQuality !== undefined) {
      filterClauses.push({
        range: { 'quality.spamScore': { lte: 1 - filters.minQuality } },
      });
    }

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
    sort: [{ _score: { order: 'desc' as const } }],
  };
}

