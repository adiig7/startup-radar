import axios from 'axios';
import type { SocialPost } from '../types';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

const youtubeRequest = async (endpoint: string, params: Record<string, string>): Promise<any> => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY not found');

  try {
    const { data } = await axios.get(`${YOUTUBE_API_BASE}/${endpoint}`, {
      params: { ...params, key: apiKey }
    });

    if (data.error) throw new Error(data.error.message);
    return data;
  } catch (error: any) {
    throw new Error(`YouTube API failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

export const searchYouTubeVideos = async (
  keyword: string,
  options: { numOfPosts?: number; startDate?: string; endDate?: string } = {}
): Promise<SocialPost[]> => {
  try {
    const searchParams: Record<string, string> = {
      part: 'snippet',
      q: keyword,
      type: 'video',
      maxResults: Math.min(options.numOfPosts || 25, 50).toString(),
      order: 'relevance',
    };

    if (options.startDate) searchParams.publishedAfter = `${options.startDate}T00:00:00Z`;
    if (options.endDate) searchParams.publishedBefore = `${options.endDate}T23:59:59Z`;

    const searchData = await youtubeRequest('search', searchParams);
    if (!searchData.items?.length) return [];

    const videoIds = searchData.items
      .filter((item: any) => item.id?.videoId)
      .map((item: any) => item.id.videoId)
      .join(',');

    if (!videoIds) return [];

    const detailsData = await youtubeRequest('videos', {
      part: 'snippet,statistics',
      id: videoIds,
    });

    return detailsData.items.map(normalizeYouTubeVideo);
  } catch (error) {
    console.error('YouTube error:', error);
    return [];
  }
}


const normalizeYouTubeVideo = (video: any): SocialPost => {
  const { id, snippet = {}, statistics = {} } = video;

  const tags = [
    'YouTube',
    snippet.categoryId && `category_${snippet.categoryId}`,
    snippet.liveBroadcastContent === 'live' && 'live',
    snippet.channelTitle,
    ...(snippet.tags || []).slice(0, 5)
  ].filter(Boolean);

  return {
    id: `youtube_${id}`,
    platform: 'youtube',
    title: snippet.title || 'No title',
    content: snippet.description || snippet.title || '',
    author: snippet.channelTitle || 'Unknown',
    url: `https://www.youtube.com/watch?v=${id}`,
    created_at: new Date(snippet.publishedAt || Date.now()),
    score: parseInt(statistics.likeCount || '0', 10),
    num_comments: parseInt(statistics.commentCount || '0', 10),
    tags,
    indexed_at: new Date(),
  };
}

