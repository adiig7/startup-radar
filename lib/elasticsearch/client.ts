// Elasticsearch client configuration for SignalScout

import { Client } from '@elastic/elasticsearch';
import type { SocialPost } from '../types';

export const SIGNALS_INDEX = 'social_signals';

// Lazy-load Elasticsearch client to avoid initialization during build
let _esClient: Client | null = null;

export function getEsClient(): Client {
  if (!_esClient) {
    // Only initialize if we're in a runtime environment (not during build)
    if (typeof window === 'undefined' && process.env.ELASTIC_CLOUD_ID) {
      _esClient = new Client({
        cloud: {
          id: process.env.ELASTIC_CLOUD_ID,
        },
        auth: {
          apiKey: process.env.ELASTIC_API_KEY!,
        },
      });
    } else if (!_esClient) {
      // Return a mock client during build
      throw new Error('Elasticsearch client not initialized - missing environment variables');
    }
  }
  return _esClient!;
}

// Create index with proper mappings
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
            dims: 768, // Vertex AI text-embedding-004 dimensions
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

// Bulk index social posts
export async function bulkIndexPosts(posts: SocialPost[]): Promise<void> {
  if (posts.length === 0) {
    console.log('No posts to index');
    return;
  }

  console.log(`Indexing ${posts.length} posts to Elasticsearch...`);

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
    console.error('Bulk indexing errors:', erroredDocuments);
    throw new Error('Bulk indexing had errors');
  }

  console.log(`✅ Successfully indexed ${posts.length} posts`);
}

// Delete old posts (older than X days)
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

// Get index stats
export async function getIndexStats() {
  const client = getEsClient();
  const stats = await client.count({ index: SIGNALS_INDEX });
  return {
    total_documents: stats.count,
  };
}
