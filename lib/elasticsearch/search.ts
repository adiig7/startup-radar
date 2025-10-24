import { getEsClient, SIGNALS_INDEX } from './client';
import { generateEmbedding } from '../ai/embeddings';
import { RERANKER_INFERENCE_ID, checkRerankingEndpoint, setupRerankingEndpoint } from './reranking';
import { deduplicatePosts } from '../services/enhanced-indexing';
import type { SearchRequest, SearchResponse, SocialPost, SearchFilters } from '../types';

export const hybridSearch = async (request: SearchRequest): Promise<SearchResponse> => {
  const startTime = Date.now();

  try {
    const client = getEsClient();

    // Check if reranking is requested and available
    const useReranking = request.useReranking === true;
    let rerankingAvailable = false;

    if (useReranking) {
      try {
        rerankingAvailable = await checkRerankingEndpoint();
        if (!rerankingAvailable) {
          try {
            await setupRerankingEndpoint();
            rerankingAvailable = await checkRerankingEndpoint();
          } catch (setupError: any) {
            console.error('[Search] Failed to setup reranking:', setupError.message);
            rerankingAvailable = false;
          }
        }
      } catch (error: any) {
        console.error('Search Reranking check failed:', error.message);
        rerankingAvailable = false;
      }
    }

    let searchResponse;

    if (useReranking && rerankingAvailable) {
      searchResponse = await hybridSearchWithReranking(request, client);
    } else {
      let queryEmbedding: number[] = [];
      try {
        queryEmbedding = await generateEmbedding(request.query);
      } catch (error: any) {
        console.error(`Error generating embedding: ${error}`);
      }

      const esQuery = buildHybridQuery(request.query, queryEmbedding, request.filters);

      searchResponse = await client.search({
        index: SIGNALS_INDEX,
        body: esQuery,
        size: request.limit || 20,
        from: request.offset || 0,
      });
    }

    const totalResults = typeof searchResponse.hits.total === 'number'
      ? searchResponse.hits.total
      : searchResponse.hits.total?.value || 0;

    const rawResults: SocialPost[] = searchResponse.hits.hits.map((hit: any) => ({
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

    const results = deduplicatePosts(rawResults);

    const searchTimeMs = Date.now() - startTime;
    return {
      query: request.query,
      results,
      total_results: totalResults,
      search_time_ms: searchTimeMs
    };
  } catch (error: any) {
    throw error;
  }
}

const hybridSearchWithReranking = async (request: SearchRequest, client: any) => {
  const baseRetriever = await buildBaseRetriever(request);

  const requestedSize = request.limit || 20;
  const requestedOffset = request.offset || 0;
  const totalNeeded = requestedSize + requestedOffset;
  const rankWindowSize = Math.min(Math.max(totalNeeded, 100), 10000);

  const searchQuery: any = {
    index: SIGNALS_INDEX,
    retriever: {
      text_similarity_reranker: {
        retriever: baseRetriever,
        field: 'content',
        rank_window_size: rankWindowSize,
        inference_id: RERANKER_INFERENCE_ID,
        inference_text: request.query
      }
    },
    size: requestedSize,
    _source: [
      'id', 'platform', 'title', 'content', 'author', 'url',
      'created_at', 'score', 'num_comments', 'tags', 'indexed_at',
      'sentiment', 'quality', 'domain_context', 'relevance_score'
    ]
  };

  if (requestedOffset > 0) {
    searchQuery.from = requestedOffset;
  }

  return await client.search(searchQuery);
}

const buildBaseRetriever = async (request: SearchRequest) => {
  const shouldClauses: any[] = [];
  const filterClauses: any[] = [];

  shouldClauses.push({
    multi_match: {
      query: request.query,
      fields: ['title^3', 'content^2', 'tags^1.5'],
      type: 'best_fields',
      fuzziness: 'AUTO',
      boost: 1.5,
    },
  });

  if (request.filters) {
    const filters = request.filters;

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
  const retriever: any = {
    standard: {
      query: {
        bool: {
          should: shouldClauses,
          minimum_should_match: 1,
        },
      },
    },
  };

  if (filterClauses.length > 0) {
    retriever.standard.query.bool.filter = filterClauses;
  }

  return retriever;
}

const buildHybridQuery = (query: string, embedding: number[], filters?: SearchFilters): any => {
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

