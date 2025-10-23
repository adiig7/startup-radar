import axios from 'axios';
import type { SocialPost } from '../types';

const USER_AGENT = process.env.REDDIT_USER_AGENT || 'StartupRadar/1.0';

const fetchRedditJSON = async (url: string): Promise<any> => {
  const { data } = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
  return data;
}

export const fetchRedditPosts = async (
  subreddits = ['startups', 'Entrepreneur', 'SaaS', 'smallbusiness', 'sidehustle'],
  limit = 25
): Promise<SocialPost[]> => {
  const allPosts: SocialPost[] = [];

  for (const subreddit of subreddits) {
    try {
      const data = await fetchRedditJSON(`https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`);
      const posts = data.data.children.map((child: any) => normalizeRedditPost(child.data));
      allPosts.push(...posts);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error fetching r/${subreddit}:`, error);
    }
  }
  return allPosts;
}

export const searchRedditPosts = async (query: string, limit = 50): Promise<SocialPost[]> => {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=${limit}&sort=hot`;
    const data = await fetchRedditJSON(url);
    return data.data.children.map((child: any) => normalizeRedditPost(child.data));
  } catch (error) {
    console.error('Error searching Reddit:', error);
    return [];
  }
}

const normalizeRedditPost = (post: any): SocialPost => {
  return {
    id: `reddit_${post.id}`,
    platform: 'reddit',
    title: post.title,
    content: post.selftext || post.title,
    author: post.author,
    url: `https://www.reddit.com${post.permalink}`,
    created_at: new Date(post.created_utc * 1000),
    score: post.score || 0,
    num_comments: post.num_comments || 0,
    tags: [post.subreddit],
    indexed_at: new Date(),
  };
}

