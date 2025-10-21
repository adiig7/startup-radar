// Hacker News API connector for collecting startup signals

import type { SocialPost } from '../types';

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

/**
 * Fetch top stories from Hacker News
 */
export async function fetchHackerNewsStories(limit: number = 30): Promise<SocialPost[]> {
  console.log('\n🔶 Fetching Hacker News stories...');

  try {
    // Get top story IDs
    const topStoriesResponse = await fetch(`${HN_API_BASE}/topstories.json`);
    const storyIds: number[] = await topStoriesResponse.json();

    // Fetch details for top stories
    const stories = await Promise.all(
      storyIds.slice(0, limit).map((id) => fetchStoryDetails(id))
    );

    // Filter out null values (failed fetches)
    const validStories = stories.filter((story): story is SocialPost => story !== null);

    console.log(`✅ Fetched ${validStories.length} Hacker News stories`);
    return validStories;
  } catch (error) {
    console.error('Error fetching Hacker News stories:', error);
    return [];
  }
}

/**
 * Fetch "Ask HN" posts (great for finding problems/pain points)
 */
export async function fetchAskHNPosts(limit: number = 20): Promise<SocialPost[]> {
  console.log('\n🔶 Fetching Ask HN posts...');

  try {
    const askStoriesResponse = await fetch(`${HN_API_BASE}/askstories.json`);
    const storyIds: number[] = await askStoriesResponse.json();

    const stories = await Promise.all(
      storyIds.slice(0, limit).map((id) => fetchStoryDetails(id))
    );

    const validStories = stories.filter((story): story is SocialPost => story !== null);

    console.log(`✅ Fetched ${validStories.length} Ask HN posts`);
    return validStories;
  } catch (error) {
    console.error('Error fetching Ask HN posts:', error);
    return [];
  }
}

/**
 * Fetch "Show HN" posts (product launches and demos)
 */
export async function fetchShowHNPosts(limit: number = 20): Promise<SocialPost[]> {
  console.log('\n🔶 Fetching Show HN posts...');

  try {
    const showStoriesResponse = await fetch(`${HN_API_BASE}/showstories.json`);
    const storyIds: number[] = await showStoriesResponse.json();

    const stories = await Promise.all(
      storyIds.slice(0, limit).map((id) => fetchStoryDetails(id))
    );

    const validStories = stories.filter((story): story is SocialPost => story !== null);

    console.log(`✅ Fetched ${validStories.length} Show HN posts`);
    return validStories;
  } catch (error) {
    console.error('Error fetching Show HN posts:', error);
    return [];
  }
}

/**
 * Fetch details for a specific story
 */
async function fetchStoryDetails(id: number): Promise<SocialPost | null> {
  try {
    const response = await fetch(`${HN_API_BASE}/item/${id}.json`);
    const story = await response.json();

    if (!story || story.deleted || story.dead) {
      return null;
    }

    return normalizeHNStory(story);
  } catch (error) {
    console.error(`Error fetching HN story ${id}:`, error);
    return null;
  }
}

/**
 * Normalize Hacker News story to our SocialPost format
 */
function normalizeHNStory(story: any): SocialPost {
  // Determine tags based on story type
  const tags: string[] = [];
  if (story.type) tags.push(story.type);
  if (story.title?.toLowerCase().startsWith('ask hn')) tags.push('Ask HN');
  if (story.title?.toLowerCase().startsWith('show hn')) tags.push('Show HN');

  return {
    id: `hn_${story.id}`,
    platform: 'hackernews',
    title: story.title || 'No title',
    content: story.text || story.title || '', // Use text for Ask HN, title for links
    author: story.by || 'anonymous',
    url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
    created_at: new Date(story.time * 1000),
    score: story.score || 0,
    num_comments: story.descendants || 0,
    tags,
    indexed_at: new Date(),
  };
}

/**
 * Search Hacker News using Algolia (HN's search provider)
 */
export async function searchHackerNews(query: string, limit: number = 30): Promise<SocialPost[]> {
  console.log(`\n🔍 Searching Hacker News for: "${query}"`);

  try {
    const response = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&hitsPerPage=${limit}`
    );

    const data = await response.json();

    const posts = data.hits.map((hit: any) => ({
      id: `hn_${hit.objectID}`,
      platform: 'hackernews' as const,
      title: hit.title || hit.story_title || 'No title',
      content: hit.story_text || hit.comment_text || hit.title || '',
      author: hit.author || 'anonymous',
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      created_at: new Date(hit.created_at),
      score: hit.points || 0,
      num_comments: hit.num_comments || 0,
      tags: hit._tags || [],
      indexed_at: new Date(),
    }));

    console.log(`✅ Found ${posts.length} Hacker News results`);
    return posts;
  } catch (error) {
    console.error('Error searching Hacker News:', error);
    return [];
  }
}
