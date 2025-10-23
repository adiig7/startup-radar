import { Client } from '@elastic/elasticsearch';
import type { SocialPost } from '../types';

const dotenv = require('dotenv');
dotenv.config();

export const SIGNALS_INDEX = 'social_signals';

let _esClient: Client | null = null;

export function getEsClient(): Client {
  if (!_esClient) {
    if (typeof window !== 'undefined') {
      throw new Error('Elasticsearch client can only be initialized on the server');
    }

    if (!process.env.ELASTIC_CLOUD_ID) {
      throw new Error('Elasticsearch client not initialized - missing ELASTIC_CLOUD_ID');
    }

    if (!process.env.ELASTIC_API_KEY) {
      throw new Error('Elasticsearch client not initialized - missing ELASTIC_API_KEY');
    }

    try {
      _esClient = new Client({
        cloud: {
          id: process.env.ELASTIC_CLOUD_ID,
        },
        auth: {
          apiKey: process.env.ELASTIC_API_KEY,
        },
      });
    } catch (error: any) {
      throw error;
    }
  }

  return _esClient;
}

export async function createSignalsIndex() {
  const client = getEsClient();
  const indexExists = await client.indices.exists({ index: SIGNALS_INDEX });

  if (indexExists) {
    return;
  }

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
}

export async function bulkIndexPosts(posts: SocialPost[]): Promise<void> {
  if (posts.length === 0) {
    return;
  }

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

    const client = getEsClient();
    const result = await client.bulk({ operations, refresh: true });

    if (result.errors) {
      const erroredDocuments = result.items.filter((item: any) => item.index?.error);
      throw new Error(`Bulk indexing had ${erroredDocuments.length} errors`);
    }
  } catch (error: any) {
    throw error;
  }
}


export async function getIndexStats() {
  const client = getEsClient();
  const stats = await client.count({ index: SIGNALS_INDEX });
  return {
    total_documents: stats.count,
  };
}
