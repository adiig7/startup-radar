import { getEsClient, SIGNALS_INDEX } from './client';
import { generateEmbedding } from '../ai/embeddings';
import { RERANKER_INFERENCE_ID, checkRerankingEndpoint } from './reranking';
import type { SearchRequest, SearchResponse, SocialPost, SearchFilters } from '../types';

export async function hybridSearch(request: SearchRequest): Promise<SearchResponse> {
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
          console.warn('Reranking requested but endpoint not available, falling back to standard search');
        }
      } catch (error) {
        console.error('Error checking reranking endpoint:', error);
        rerankingAvailable = false;
      }
    }

    let searchResponse;

    if (useReranking && rerankingAvailable) {
      console.log('Using AI reranking with Vertex AI via Open Inference API');
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

/**
 * Hybrid search with AI-powered reranking using Elasticsearch retrievers API
 * This combines BM25 + vector search with Vertex AI reranking for superior relevance
 */
async function hybridSearchWithReranking(request: SearchRequest, client: any) {
  const baseRetriever = await buildBaseRetriever(request);
  const searchQuery = {
    index: SIGNALS_INDEX,
    retriever: {
      text_similarity_reranker: {
        retriever: baseRetriever,
        field: 'content',
        rank_window_size: 100,
        inference_id: RERANKER_INFERENCE_ID,
        inference_text: request.query
      }
    },
    size: request.limit || 20,
    from: request.offset || 0,
    _source: [
      'id', 'platform', 'title', 'content', 'author', 'url', 
      'created_at', 'score', 'num_comments', 'tags', 'indexed_at',
      'sentiment', 'quality', 'domain_context', 'relevance_score'
    ]
  };

  return await client.search(searchQuery);
}

async function buildBaseRetriever(request: SearchRequest) {
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

  try {
    const queryEmbedding = await generateEmbedding(request.query);
    const hasValidEmbedding = queryEmbedding && queryEmbedding.some((val) => val !== 0);
    
    if (hasValidEmbedding) {
      shouldClauses.push({
        knn: {
          field: 'embedding',
          query_vector: queryEmbedding,
          k: 50,
          num_candidates: 100,
          boost: 2.0,
        },
      });
    }
  } catch (error: any) {
    console.error(`Error generating embedding for reranking: ${error}`);
  }

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
  return {
    standard: {
      query: {
        bool: {
          should: shouldClauses,
          filter: filterClauses.length > 0 ? filterClauses : undefined,
          minimum_should_match: 1,
        },
      },
    },
  };
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

