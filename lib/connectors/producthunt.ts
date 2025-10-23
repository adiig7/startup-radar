import axios from 'axios';
import type { SocialPost } from '../types';

const PRODUCT_HUNT_API = 'https://api.producthunt.com/v2/api/graphql';

const POSTS_QUERY = (limit: number) => `
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

const queryProductHunt = async (limit: number): Promise<SocialPost[]> => {
  const token = process.env.PRODUCTHUNT_API_TOKEN;
  if (!token) {
    console.warn('PRODUCTHUNT_API_TOKEN not set');
    return [];
  }

  try {
    const { data } = await axios.post(
      PRODUCT_HUNT_API,
      { query: POSTS_QUERY(limit) },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (data.errors) throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);

    return data.data.posts.edges.map((edge: any) => normalizeProductHuntPost(edge.node));
  } catch (error) {
    console.error('Product Hunt error:', error);
    return [];
  }
}

export const fetchProductHuntPosts = (limit = 20) => queryProductHunt(limit);

export const fetchProductHuntByTopic = async (topic: string, limit = 20): Promise<SocialPost[]> => {
  const allPosts = await queryProductHunt(Math.min(limit * 5, 50));
  const topicLower = topic.toLowerCase();

  return allPosts
    .filter((post: any) => post.tags.some((tag: any) => tag.toLowerCase().includes(topicLower)))
    .slice(0, limit);
}


const normalizeProductHuntPost = (post: any): SocialPost => {
  const topics = post.topics?.edges?.map((edge: any) => edge.node.name) || [];
  const content = [post.tagline, post.description].filter(Boolean).join('\n\n');

  return {
    id: `producthunt_${post.id}`,
    platform: 'producthunt',
    title: post.name,
    content,
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
