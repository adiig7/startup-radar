import type { SocialPost } from '../types';

export async function fetchRedditPosts(
  subreddits: string[] = ['startups', 'Entrepreneur', 'SaaS', 'smallbusiness', 'sidehustle'],
  limit: number = 25
): Promise<SocialPost[]> {
  console.log(`\n📱 Fetching posts from ${subreddits.length} subreddits...`);

  const allPosts: SocialPost[] = [];

  for (const subreddit of subreddits) {
    try {
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
        {
          headers: {
            'User-Agent': process.env.REDDIT_USER_AGENT || 'StartupRadar/1.0',
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

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error fetching r/${subreddit}:`, error);
    }
  }

  console.log(`✅ Total Reddit posts fetched: ${allPosts.length}`);
  return allPosts;
}

export async function searchRedditPosts(query: string, limit: number = 50): Promise<SocialPost[]> {
  console.log(`\n🔍 Searching Reddit for: "${query}"`);

  try {
    const response = await fetch(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=${limit}&sort=hot`,
      {
        headers: {
          'User-Agent': process.env.REDDIT_USER_AGENT || 'StartupRadar/1.0',
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

function normalizeRedditPost(post: any): SocialPost {
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

