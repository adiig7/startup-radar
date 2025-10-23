import type { SocialPost } from '../types';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export async function searchYouTubeVideos(
  keyword: string,
  options: {
    numOfPosts?: number;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<SocialPost[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error('YOUTUBE_API_KEY not found in environment variables');
    return [];
  }

  try {
    const maxResults = Math.min(options.numOfPosts || 25, 50);
    const publishedAfter = options.startDate ? `${options.startDate}T00:00:00Z` : undefined;
    const publishedBefore = options.endDate ? `${options.endDate}T23:59:59Z` : undefined;

    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: keyword,
      type: 'video',
      maxResults: maxResults.toString(),
      order: 'relevance',
      key: apiKey,
    });

    if (publishedAfter) {
      searchParams.set('publishedAfter', publishedAfter);
    }
    if (publishedBefore) {
      searchParams.set('publishedBefore', publishedBefore);
    }

    const searchResponse = await fetch(
      `${YOUTUBE_API_BASE}/search?${searchParams}`
    );

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}));
      console.error('YouTube API Error:', searchResponse.status, errorData);
      throw new Error(`YouTube API search failed: ${searchResponse.status} - ${errorData.error?.message || searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();

    if (searchData.error) {
      console.error('YouTube API Error:', searchData.error);
      throw new Error(`YouTube API error: ${searchData.error.message}`);
    }

    if (!searchData.items || searchData.items.length === 0) {
      console.error('No videos found for the search query');
      return [];
    }

    const videoIds = searchData.items
      .filter((item: any) => item.id && item.id.videoId)
      .map((item: any) => item.id.videoId)
      .join(',');

    if (!videoIds) {
      console.error('No valid video IDs found');
      return [];
    }

    const detailsParams = new URLSearchParams({
      part: 'snippet,statistics',
      id: videoIds,
      key: apiKey,
    });

    const detailsResponse = await fetch(
      `${YOUTUBE_API_BASE}/videos?${detailsParams}`
    );

    if (!detailsResponse.ok) {
      const errorData = await detailsResponse.json().catch(() => ({}));
      console.error(`YouTube API Error (videos): ${detailsResponse.status} - ${JSON.stringify(errorData)}`);
      throw new Error(`YouTube API details request failed: ${detailsResponse.status} - ${errorData.error?.message || detailsResponse.statusText}`);
    }

    const detailsData = await detailsResponse.json();

    if (detailsData.error) {
      console.error(`YouTube API Error (videos): ${JSON.stringify(detailsData.error)}`);
      throw new Error(`YouTube API error: ${detailsData.error.message}`);
    }

    const posts = detailsData.items.map((video: any) => normalizeYouTubeVideo(video));

    return posts;
  } catch (error) {
    console.error(`Error searching YouTube: ${error}`);
    return [];
  }
}


function normalizeYouTubeVideo(video: any): SocialPost {
  const videoId = video.id;
  const snippet = video.snippet || {};
  const statistics = video.statistics || {};

  const createdAt = snippet.publishedAt ? new Date(snippet.publishedAt) : new Date();

  const tags: string[] = ['YouTube'];
  if (snippet.categoryId) tags.push(`category_${snippet.categoryId}`);
  if (snippet.liveBroadcastContent === 'live') tags.push('live');
  if (snippet.channelTitle) tags.push(snippet.channelTitle);

  if (snippet.tags && Array.isArray(snippet.tags)) {
    tags.push(...snippet.tags.slice(0, 5));
  }

  const content = snippet.description || snippet.title || '';

  return {
    id: `youtube_${videoId}`,
    platform: 'youtube',
    title: snippet.title || 'No title',
    content: content,
    author: snippet.channelTitle || 'Unknown',
    url: `https://www.youtube.com/watch?v=${videoId}`,
    created_at: createdAt,
    score: parseInt(statistics.likeCount || '0', 10),
    num_comments: parseInt(statistics.commentCount || '0', 10),
    tags,
    indexed_at: new Date(),
  };
}

