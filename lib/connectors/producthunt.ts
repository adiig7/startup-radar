// Product Hunt API connector for collecting startup signals
// API Docs: https://api.producthunt.com/v2/docs

import type { SocialPost } from '../types';

const PRODUCT_HUNT_API = 'https://api.producthunt.com/v2/api/graphql';

/**
 * Fetch today's featured products from Product Hunt
 */
export async function fetchProductHuntPosts(limit: number = 20): Promise<SocialPost[]> {
  console.log('\n🚀 Fetching Product Hunt posts...');

  const token = process.env.PRODUCTHUNT_API_TOKEN;
  if (!token) {
    console.warn('⚠️  PRODUCTHUNT_API_TOKEN not set. Skipping Product Hunt.');
    return [];
  }

  try {
    // GraphQL query to get today's posts
    const query = `
      query {
        posts(first: ${limit}, order: VOTES) {
          edges {
            node {
              id
              name
              tagline
              description
              votesCount
              commentsCount
              createdAt
              url
              website
              topics {
                edges {
                  node {
                    name
                  }
                }
              }
              user {
                name
                username
              }
            }
          }
        }
      }
    `;

    const response = await fetch(PRODUCT_HUNT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('ProductHunt API Error:', response.status, errorData);
      throw new Error(`Product Hunt API failed: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('[ProductHunt] API Response:', JSON.stringify(data, null, 2).substring(0, 500));

    if (data.errors) {
      console.error('Product Hunt GraphQL errors:', JSON.stringify(data.errors, null, 2));
      throw new Error(`GraphQL query failed: ${JSON.stringify(data.errors)}`);
    }

    const posts = data.data.posts.edges.map((edge: any) => normalizeProductHuntPost(edge.node));

    console.log(`✅ Fetched ${posts.length} Product Hunt posts`);
    return posts;
  } catch (error) {
    console.error('Error fetching Product Hunt posts:', error);
    return [];
  }
}

/**
 * Fetch posts by specific topic/category
 * Note: ProductHunt GraphQL doesn't support topic filtering in the query,
 * so we fetch more posts and filter client-side
 */
export async function fetchProductHuntByTopic(topic: string, limit: number = 20): Promise<SocialPost[]> {
  console.log(`\n🔍 Searching Product Hunt for topic: "${topic}"`);

  const token = process.env.PRODUCTHUNT_API_TOKEN;
  if (!token) {
    console.warn('⚠️  PRODUCTHUNT_API_TOKEN not set. Skipping Product Hunt.');
    return [];
  }

  try {
    // Fetch more posts than needed since we'll filter client-side
    const fetchLimit = Math.min(limit * 5, 50); // Fetch 5x to ensure we get enough after filtering

    const query = `
      query {
        posts(first: ${fetchLimit}, order: VOTES) {
          edges {
            node {
              id
              name
              tagline
              description
              votesCount
              commentsCount
              createdAt
              url
              website
              topics {
                edges {
                  node {
                    name
                  }
                }
              }
              user {
                name
                username
              }
            }
          }
        }
      }
    `;

    const response = await fetch(PRODUCT_HUNT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('ProductHunt API Error:', response.status, errorData);
      throw new Error(`Product Hunt API failed: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error('Product Hunt GraphQL errors:', JSON.stringify(data.errors, null, 2));
      throw new Error(`GraphQL query failed: ${JSON.stringify(data.errors)}`);
    }

    // Normalize all posts
    const allPosts = data.data.posts.edges.map((edge: any) => normalizeProductHuntPost(edge.node));

    // Filter by topic (case-insensitive partial match)
    const topicLower = topic.toLowerCase();
    const filteredPosts = allPosts.filter((post: SocialPost) =>
      post.tags.some((tag: string) => tag.toLowerCase().includes(topicLower))
    ).slice(0, limit); // Return only the requested limit

    console.log(`✅ Found ${filteredPosts.length} posts for topic "${topic}" (from ${allPosts.length} total)`);
    return filteredPosts;
  } catch (error) {
    console.error('Error searching Product Hunt:', error);
    return [];
  }
}

/**
 * Fetch featured posts from a specific date
 */
export async function fetchProductHuntByDate(date: string, limit: number = 20): Promise<SocialPost[]> {
  console.log(`\n📅 Fetching Product Hunt posts from: ${date}`);

  const token = process.env.PRODUCTHUNT_API_TOKEN;
  if (!token) {
    console.warn('⚠️  PRODUCTHUNT_API_TOKEN not set. Skipping Product Hunt.');
    return [];
  }

  try {
    const query = `
      query {
        posts(first: ${limit}, postedAfter: "${date}", order: VOTES) {
          edges {
            node {
              id
              name
              tagline
              description
              votesCount
              commentsCount
              createdAt
              url
              website
              topics {
                edges {
                  node {
                    name
                  }
                }
              }
              user {
                name
                username
              }
            }
          }
        }
      }
    `;

    const response = await fetch(PRODUCT_HUNT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('ProductHunt API Error:', response.status, errorData);
      throw new Error(`Product Hunt API failed: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('[ProductHunt] API Response:', JSON.stringify(data, null, 2).substring(0, 500));

    if (data.errors) {
      console.error('Product Hunt GraphQL errors:', JSON.stringify(data.errors, null, 2));
      throw new Error(`GraphQL query failed: ${JSON.stringify(data.errors)}`);
    }

    const posts = data.data.posts.edges.map((edge: any) => normalizeProductHuntPost(edge.node));

    console.log(`✅ Fetched ${posts.length} posts from ${date}`);
    return posts;
  } catch (error) {
    console.error('Error fetching Product Hunt by date:', error);
    return [];
  }
}

/**
 * Normalize Product Hunt post to our SocialPost format
 */
function normalizeProductHuntPost(post: any): SocialPost {
  // Extract topics/tags
  const topics = post.topics?.edges?.map((edge: any) => edge.node.name) || [];

  return {
    id: `producthunt_${post.id}`,
    platform: 'producthunt',
    title: post.name,
    content: `${post.tagline}\n\n${post.description || ''}`.trim(),
    author: post.user?.username || post.user?.name || 'anonymous',
    url: post.url || post.website || `https://www.producthunt.com/posts/${post.id}`,
    created_at: new Date(post.createdAt),
    score: post.votesCount || 0,
    num_comments: post.commentsCount || 0,
    tags: ['Product Hunt', ...topics],
    indexed_at: new Date(),
  };
}

/**
 * Get popular topics/categories for filtering
 */
export const PRODUCT_HUNT_TOPICS = [
  'AI',
  'SaaS',
  'Developer Tools',
  'Productivity',
  'Design Tools',
  'Marketing',
  'Analytics',
  'No-Code',
  'Mobile',
  'Web App',
  'Chrome Extension',
  'API',
  'Open Source',
  'Social Media',
  'Finance',
];
