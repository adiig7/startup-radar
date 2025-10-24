import type { SocialPost } from '../types';

export const deduplicatePosts = (posts: SocialPost[]): SocialPost[] => {
  const seenUrls = new Map<string, SocialPost>();
  const seenTitles = new Map<string, SocialPost>();
  const finalPosts = new Map<string, SocialPost>();

  for (const post of posts) {
    const urlKey = normalizeUrl(post.url);
    const titleKey = normalizeTitle(post.title);

    const existingByUrl = seenUrls.get(urlKey);
    const existingByTitle = seenTitles.get(titleKey);

    if (existingByUrl || existingByTitle) {
      const existing = existingByUrl || existingByTitle!;
      const newEngagement = post.score + post.num_comments;
      const existingEngagement = existing.score + existing.num_comments;

      if (newEngagement > existingEngagement) {
        finalPosts.delete(existing.id);
        seenUrls.set(urlKey, post);
        seenTitles.set(titleKey, post);
        finalPosts.set(post.id, post);
      }
    } else {
      seenUrls.set(urlKey, post);
      seenTitles.set(titleKey, post);
      finalPosts.set(post.id, post);
    }
  }

  const result = Array.from(finalPosts.values()).sort((a, b) =>
    (b.score + b.num_comments) - (a.score + a.num_comments)
  );

  const duplicatesRemoved = posts.length - result.length;
  if (duplicatesRemoved > 0) {
    console.log(`DEDUP Removed ${duplicatesRemoved} duplicate(s) from ${posts.length} posts`);
  }

  return result;
}

const normalizeUrl = (url: string): string => {
  return url.toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/[?#].*$/, '')
    .trim();
}

const normalizeTitle = (title: string): string => {
  return title.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100);
}

export const filterByQuality = (posts: SocialPost[], minScore: number = 50): SocialPost[] => {
  return posts.filter(post => {
    const qualityScore = calculateQualityScore(post);
    return qualityScore >= minScore;
  });
}

const calculateQualityScore = (post: SocialPost): number => {
  let score = 50;

  const engagementScore = Math.min(30, (post.score + post.num_comments * 2) / 10);
  score += engagementScore;

  if (post.quality) {
    score += (1 - post.quality.spamScore) * 10;
    score += post.quality.wordCount > 50 ? 10 : 5;
  }

  const ageInDays = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (ageInDays < 7) score += 10;
  else if (ageInDays < 30) score += 5;

  if (post.author && post.author !== 'deleted' && post.author !== '[deleted]') {
    score += 5;
  }

  return Math.min(100, score);
}

export const extractEnhancedTags = (post: SocialPost): string[] => {
  const text = `${post.title} ${post.content}`.toLowerCase();
  const existingTags = new Set(post.tags.map(t => t.toLowerCase()));

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

  const tags = [...existingTags];

  if (problemKeywords.some(k => text.includes(k)) && !tags.includes('problem')) {
    tags.push('problem');
  }

  if (solutionKeywords.some(k => text.includes(k)) && !tags.includes('solution')) {
    tags.push('solution');
  }

  techKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      tags.push(keyword.replace(/\s+/g, '-'));
    }
  });

  const productMentions = extractProductMentions(text);
  tags.push(...productMentions);

  return Array.from(new Set(tags)).slice(0, 20);
}

const extractProductMentions = (text: string): string[] => {
  const products: string[] = [];

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

export const calculateRelevanceScore = (post: SocialPost, query: string): number => {
  const queryLower = query.toLowerCase();
  const titleLower = post.title.toLowerCase();
  const contentLower = post.content.toLowerCase();

  let relevance = 0;

  if (titleLower.includes(queryLower)) relevance += 50;
  else {
    const queryWords = queryLower.split(/\s+/);
    const matchingWords = queryWords.filter(word =>
      word.length > 3 && titleLower.includes(word)
    );
    relevance += (matchingWords.length / queryWords.length) * 30;
  }

  if (contentLower.includes(queryLower)) relevance += 30;
  else {
    const queryWords = queryLower.split(/\s+/);
    const matchingWords = queryWords.filter(word =>
      word.length > 3 && contentLower.includes(word)
    );
    relevance += (matchingWords.length / queryWords.length) * 20;
  }

  const matchingTags = post.tags.filter(tag =>
    queryLower.includes(tag.toLowerCase()) || tag.toLowerCase().includes(queryLower)
  );
  relevance += matchingTags.length * 5;

  relevance += Math.min(10, (post.score + post.num_comments) / 100);

  return Math.min(100, relevance);
}

export const applyFreshnessBoost = (posts: SocialPost[]): SocialPost[] => {
  const now = Date.now();

  return posts.map(post => {
    const ageInDays = (now - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24);

    let freshnessScore = 1.0;
    if (ageInDays < 1) freshnessScore = 1.5;
    else if (ageInDays < 7) freshnessScore = 1.3;
    else if (ageInDays < 30) freshnessScore = 1.1;
    else if (ageInDays > 365) freshnessScore = 0.7;

    post.relevance_score = (post.relevance_score || 0) * freshnessScore;

    return post;
  });
}

export const removeNoise = (posts: SocialPost[]): SocialPost[] => {
  return posts.filter(post => {
    if (post.content.includes('[deleted]') || post.content.includes('[removed]')) {
      return false;
    }

    if (post.content.length < 50 && post.title.length < 20) {
      return false;
    }

    if (post.quality && post.quality.spamScore > 0.7) {
      return false;
    }

    const ageInDays = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > 30 && post.score === 0 && post.num_comments === 0) {
      return false;
    }

    return true;
  });
}

export const filterAndProcessPosts = (posts: SocialPost[], query?: string): SocialPost[] => {
  let filteredPosts = removeNoise(posts);
  filteredPosts = deduplicatePosts(filteredPosts);
  filteredPosts = filterByQuality(filteredPosts, 40);
  filteredPosts = filteredPosts.map(post => ({
    ...post,
    tags: extractEnhancedTags(post),
  }));

  if (query) {
    filteredPosts = filteredPosts.map(post => ({
      ...post,
      relevance_score: calculateRelevanceScore(post, query),
    }));

    filteredPosts.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
  }

  filteredPosts = applyFreshnessBoost(filteredPosts);
  return filteredPosts;
}
