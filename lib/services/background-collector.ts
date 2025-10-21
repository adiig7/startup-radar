// Background data collection service for query-based multi-platform fetching

import { searchYouTubeVideos } from '../connectors/youtube';
import { searchRedditPosts } from '../connectors/reddit';
import { searchHackerNews } from '../connectors/hackernews';
import { fetchProductHuntByTopic, PRODUCT_HUNT_TOPICS } from '../connectors/producthunt';
import { generateBatchEmbeddings, prepareTextForEmbedding } from '../ai/embeddings';
import { bulkIndexPosts } from '../elasticsearch/client';
import { analyzeSentiment } from '../analysis/sentiment';
import { analyzeQuality, classifyDomain } from '../analysis/quality';
import type { SocialPost, Platform } from '../types';

// Track search queries to trigger collection
const queryQueue: string[] = [];
const QUEUE_THRESHOLD = 10; // Collect after 10 unique searches
const processedQueries = new Set<string>();

// Platforms to collect from (can be configured)
let ENABLED_PLATFORMS: Platform[] = ['youtube', 'reddit', 'hackernews', 'producthunt'];

/**
 * Add a search query to the background collection queue
 */
export function queueSearchQuery(query: string) {
  const normalizedQuery = query.toLowerCase().trim();

  // Skip if already processed recently
  if (processedQueries.has(normalizedQuery)) {
    return;
  }

  queryQueue.push(normalizedQuery);
  console.log(`[Background Collector] Queued: "${query}" (${queryQueue.length}/${QUEUE_THRESHOLD})`);

  // Trigger collection when threshold is reached
  if (queryQueue.length >= QUEUE_THRESHOLD) {
    triggerBackgroundCollection();
  }
}

/**
 * Trigger background collection for queued queries
 */
async function triggerBackgroundCollection() {
  if (queryQueue.length === 0) return;

  // Get queries to process
  const queriesToProcess = [...queryQueue];
  queryQueue.length = 0; // Clear queue

  console.log(`\n[Background Collector] Processing ${queriesToProcess.length} queries...`);

  // Run in background (don't block)
  collectYouTubeDataForQueries(queriesToProcess).catch((error) => {
    console.error('[Background Collector] Error:', error);
  });
}

/**
 * Collect data from all platforms for multiple search queries
 */
async function collectYouTubeDataForQueries(queries: string[]) {
  console.log(`[Background Collector] Starting multi-platform data collection for ${queries.length} queries...`);

  try {
    const allPosts: SocialPost[] = [];

    // Collect from each platform
    for (const query of queries) {
      console.log(`\n[Background Collector] Collecting for query: "${query}"`);

      const platformResults = await Promise.allSettled([
        // YouTube - 5 videos per query
        ENABLED_PLATFORMS.includes('youtube')
          ? searchYouTubeVideos(query, { numOfPosts: 5 })
          : Promise.resolve([]),

        // Reddit - 10 posts per query
        ENABLED_PLATFORMS.includes('reddit')
          ? searchRedditPosts(query, 10)
          : Promise.resolve([]),

        // HackerNews - 10 posts per query
        ENABLED_PLATFORMS.includes('hackernews')
          ? searchHackerNews(query, 10)
          : Promise.resolve([]),

        // ProductHunt - match query to topics
        ENABLED_PLATFORMS.includes('producthunt')
          ? searchProductHuntByQuery(query, 5)
          : Promise.resolve([]),
      ]);

      // Extract successful results
      platformResults.forEach((result, index) => {
        const platforms = ['youtube', 'reddit', 'hackernews', 'producthunt'];
        if (result.status === 'fulfilled') {
          const posts = result.value;
          allPosts.push(...posts);
          console.log(`  ✅ ${platforms[index]}: ${posts.length} posts`);
        } else {
          console.log(`  ⚠️  ${platforms[index]}: ${result.reason}`);
        }
      });

      // Small delay between queries to respect rate limits
      if (queries.indexOf(query) < queries.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (allPosts.length === 0) {
      console.log('[Background Collector] No posts collected');
      return;
    }

    // Remove duplicates
    const uniquePosts = Array.from(
      new Map(allPosts.map((post) => [post.id, post])).values()
    );

    console.log(`\n[Background Collector] Collected ${uniquePosts.length} unique posts from all platforms`);

    // Analyze content
    uniquePosts.forEach((post) => {
      const fullText = `${post.title} ${post.content}`;
      post.sentiment = analyzeSentiment(fullText);
      post.quality = analyzeQuality(fullText);
      post.domain_context = classifyDomain(fullText, post.tags);
    });

    // Generate embeddings
    const texts = uniquePosts.map(prepareTextForEmbedding);
    const embeddings = await generateBatchEmbeddings(texts);
    uniquePosts.forEach((post, idx) => {
      post.embedding = embeddings[idx];
    });

    // Index to Elasticsearch
    await bulkIndexPosts(uniquePosts);

    // Mark queries as processed
    queries.forEach((q) => processedQueries.add(q));

    // Log summary by platform
    const platformCounts = uniquePosts.reduce((acc, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n[Background Collector] Summary by platform:');
    Object.entries(platformCounts).forEach(([platform, count]) => {
      console.log(`  - ${platform}: ${count} posts`);
    });

    console.log('[Background Collector] ✅ Collection complete');
  } catch (error) {
    console.error('[Background Collector] Collection failed:', error);
  }
}

/**
 * Search ProductHunt by matching query to topics
 */
async function searchProductHuntByQuery(query: string, limit: number): Promise<SocialPost[]> {
  const queryLower = query.toLowerCase();

  // Map common search terms to ProductHunt topics
  const topicMappings: Record<string, string> = {
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

  // Find matching topic
  let matchedTopic: string | null = null;
  for (const [keyword, topic] of Object.entries(topicMappings)) {
    if (queryLower.includes(keyword)) {
      matchedTopic = topic;
      break;
    }
  }

  // If no topic matched, use most relevant default
  if (!matchedTopic) {
    // Default to SaaS as it's most common for startup signals
    matchedTopic = 'SaaS';
  }

  try {
    return await fetchProductHuntByTopic(matchedTopic, limit);
  } catch (error) {
    console.error(`[Background Collector] ProductHunt search failed:`, error);
    return [];
  }
}

/**
 * Manually trigger collection for a specific query (immediate)
 */
export async function collectForQuery(query: string): Promise<SocialPost[]> {
  console.log(`[Background Collector] Immediate collection for: "${query}"`);

  try {
    const allPosts: SocialPost[] = [];

    // Collect from all platforms in parallel
    const platformResults = await Promise.allSettled([
      // YouTube - 10 videos
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
        console.log(`  ✅ ${platforms[index]}: ${posts.length} posts`);
      } else {
        console.log(`  ⚠️  ${platforms[index]} failed: ${result.reason}`);
      }
    });

    if (allPosts.length === 0) {
      console.log('[Background Collector] No posts collected');
      return [];
    }

    // Remove duplicates
    const uniquePosts = Array.from(
      new Map(allPosts.map((post) => [post.id, post])).values()
    );

    // Analyze content
    uniquePosts.forEach((post) => {
      const fullText = `${post.title} ${post.content}`;
      post.sentiment = analyzeSentiment(fullText);
      post.quality = analyzeQuality(fullText);
      post.domain_context = classifyDomain(fullText, post.tags);
    });

    // Generate embeddings
    const texts = uniquePosts.map(prepareTextForEmbedding);
    const embeddings = await generateBatchEmbeddings(texts);
    uniquePosts.forEach((post, idx) => {
      post.embedding = embeddings[idx];
    });

    // Index to Elasticsearch
    await bulkIndexPosts(uniquePosts);

    // Mark as processed
    processedQueries.add(query.toLowerCase().trim());

    // Log summary
    const platformCounts = uniquePosts.reduce((acc, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n[Background Collector] Indexed posts by platform:');
    Object.entries(platformCounts).forEach(([platform, count]) => {
      console.log(`  - ${platform}: ${count}`);
    });

    console.log(`[Background Collector] ✅ Total indexed: ${uniquePosts.length} posts`);

    return uniquePosts;
  } catch (error) {
    console.error('[Background Collector] Failed:', error);
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

/**
 * Configure which platforms to collect from
 */
export function setPlatforms(platforms: Platform[]) {
  ENABLED_PLATFORMS = [...platforms];
  console.log(`[Background Collector] Platforms set to: ${platforms.join(', ')}`);
}

/**
 * Get currently enabled platforms
 */
export function getEnabledPlatforms(): Platform[] {
  return [...ENABLED_PLATFORMS];
}
