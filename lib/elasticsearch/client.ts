import { Client } from '@elastic/elasticsearch';
import type { SocialPost } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('ElasticsearchClient');
const dotenv = require('dotenv');
dotenv.config();

export const SIGNALS_INDEX = 'social_signals';

let _esClient: Client | null = null;

export function getEsClient(): Client {
  if (!_esClient) {
    logger.info('Initializing Elasticsearch client');

    if (typeof window !== 'undefined') {
      logger.error('Cannot initialize Elasticsearch client in browser');
      throw new Error('Elasticsearch client can only be initialized on the server');
    }

    if (!process.env.ELASTIC_CLOUD_ID) {
      logger.error('Missing ELASTIC_CLOUD_ID environment variable');
      throw new Error('Elasticsearch client not initialized - missing ELASTIC_CLOUD_ID');
    }

    if (!process.env.ELASTIC_API_KEY) {
      logger.error('Missing ELASTIC_API_KEY environment variable');
      throw new Error('Elasticsearch client not initialized - missing ELASTIC_API_KEY');
    }

    try {
      logger.debug('Creating Elasticsearch client with cloud configuration', {
        cloudIdPrefix: process.env.ELASTIC_CLOUD_ID.substring(0, 20) + '...',
        hasApiKey: !!process.env.ELASTIC_API_KEY,
      });

      _esClient = new Client({
        cloud: {
          id: process.env.ELASTIC_CLOUD_ID,
        },
        auth: {
          apiKey: process.env.ELASTIC_API_KEY,
        },
      });

      logger.info('Elasticsearch client initialized successfully');
    } catch (error: any) {
      logger.error('Failed to initialize Elasticsearch client', error);
      throw error;
    }
  }

  return _esClient;
}

export async function createSignalsIndex() {
  const client = getEsClient();
  const indexExists = await client.indices.exists({ index: SIGNALS_INDEX });

  if (indexExists) {
    console.log(`✅ Index "${SIGNALS_INDEX}" already exists`);
    return;
  }

  console.log(`Creating index "${SIGNALS_INDEX}"...`);

  await client.indices.create({
    index: SIGNALS_INDEX,
    body: {
      settings: {
        number_of_shards: 1,
        number_of_replicas: 1,
        analysis: {
          analyzer: {
            english_analyzer: {
              type: 'standard',
              stopwords: '_english_',
            },
          },
        },
      },
      mappings: {
        properties: {
          id: { type: 'keyword' },
          platform: { type: 'keyword' },
          title: {
            type: 'text',
            analyzer: 'english_analyzer',
            fields: {
              keyword: { type: 'keyword' },
            },
          },
          content: {
            type: 'text',
            analyzer: 'english_analyzer',
          },
          author: { type: 'keyword' },
          url: { type: 'keyword' },
          created_at: { type: 'date' },
          score: { type: 'integer' },
          num_comments: { type: 'integer' },
          tags: { type: 'keyword' },
          embedding: {
            type: 'dense_vector',
            dims: 768,
            index: true,
            similarity: 'cosine',
          },
          indexed_at: { type: 'date' },

          // Enhanced analysis fields
          sentiment: {
            properties: {
              score: { type: 'float' },
              comparative: { type: 'float' },
              label: { type: 'keyword' },
              confidence: { type: 'float' },
            },
          },
          quality: {
            properties: {
              textLength: { type: 'integer' },
              wordCount: { type: 'integer' },
              readabilityScore: { type: 'float' },
              hasCode: { type: 'boolean' },
              hasLinks: { type: 'boolean' },
              spamScore: { type: 'float' },
            },
          },
          domain_context: { type: 'keyword' },
          relevance_score: { type: 'float' },
        },
      },
    },
  });

  console.log(`✅ Index "${SIGNALS_INDEX}" created successfully`);
}

export async function bulkIndexPosts(posts: SocialPost[]): Promise<void> {
  if (posts.length === 0) {
    logger.info('No posts to index');
    return;
  }

  logger.info('Starting bulk index operation', { postsCount: posts.length });

  try {
    const operations = posts.flatMap((post) => [
      { index: { _index: SIGNALS_INDEX, _id: post.id } },
      {
        id: post.id,
        platform: post.platform,
        title: post.title,
        content: post.content,
        author: post.author,
        url: post.url,
        created_at: post.created_at,
        score: post.score,
        num_comments: post.num_comments,
        tags: post.tags,
        embedding: post.embedding,
        indexed_at: post.indexed_at,
        sentiment: post.sentiment,
        quality: post.quality,
        domain_context: post.domain_context,
        relevance_score: post.relevance_score,
      },
    ]);

    logger.debug('Prepared bulk operations', { operationsCount: operations.length });

    const client = getEsClient();
    const result = await client.bulk({ operations, refresh: true });

    if (result.errors) {
      const erroredDocuments = result.items.filter((item: any) => item.index?.error);
      logger.error('Bulk indexing had errors', null, {
        errorCount: erroredDocuments.length,
        errors: erroredDocuments.slice(0, 5),
      });
      throw new Error(`Bulk indexing had ${erroredDocuments.length} errors`);
    }

    logger.info('Bulk index completed successfully', {
      postsIndexed: posts.length,
      took: result.took,
    });
  } catch (error: any) {
    logger.error('Bulk index failed', error, { postsCount: posts.length });
    throw error;
  }
}

export async function deleteOldPosts(daysOld: number = 30): Promise<void> {
  console.log(`Deleting posts older than ${daysOld} days...`);

  const client = getEsClient();
  const result = await client.deleteByQuery({
    index: SIGNALS_INDEX,
    body: {
      query: {
        range: {
          created_at: {
            lt: `now-${daysOld}d`,
          },
        },
      },
    },
  });

  console.log(`✅ Deleted ${result.deleted} old posts`);
}

export async function getIndexStats() {
  const client = getEsClient();
  const stats = await client.count({ index: SIGNALS_INDEX });
  return {
    total_documents: stats.count,
  };
}
