// Reddit API connector for collecting startup signals

import type { SocialPost } from '../types';

/**
 * Fetch top posts from specific subreddits
 * Note: Using Reddit's public JSON API (no auth required for read-only)
 */
export async function fetchRedditPosts(
  subreddits: string[] = ['startups', 'Entrepreneur', 'SaaS', 'smallbusiness', 'sidehustle'],
  limit: number = 25
): Promise<SocialPost[]> {
  console.log(`\n📱 Fetching posts from ${subreddits.length} subreddits...`);

  const allPosts: SocialPost[] = [];

  for (const subreddit of subreddits) {
    try {
      // Use Reddit's public JSON API
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
        {
          headers: {
            'User-Agent': process.env.REDDIT_USER_AGENT || 'SignalScout/1.0',
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch r/${subreddit}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const posts = data.data.children.map((child: any) => normalizeRedditPost(child.data));

      allPosts.push(...posts);
      console.log(`  ✅ r/${subreddit}: ${posts.length} posts`);

      // Small delay to be respectful to Reddit's API
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error fetching r/${subreddit}:`, error);
    }
  }

  console.log(`✅ Total Reddit posts fetched: ${allPosts.length}`);
  return allPosts;
}

/**
 * Fetch posts containing specific keywords
 */
export async function searchRedditPosts(query: string, limit: number = 50): Promise<SocialPost[]> {
  console.log(`\n🔍 Searching Reddit for: "${query}"`);

  try {
    const response = await fetch(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=${limit}&sort=hot`,
      {
        headers: {
          'User-Agent': process.env.REDDIT_USER_AGENT || 'SignalScout/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Reddit search failed: ${response.status}`);
    }

    const data = await response.json();
    const posts = data.data.children.map((child: any) => normalizeRedditPost(child.data));

    console.log(`✅ Found ${posts.length} Reddit posts`);
    return posts;
  } catch (error) {
    console.error('Error searching Reddit:', error);
    return [];
  }
}

/**
 * Normalize Reddit post data to our SocialPost format
 */
function normalizeRedditPost(post: any): SocialPost {
  return {
    id: `reddit_${post.id}`,
    platform: 'reddit',
    title: post.title,
    content: post.selftext || post.title, // Use title if no selftext
    author: post.author,
    url: `https://www.reddit.com${post.permalink}`,
    created_at: new Date(post.created_utc * 1000),
    score: post.score || 0,
    num_comments: post.num_comments || 0,
    tags: [post.subreddit], // Subreddit as tag
    indexed_at: new Date(),
  };
}

/**
 * Fetch comments from a specific Reddit post (for deeper analysis)
 */
export async function fetchRedditComments(postId: string): Promise<string[]> {
  try {
    // Remove 'reddit_' prefix if present
    const cleanId = postId.replace('reddit_', '');

    const response = await fetch(`https://www.reddit.com/comments/${cleanId}.json`, {
      headers: {
        'User-Agent': process.env.REDDIT_USER_AGENT || 'SignalScout/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.status}`);
    }

    const data = await response.json();

    // Extract top-level comments
    const comments: string[] = [];
    if (data[1]?.data?.children) {
      data[1].data.children.forEach((child: any) => {
        if (child.data.body && child.data.body !== '[deleted]' && child.data.body !== '[removed]') {
          comments.push(child.data.body);
        }
      });
    }

    return comments.slice(0, 20); // Top 20 comments
  } catch (error) {
    console.error('Error fetching Reddit comments:', error);
    return [];
  }
}
