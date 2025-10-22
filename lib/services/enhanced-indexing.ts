// Enhanced indexing strategies for better search quality

import type { SocialPost } from '../types';

/**
 * IMPROVEMENT 1: Intelligent Deduplication
 * Remove similar/duplicate posts more effectively
 */
export function deduplicatePosts(posts: SocialPost[]): SocialPost[] {
  const uniquePosts = new Map<string, SocialPost>();

  for (const post of posts) {
    // Create multiple keys for better deduplication
    const urlKey = normalizeUrl(post.url);
    const titleKey = normalizeTitle(post.title);
    const contentKey = normalizeContent(post.content);

    // Check if we've seen this post before
    const existingByUrl = uniquePosts.get(urlKey);
    const existingByTitle = uniquePosts.get(titleKey);

    if (existingByUrl || existingByTitle) {
      // Keep the one with higher engagement
      const existing = existingByUrl || existingByTitle!;
      if (post.score + post.num_comments > existing.score + existing.num_comments) {
        uniquePosts.set(urlKey, post);
        uniquePosts.set(titleKey, post);
      }
    } else {
      uniquePosts.set(urlKey, post);
      uniquePosts.set(titleKey, post);
    }
  }

  // Return unique posts sorted by engagement
  return Array.from(new Map(
    Array.from(uniquePosts.values()).map(post => [post.id, post])
  ).values()).sort((a, b) =>
    (b.score + b.num_comments) - (a.score + a.num_comments)
  );
}

function normalizeUrl(url: string): string {
  return url.toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/[?#].*$/, '')
    .trim();
}

function normalizeTitle(title: string): string {
  return title.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100); // First 100 chars for comparison
}

function normalizeContent(content: string): string {
  return content.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200); // First 200 chars
}

/**
 * IMPROVEMENT 2: Quality Scoring
 * Filter out low-quality posts before indexing
 */
export function filterByQuality(posts: SocialPost[], minScore: number = 50): SocialPost[] {
  return posts.filter(post => {
    const qualityScore = calculateQualityScore(post);
    return qualityScore >= minScore;
  });
}

function calculateQualityScore(post: SocialPost): number {
  let score = 50; // Base score

  // Engagement signals (0-30 points)
  const engagementScore = Math.min(30, (post.score + post.num_comments * 2) / 10);
  score += engagementScore;

  // Content quality (0-20 points)
  if (post.quality) {
    score += (1 - post.quality.spamScore) * 10; // Low spam = good
    score += post.quality.wordCount > 50 ? 10 : 5; // Substantial content
  }

  // Recency bonus (0-10 points)
  const ageInDays = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (ageInDays < 7) score += 10;
  else if (ageInDays < 30) score += 5;

  // Author credibility (0-10 points)
  if (post.author && post.author !== 'deleted' && post.author !== '[deleted]') {
    score += 5;
  }

  return Math.min(100, score);
}

/**
 * IMPROVEMENT 3: Enhanced Tag Extraction
 * Better keyword/tag extraction from content
 */
export function extractEnhancedTags(post: SocialPost): string[] {
  const text = `${post.title} ${post.content}`.toLowerCase();
  const existingTags = new Set(post.tags.map(t => t.toLowerCase()));

  // Common problem/opportunity keywords
  const problemKeywords = [
    'problem', 'issue', 'challenge', 'difficult', 'struggle', 'pain', 'frustration',
    'broken', 'slow', 'expensive', 'waste', 'inefficient', 'annoying', 'confusing',
    'lacking', 'missing', 'need', 'want', 'wish', 'hope', 'better', 'improve'
  ];

  const solutionKeywords = [
    'solution', 'tool', 'app', 'platform', 'service', 'software', 'product',
    'alternative', 'replacement', 'instead', 'better than', 'competitor'
  ];

  const techKeywords = [
    'ai', 'ml', 'machine learning', 'saas', 'api', 'sdk', 'cloud',
    'mobile', 'web', 'desktop', 'automation', 'analytics', 'data',
    'remote', 'virtual', 'distributed', 'async', 'realtime'
  ];

  // Extract relevant keywords
  const tags = [...existingTags];

  problemKeywords.forEach(keyword => {
    if (text.includes(keyword) && !tags.includes('problem')) {
      tags.push('problem');
    }
  });

  solutionKeywords.forEach(keyword => {
    if (text.includes(keyword) && !tags.includes('solution')) {
      tags.push('solution');
    }
  });

  techKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      tags.push(keyword.replace(/\s+/g, '-'));
    }
  });

  // Extract company/product mentions
  const productMentions = extractProductMentions(text);
  tags.push(...productMentions);

  return Array.from(new Set(tags)).slice(0, 20); // Max 20 tags
}

function extractProductMentions(text: string): string[] {
  const products: string[] = [];

  // Common patterns for product mentions
  const patterns = [
    /using (\w+)/g,
    /with (\w+)/g,
    /(\w+) is/g,
    /(\w+) has/g,
    /alternative to (\w+)/g,
    /instead of (\w+)/g,
  ];

  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 3) {
        products.push(match[1]);
      }
    }
  });

  return products.slice(0, 5);
}

/**
 * IMPROVEMENT 4: Relevance Scoring
 * Calculate how relevant a post is to the search query
 */
export function calculateRelevanceScore(post: SocialPost, query: string): number {
  const queryLower = query.toLowerCase();
  const titleLower = post.title.toLowerCase();
  const contentLower = post.content.toLowerCase();

  let relevance = 0;

  // Title match (most important)
  if (titleLower.includes(queryLower)) relevance += 50;
  else {
    // Partial word matches in title
    const queryWords = queryLower.split(/\s+/);
    const matchingWords = queryWords.filter(word =>
      word.length > 3 && titleLower.includes(word)
    );
    relevance += (matchingWords.length / queryWords.length) * 30;
  }

  // Content match
  if (contentLower.includes(queryLower)) relevance += 30;
  else {
    // Partial word matches in content
    const queryWords = queryLower.split(/\s+/);
    const matchingWords = queryWords.filter(word =>
      word.length > 3 && contentLower.includes(word)
    );
    relevance += (matchingWords.length / queryWords.length) * 20;
  }

  // Tag match
  const matchingTags = post.tags.filter(tag =>
    queryLower.includes(tag.toLowerCase()) || tag.toLowerCase().includes(queryLower)
  );
  relevance += matchingTags.length * 5;

  // Engagement boost
  relevance += Math.min(10, (post.score + post.num_comments) / 100);

  return Math.min(100, relevance);
}

/**
 * IMPROVEMENT 5: Time-based Freshness
 * Prioritize recent posts but keep high-engagement old ones
 */
export function applyFreshnessBoost(posts: SocialPost[]): SocialPost[] {
  const now = Date.now();

  return posts.map(post => {
    const ageInDays = (now - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24);

    // Calculate freshness score
    let freshnessScore = 1.0;
    if (ageInDays < 1) freshnessScore = 1.5;
    else if (ageInDays < 7) freshnessScore = 1.3;
    else if (ageInDays < 30) freshnessScore = 1.1;
    else if (ageInDays > 365) freshnessScore = 0.7;

    // Apply boost to relevance score
    post.relevance_score = (post.relevance_score || 0) * freshnessScore;

    return post;
  });
}

/**
 * IMPROVEMENT 6: Smart Filtering
 * Remove noise and low-value content
 */
export function removeNoise(posts: SocialPost[]): SocialPost[] {
  return posts.filter(post => {
    // Filter out deleted/removed content
    if (post.content.includes('[deleted]') || post.content.includes('[removed]')) {
      return false;
    }

    // Filter out very short posts (likely not useful)
    if (post.content.length < 50 && post.title.length < 20) {
      return false;
    }

    // Filter out obvious spam
    if (post.quality && post.quality.spamScore > 0.7) {
      return false;
    }

    // Filter out posts with no engagement and old
    const ageInDays = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > 30 && post.score === 0 && post.num_comments === 0) {
      return false;
    }

    return true;
  });
}

/**
 * IMPROVEMENT 7: Complete Processing Pipeline
 * Apply all quality filters and enhancements in sequence
 */
export function filterAndProcessPosts(posts: SocialPost[], query?: string): SocialPost[] {
  console.log(`[Post Processing] Starting with ${posts.length} posts`);

  // Step 1: Remove noise and spam
  let filteredPosts = removeNoise(posts);
  console.log(`[Post Processing] After noise removal: ${filteredPosts.length} posts`);

  // Step 2: Deduplicate
  filteredPosts = deduplicatePosts(filteredPosts);
  console.log(`[Post Processing] After deduplication: ${filteredPosts.length} posts`);

  // Step 3: Filter by quality
  filteredPosts = filterByQuality(filteredPosts, 40); // Min quality score of 40
  console.log(`[Post Processing] After quality filter: ${filteredPosts.length} posts`);

  // Step 4: Enhance tags
  filteredPosts = filteredPosts.map(post => ({
    ...post,
    tags: extractEnhancedTags(post),
  }));

  // Step 5: Calculate relevance scores (if query provided)
  if (query) {
    filteredPosts = filteredPosts.map(post => ({
      ...post,
      relevance_score: calculateRelevanceScore(post, query),
    }));

    // Sort by relevance
    filteredPosts.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
  }

  // Step 6: Apply freshness boost
  filteredPosts = applyFreshnessBoost(filteredPosts);

  console.log(`[Post Processing] Final: ${filteredPosts.length} high-quality posts`);

  return filteredPosts;
}
