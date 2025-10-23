import axios from 'axios';
import type { SocialPost } from '../types';

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

async function fetchStories(endpoint: string, limit: number): Promise<SocialPost[]> {
  try {
    const { data: storyIds } = await axios.get(`${HN_API_BASE}/${endpoint}.json`);
    const stories = await Promise.all(storyIds.slice(0, limit).map(fetchStoryDetails));
    return stories.filter((story): story is SocialPost => story !== null);
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return [];
  }
}

export const fetchHackerNewsStories = (limit = 30) => fetchStories('topstories', limit);
export const fetchAskHNPosts = (limit = 20) => fetchStories('askstories', limit);
export const fetchShowHNPosts = (limit = 20) => fetchStories('showstories', limit);

async function fetchStoryDetails(id: number): Promise<SocialPost | null> {
  try {
    const { data: story } = await axios.get(`${HN_API_BASE}/item/${id}.json`);

    if (!story || story.deleted || story.dead) return null;

    const titleLower = story.title?.toLowerCase() || '';
    const tags = [
      story.type,
      titleLower.startsWith('ask hn') && 'Ask HN',
      titleLower.startsWith('show hn') && 'Show HN'
    ].filter(Boolean);

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
  } catch (error) {
    console.error(`Error fetching story ${id}:`, error);
    return null;
  }
}

export async function searchHackerNews(query: string, limit = 30): Promise<SocialPost[]> {
  try {
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&hitsPerPage=${limit}`;
    const { data: { hits } } = await axios.get(url);

    return hits.map((hit: any) => ({
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
  } catch (error) {
    console.error('Error searching HN:', error);
    return [];
  }
}
