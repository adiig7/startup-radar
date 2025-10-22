// YouTube API connector using YouTube Data API v3 for collecting startup signals

import type { SocialPost } from '../types';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Search YouTube videos by keywords using YouTube Data API v3
 *
 * Setup:
 * 1. Create a project in Google Cloud Console: https://console.cloud.google.com
 * 2. Enable YouTube Data API v3
 * 3. Create credentials → API Key
 * 4. Add YOUTUBE_API_KEY to your .env.local file
 *
 * Quota: Each search costs 100 units. Free tier: 10,000 units/day = ~100 searches
 */
export async function searchYouTubeVideos(
  keyword: string,
  options: {
    numOfPosts?: number;
    startDate?: string; // ISO date format (YYYY-MM-DD)
    endDate?: string; // ISO date format (YYYY-MM-DD)
  } = {}
): Promise<SocialPost[]> {
  console.log(`\n📺 Searching YouTube for: "${keyword}"`);

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error('❌ YOUTUBE_API_KEY not found in environment variables');
    console.log('Please add your YouTube API key to .env file');
    return [];
  }

  // Validate API key format
  if (!apiKey.startsWith('AIzaSy')) {
    console.error('❌ Invalid YouTube API key format detected!');
    console.error('Expected: AIzaSy... (39 characters)');
    console.error('Got:', apiKey.substring(0, 10) + '...');
    console.error('\nTo get a valid YouTube Data API v3 key:');
    console.error('1. Go to https://console.cloud.google.com');
    console.error('2. Enable "YouTube Data API v3"');
    console.error('3. Create credentials → API Key');
    console.error('4. Copy the key to .env.local as YOUTUBE_API_KEY');
    return [];
  }

  try {
    const maxResults = Math.min(options.numOfPosts || 25, 50); // YouTube API max is 50
    const publishedAfter = options.startDate ? `${options.startDate}T00:00:00Z` : undefined;
    const publishedBefore = options.endDate ? `${options.endDate}T23:59:59Z` : undefined;

    // Build search parameters
    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: keyword,
      type: 'video',
      maxResults: maxResults.toString(),
      order: 'relevance',
      key: apiKey,
    });

    // Add optional date filters
    if (publishedAfter) {
      searchParams.set('publishedAfter', publishedAfter);
    }
    if (publishedBefore) {
      searchParams.set('publishedBefore', publishedBefore);
    }

    // First, search for videos
    const searchResponse = await fetch(
      `${YOUTUBE_API_BASE}/search?${searchParams}`
    );

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}));
      console.error('YouTube API Error:', searchResponse.status, errorData);
      throw new Error(`YouTube API search failed: ${searchResponse.status} - ${errorData.error?.message || searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();

    // Check for API errors
    if (searchData.error) {
      console.error('YouTube API Error:', searchData.error);
      throw new Error(`YouTube API error: ${searchData.error.message}`);
    }

    if (!searchData.items || searchData.items.length === 0) {
      console.log('⚠️  No videos found for the search query');
      return [];
    }

    // Get video IDs for detailed information
    const videoIds = searchData.items
      .filter((item: any) => item.id && item.id.videoId) // Filter out invalid items
      .map((item: any) => item.id.videoId)
      .join(',');

    if (!videoIds) {
      console.log('⚠️  No valid video IDs found');
      return [];
    }

    // Get detailed video information including statistics
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
      console.error('YouTube API Error (videos):', detailsResponse.status, errorData);
      throw new Error(`YouTube API details request failed: ${detailsResponse.status} - ${errorData.error?.message || detailsResponse.statusText}`);
    }

    const detailsData = await detailsResponse.json();

    // Check for API errors in response
    if (detailsData.error) {
      console.error('YouTube API Error (videos):', detailsData.error);
      throw new Error(`YouTube API error: ${detailsData.error.message}`);
    }

    // Combine search results with detailed information
    const posts = detailsData.items.map((video: any) => normalizeYouTubeVideo(video));

    console.log(`✅ Found ${posts.length} YouTube videos`);
    return posts;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return [];
  }
}

/**
 * Fetch YouTube video data by URL using YouTube Data API
 */
export async function fetchYouTubeVideoByUrl(videoUrl: string): Promise<SocialPost | null> {
  console.log(`\n📺 Fetching YouTube video: ${videoUrl}`);

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error('❌ YOUTUBE_API_KEY not found in environment variables');
    return null;
  }

  try {
    // Extract video ID from URL
    const videoId = extractVideoIdFromUrl(videoUrl);
    if (!videoId) {
      console.error('❌ Invalid YouTube URL - could not extract video ID');
      return null;
    }

    // Get video details
    const params = new URLSearchParams({
      part: 'snippet,statistics',
      id: videoId,
      key: apiKey,
    });

    const response = await fetch(
      `${YOUTUBE_API_BASE}/videos?${params}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('YouTube API Error (fetchByUrl):', response.status, errorData);
      throw new Error(`YouTube API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Check for API errors
    if (data.error) {
      console.error('YouTube API Error (fetchByUrl):', data.error);
      throw new Error(`YouTube API error: ${data.error.message}`);
    }

    if (!data.items || data.items.length === 0) {
      console.log('⚠️  No video data found');
      return null;
    }

    const post = normalizeYouTubeVideo(data.items[0]);
    console.log(`✅ Fetched YouTube video: ${post.title}`);
    return post;
  } catch (error) {
    console.error('Error fetching YouTube video:', error);
    return null;
  }
}

/**
 * Extract video ID from YouTube URL
 */
function extractVideoIdFromUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/,
    /youtube\.com\/embed\/([^&?/]+)/,
    /youtube\.com\/v\/([^&?/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Normalize YouTube video data to our SocialPost format
 */
function normalizeYouTubeVideo(video: any): SocialPost {
  const videoId = video.id;
  const snippet = video.snippet || {};
  const statistics = video.statistics || {};

  // Parse published date
  const createdAt = snippet.publishedAt ? new Date(snippet.publishedAt) : new Date();

  // Build tags from available metadata
  const tags: string[] = ['YouTube'];
  if (snippet.categoryId) tags.push(`category_${snippet.categoryId}`);
  if (snippet.liveBroadcastContent === 'live') tags.push('live');
  if (snippet.channelTitle) tags.push(snippet.channelTitle);

  // Add tags from video tags if available
  if (snippet.tags && Array.isArray(snippet.tags)) {
    tags.push(...snippet.tags.slice(0, 5)); // Add first 5 tags
  }

  // Clean up content - use description or title
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

/**
 * Search for videos by multiple keywords and aggregate results
 */
export async function searchYouTubeMultipleKeywords(
  keywords: string[],
  numPerKeyword: number = 10
): Promise<SocialPost[]> {
  console.log(`\n📺 Searching YouTube for ${keywords.length} keywords...`);

  const allPosts: SocialPost[] = [];

  for (const keyword of keywords) {
    const posts = await searchYouTubeVideos(keyword, { numOfPosts: numPerKeyword });
    allPosts.push(...posts);

    // Small delay between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Remove duplicates based on video ID
  const uniquePosts = Array.from(
    new Map(allPosts.map((post) => [post.id, post])).values()
  );

  console.log(`✅ Total unique YouTube videos: ${uniquePosts.length}`);
  return uniquePosts;
}

/**
 * Helper function to format date for YouTube API (ISO format YYYY-MM-DD)
 */
export function formatDateForYouTube(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Search for videos within a date range
 */
export async function searchYouTubeByDateRange(
  keyword: string,
  startDate: Date,
  endDate: Date,
  numOfPosts: number = 25
): Promise<SocialPost[]> {
  return searchYouTubeVideos(keyword, {
    numOfPosts,
    startDate: formatDateForYouTube(startDate),
    endDate: formatDateForYouTube(endDate),
  });
}
