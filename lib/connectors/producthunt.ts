import type { SocialPost } from '../types';

const PRODUCT_HUNT_API = 'https://api.producthunt.com/v2/api/graphql';

export async function fetchProductHuntPosts(limit: number = 20): Promise<SocialPost[]> {
  const token = process.env.PRODUCTHUNT_API_TOKEN;
  if (!token) {
    console.warn(`PRODUCTHUNT_API_TOKEN not set`);
    return [];
  }

  try {
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
      console.error(`ProductHunt API Error: ${response.status} - ${JSON.stringify(errorData)}`);
      throw new Error(`Product Hunt API failed: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error(`Product Hunt GraphQL errors: ${JSON.stringify(data.errors)}`);
      throw new Error(`GraphQL query failed: ${JSON.stringify(data.errors)}`);
    }

    const posts = data.data.posts.edges.map((edge: any) => normalizeProductHuntPost(edge.node));

    return posts;
  } catch (error) {
    console.error(`Error fetching Product Hunt posts: ${error}`);
    return [];
  }
}

export async function fetchProductHuntByTopic(topic: string, limit: number = 20): Promise<SocialPost[]> {
  const token = process.env.PRODUCTHUNT_API_TOKEN;
  if (!token) {
    console.warn(`PRODUCTHUNT_API_TOKEN not set`);
    return [];
  }

  try {
    const fetchLimit = Math.min(limit * 5, 50);

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
      console.error(`ProductHunt API Error: ${response.status} : ${JSON.stringify(errorData)}`);
      throw new Error(`Product Hunt API failed: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error(`Product Hunt GraphQL errors: ${JSON.stringify(data.errors)}`);
      throw new Error(`GraphQL query failed: ${JSON.stringify(data.errors)}`);
    }

    const allPosts = data.data.posts.edges.map((edge: any) => normalizeProductHuntPost(edge.node));

    const topicLower = topic.toLowerCase();
    const filteredPosts = allPosts.filter((post: SocialPost) =>
      post.tags.some((tag: string) => tag.toLowerCase().includes(topicLower))
    ).slice(0, limit);

    return filteredPosts;
  } catch (error) {
    console.error(`Error searching Product Hunt: ${error}`);
    return [];
  }
}


function normalizeProductHuntPost(post: any): SocialPost {
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
