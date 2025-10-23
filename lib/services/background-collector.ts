import { searchYouTubeVideos } from '../connectors/youtube';
import { searchRedditPosts } from '../connectors/reddit';
import { searchHackerNews } from '../connectors/hackernews';
import { fetchProductHuntByTopic, PRODUCT_HUNT_TOPICS } from '../connectors/producthunt';
import { generateBatchEmbeddings, prepareTextForEmbedding } from '../ai/embeddings';
import { bulkIndexPosts } from '../elasticsearch/client';
import { analyzeSentiment } from '../analysis/sentiment';
import { analyzeQuality, classifyDomain } from '../analysis/quality';
import { filterAndProcessPosts } from './enhanced-indexing';
import type { SocialPost, Platform } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('BackgroundCollector');

const queryQueue: string[] = [];
const QUEUE_THRESHOLD = 10;
const processedQueries = new Set<string>();

let ENABLED_PLATFORMS: Platform[] = ['youtube', 'reddit', 'hackernews', 'producthunt'];

async function collectYouTubeDataForQueries(queries: string[]) {
  console.log(`[Background Collector] Starting multi-platform data collection for ${queries.length} queries...`);

  try {
    const allPosts: SocialPost[] = [];

    for (const query of queries) {
      console.log(`\n[Background Collector] Collecting for query: "${query}"`);

      const platformResults = await Promise.allSettled([
        ENABLED_PLATFORMS.includes('youtube')
          ? searchYouTubeVideos(query, { numOfPosts: 5 })
          : Promise.resolve([]),

        ENABLED_PLATFORMS.includes('reddit')
          ? searchRedditPosts(query, 10)
          : Promise.resolve([]),

        ENABLED_PLATFORMS.includes('hackernews')
          ? searchHackerNews(query, 10)
          : Promise.resolve([]),

        ENABLED_PLATFORMS.includes('producthunt')
          ? searchProductHuntByQuery(query, 5)
          : Promise.resolve([]),
      ]);

      platformResults.forEach((result, index) => {
        const platforms = ['youtube', 'reddit', 'hackernews', 'producthunt'];
        if (result.status === 'fulfilled') {
          const posts = result.value;
          allPosts.push(...posts);
          console.log(`   ${platforms[index]}: ${posts.length} posts`);
        } else {
          console.log(`  ⚠️  ${platforms[index]}: ${result.reason}`);
        }
      });

      if (queries.indexOf(query) < queries.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (allPosts.length === 0) {
      console.log('[Background Collector] No posts collected');
      return;
    }

    const uniquePosts = Array.from(
      new Map(allPosts.map((post) => [post.id, post])).values()
    );

    console.log(`\n[Background Collector] Collected ${uniquePosts.length} unique posts from all platforms`);

    uniquePosts.forEach((post) => {
      const fullText = `${post.title} ${post.content}`;
      post.sentiment = analyzeSentiment(fullText);
      post.quality = analyzeQuality(fullText);
      post.domain_context = classifyDomain(fullText, post.tags);
    });

    const texts = uniquePosts.map(prepareTextForEmbedding);
    const embeddings = await generateBatchEmbeddings(texts);
    uniquePosts.forEach((post, idx) => {
      post.embedding = embeddings[idx];
    });

    await bulkIndexPosts(uniquePosts);

    queries.forEach((q) => processedQueries.add(q));

    const platformCounts = uniquePosts.reduce((acc, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n[Background Collector] Summary by platform:');
    Object.entries(platformCounts).forEach(([platform, count]) => {
      console.log(`  - ${platform}: ${count} posts`);
    });

    console.log('[Background Collector]  Collection complete');
  } catch (error) {
    console.error('[Background Collector] Collection failed:', error);
  }
}

/**
 */
async function searchProductHuntByQuery(query: string, limit: number): Promise<SocialPost[]> {
  const queryLower = query.toLowerCase();

  const topicMappings: Record<string, string> = {
    'remote': 'Productivity',
    'work from home': 'Productivity',
    'wfh': 'Productivity',
    'collaboration': 'Productivity',
    'communication': 'Productivity',
    'team': 'Productivity',
    'ai': 'AI',
    'artificial intelligence': 'AI',
    'saas': 'SaaS',
    'software': 'SaaS',
    'developer': 'Developer Tools',
    'dev tools': 'Developer Tools',
    'productivity': 'Productivity',
    'design': 'Design Tools',
    'marketing': 'Marketing',
    'analytics': 'Analytics',
    'no-code': 'No-Code',
    'mobile': 'Mobile',
    'web app': 'Web App',
    'extension': 'Chrome Extension',
    'api': 'API',
    'open source': 'Open Source',
    'social media': 'Social Media',
    'finance': 'Finance',
  };

  let matchedTopic: string | null = null;
  for (const [keyword, topic] of Object.entries(topicMappings)) {
    if (queryLower.includes(keyword)) {
      matchedTopic = topic;
      console.log(`[ProductHunt] Matched "${keyword}" → topic: ${topic}`);
      break;
    }
  }

  if (!matchedTopic) {
    console.log(`[ProductHunt] No topic match for "${query}" - skipping ProductHunt`);
    return [];
  }

  try {
    return await fetchProductHuntByTopic(matchedTopic, limit);
  } catch (error) {
    console.error(`[Background Collector] ProductHunt search failed:`, error);
    return [];
  }
}

export async function collectForQuery(query: string): Promise<SocialPost[]> {
  const startTime = Date.now();
  logger.info('Starting immediate collection', { query });

  try {
    const allPosts: SocialPost[] = [];

    logger.info('Collecting from platforms', {
      enabledPlatforms: ENABLED_PLATFORMS,
      query,
    });

    const platformResults = await Promise.allSettled([
      ENABLED_PLATFORMS.includes('youtube')
        ? searchYouTubeVideos(query, { numOfPosts: 10 })
        : Promise.resolve([]),

      // Reddit - 15 posts
      ENABLED_PLATFORMS.includes('reddit')
        ? searchRedditPosts(query, 15)
        : Promise.resolve([]),

      // HackerNews - 15 posts
      ENABLED_PLATFORMS.includes('hackernews')
        ? searchHackerNews(query, 15)
        : Promise.resolve([]),

      // ProductHunt - 10 posts
      ENABLED_PLATFORMS.includes('producthunt')
        ? searchProductHuntByQuery(query, 10)
        : Promise.resolve([]),
    ]);

    // Extract successful results
    const platforms = ['youtube', 'reddit', 'hackernews', 'producthunt'];
    platformResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const posts = result.value;
        allPosts.push(...posts);
        logger.info(`Platform collection succeeded`, {
          platform: platforms[index],
          postsCount: posts.length,
        });
      } else {
        logger.warn(`Platform collection failed`, {
          platform: platforms[index],
          reason: String(result.reason),
        });
      }
    });

    if (allPosts.length === 0) {
      logger.warn('No posts collected from any platform', { query });
      return [];
    }

    logger.info('Raw posts collected', {
      totalPosts: allPosts.length,
      collectionTimeMs: Date.now() - startTime,
    });

    // Analyze content BEFORE enhancement
    logger.debug('Analyzing post content');
    allPosts.forEach((post) => {
      const fullText = `${post.title} ${post.content}`;
      post.sentiment = analyzeSentiment(fullText);
      post.quality = analyzeQuality(fullText);
      post.domain_context = classifyDomain(fullText, post.tags);
    });

    // Apply quality filtering and processing pipeline
    logger.debug('Applying quality filters');
    const processedPosts = filterAndProcessPosts(allPosts, query);

    if (processedPosts.length === 0) {
      logger.warn('No posts passed quality filters', {
        originalCount: allPosts.length,
      });
      return [];
    }

    logger.info('Posts filtered and processed', {
      originalCount: allPosts.length,
      processedCount: processedPosts.length,
    });

    // Generate embeddings for high-quality posts only
    logger.info('Generating embeddings');
    const embeddingStartTime = Date.now();
    try {
      const texts = processedPosts.map(prepareTextForEmbedding);
      const embeddings = await generateBatchEmbeddings(texts);
      processedPosts.forEach((post, idx) => {
        post.embedding = embeddings[idx];
      });
      logger.info('Embeddings generated successfully', {
        count: embeddings.length,
        embeddingTimeMs: Date.now() - embeddingStartTime,
      });
    } catch (embeddingError: any) {
      logger.error('Embedding generation failed', embeddingError);
      throw embeddingError;
    }

    // Index to Elasticsearch
    logger.info('Indexing posts to Elasticsearch');
    const indexStartTime = Date.now();
    try {
      await bulkIndexPosts(processedPosts);
      logger.info('Posts indexed successfully', {
        indexedCount: processedPosts.length,
        indexTimeMs: Date.now() - indexStartTime,
      });
    } catch (indexError: any) {
      logger.error('Indexing failed', indexError);
      throw indexError;
    }

    // Mark as processed
    processedQueries.add(query.toLowerCase().trim());

    // Log summary
    const platformCounts = processedPosts.reduce((acc, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalTime = Date.now() - startTime;
    logger.info('Collection completed successfully', {
      query,
      totalPosts: processedPosts.length,
      platformBreakdown: platformCounts,
      totalTimeMs: totalTime,
    });

    return processedPosts;
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    logger.error('Collection failed', error, {
      query,
      totalTimeMs: totalTime,
    });
    return [];
  }
}

/**
 * Clear the processed queries cache (useful for testing)
 */
export function clearProcessedCache() {
  processedQueries.clear();
  console.log('[Background Collector] Cache cleared');
}

/**
 * Get current queue status
 */
export function getQueueStatus() {
  return {
    queueLength: queryQueue.length,
    threshold: QUEUE_THRESHOLD,
    processedCount: processedQueries.size,
    enabledPlatforms: ENABLED_PLATFORMS,
  };
}

