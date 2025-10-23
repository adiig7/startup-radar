import type { SocialPost } from '../types';

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

export async function fetchHackerNewsStories(limit: number = 30): Promise<SocialPost[]> {
  try {
    const topStoriesResponse = await fetch(`${HN_API_BASE}/topstories.json`);
    const storyIds: number[] = await topStoriesResponse.json();

    const stories = await Promise.all(
      storyIds.slice(0, limit).map((id) => fetchStoryDetails(id))
    );

    const validStories = stories.filter((story): story is SocialPost => story !== null);
    return validStories;
  } catch (error) {
    console.error(`Error fetching Hacker News stories: ${error}`);
    return [];
  }
}

export async function fetchAskHNPosts(limit: number = 20): Promise<SocialPost[]> {
  try {
    const askStoriesResponse = await fetch(`${HN_API_BASE}/askstories.json`);
    const storyIds: number[] = await askStoriesResponse.json();

    const stories = await Promise.all(
      storyIds.slice(0, limit).map((id) => fetchStoryDetails(id))
    );

    const validStories = stories.filter((story): story is SocialPost => story !== null);
    return validStories;
  } catch (error) {
    console.error(`Error fetching Ask HN posts: ${error}`);
    return [];
  }
}

export async function fetchShowHNPosts(limit: number = 20): Promise<SocialPost[]> {
  try {
    const showStoriesResponse = await fetch(`${HN_API_BASE}/showstories.json`);
    const storyIds: number[] = await showStoriesResponse.json();

    const stories = await Promise.all(
      storyIds.slice(0, limit).map((id) => fetchStoryDetails(id))
    );

    const validStories = stories.filter((story): story is SocialPost => story !== null);
    return validStories;
  } catch (error) {
    console.error(`Error fetching Show HN posts: ${error}`);
    return [];
  }
}

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

function normalizeHNStory(story: any): SocialPost {
  const tags: string[] = [];
  if (story.type) tags.push(story.type);
  if (story.title?.toLowerCase().startsWith('ask hn')) tags.push('Ask HN');
  if (story.title?.toLowerCase().startsWith('show hn')) tags.push('Show HN');

  return {
    id: `hn_${story.id}`,
    platform: 'hackernews',
    title: story.title || 'No title',
    content: story.text || story.title || '',
    author: story.by || 'anonymous',
    url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
    created_at: new Date(story.time * 1000),
    score: story.score || 0,
    num_comments: story.descendants || 0,
    tags,
    indexed_at: new Date(),
  };
}

export async function searchHackerNews(query: string, limit: number = 30): Promise<SocialPost[]> {
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

    return posts;
  } catch (error) {
    console.error(`Error searching Hacker News: ${error}`);
    return [];
  }
}
