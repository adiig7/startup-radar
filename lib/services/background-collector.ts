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

const queryQueue: string[] = [];
const QUEUE_THRESHOLD = 10;
const processedQueries = new Set<string>();

let ENABLED_PLATFORMS: Platform[] = ['youtube', 'reddit', 'hackernews', 'producthunt'];

const searchProductHuntByQuery = async (query: string, limit: number): Promise<SocialPost[]> => {
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
      break;
    }
  }

  if (!matchedTopic) {
    return [];
  }

  try {
    return await fetchProductHuntByTopic(matchedTopic, limit);
  } catch (error) {
    return [];
  }
}

export const collectForQuery = async (query: string): Promise<SocialPost[]> => {
  try {
    const allPosts: SocialPost[] = [];

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

    platformResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const posts = result.value;
        allPosts.push(...posts);
      }
    });

    if (allPosts.length === 0) {
      return [];
    }

    allPosts.forEach((post) => {
      const fullText = `${post.title} ${post.content}`;
      post.sentiment = analyzeSentiment(fullText);
      post.quality = analyzeQuality(fullText);
      post.domain_context = classifyDomain(fullText, post.tags);
    });

    const processedPosts = filterAndProcessPosts(allPosts, query);

    if (processedPosts.length === 0) {
      return [];
    }

    try {
      const texts = processedPosts.map(prepareTextForEmbedding);
      const embeddings = await generateBatchEmbeddings(texts);
      processedPosts.forEach((post, idx) => {
        post.embedding = embeddings[idx];
      });
    } catch (embeddingError: any) {
      throw embeddingError;
    }

    try {
      await bulkIndexPosts(processedPosts);
    } catch (indexError: any) {
      throw indexError;
    }

    processedQueries.add(query.toLowerCase().trim());

    return processedPosts;
  } catch (error: any) {
    return [];
  }
}

export const clearProcessedCache = () => {
  processedQueries.clear();
}

export const getQueueStatus = () => {
  return {
    queueLength: queryQueue.length,
    threshold: QUEUE_THRESHOLD,
    processedCount: processedQueries.size,
    enabledPlatforms: ENABLED_PLATFORMS,
  };
}
