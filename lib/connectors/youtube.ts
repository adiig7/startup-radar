// YouTube API connector using Bright Data for collecting startup signals

import type { SocialPost } from '../types';

const BRIGHT_DATA_API_BASE = 'https://api.brightdata.com/datasets/v3/trigger';

/**
 * Search YouTube videos by keywords using Bright Data API
 *
 * Setup:
 * 1. Sign up for Bright Data: https://brightdata.com
 * 2. Get your API token from the dashboard
 * 3. Add BRIGHT_DATA_API_TOKEN to your .env file
 * 4. Get your dataset_id for YouTube from Bright Data dashboard
 * 5. Add BRIGHT_DATA_YOUTUBE_DATASET_ID to your .env file
 */
export async function searchYouTubeVideos(
  keyword: string,
  options: {
    numOfPosts?: number;
    startDate?: string; // MM-DD-YYYY format
    endDate?: string; // MM-DD-YYYY format
  } = {}
): Promise<SocialPost[]> {
  console.log(`\n📺 Searching YouTube for: "${keyword}"`);

  const apiToken = process.env.BRIGHT_DATA_API_TOKEN;
  const datasetId = process.env.BRIGHT_DATA_YOUTUBE_DATASET_ID;

  if (!apiToken) {
    console.error('❌ BRIGHT_DATA_API_TOKEN not found in environment variables');
    console.log('Please add your Bright Data API token to .env file');
    return [];
  }

  if (!datasetId) {
    console.error('❌ BRIGHT_DATA_YOUTUBE_DATASET_ID not found in environment variables');
    console.log('Please add your YouTube dataset ID to .env file');
    return [];
  }

  try {
    // Build the request payload
    const payload = [
      {
        keyword: keyword,
        num_of_posts: options.numOfPosts || 25,
        ...(options.startDate && { start_date: options.startDate }),
        ...(options.endDate && { end_date: options.endDate }),
      },
    ];

    // Make request to Bright Data API
    const response = await fetch(
      `${BRIGHT_DATA_API_BASE}?dataset_id=${datasetId}&format=json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`Bright Data API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Bright Data returns a snapshot_id that we need to use to get results
    const snapshotId = data.snapshot_id;

    if (!snapshotId) {
      console.error('❌ No snapshot_id returned from Bright Data API');
      return [];
    }

    console.log(`⏳ Waiting for results (snapshot_id: ${snapshotId})...`);

    // Poll for results (Bright Data processes requests asynchronously)
    const results = await pollForResults(snapshotId, datasetId, apiToken);
    const posts = results.map((video: any) => normalizeYouTubeVideo(video));

    console.log(`✅ Found ${posts.length} YouTube videos`);
    return posts;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return [];
  }
}

/**
 * Fetch YouTube video data by URL using Bright Data API
 */
export async function fetchYouTubeVideoByUrl(videoUrl: string): Promise<SocialPost | null> {
  console.log(`\n📺 Fetching YouTube video: ${videoUrl}`);

  const apiToken = process.env.BRIGHT_DATA_API_TOKEN;
  const datasetId = process.env.BRIGHT_DATA_YOUTUBE_DATASET_ID;

  if (!apiToken || !datasetId) {
    console.error('❌ Missing Bright Data credentials in environment variables');
    return null;
  }

  try {
    const payload = [{ url: videoUrl }];

    const response = await fetch(
      `${BRIGHT_DATA_API_BASE}?dataset_id=${datasetId}&format=json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`Bright Data API request failed: ${response.status}`);
    }

    const data = await response.json();
    const snapshotId = data.snapshot_id;

    if (!snapshotId) {
      console.error('❌ No snapshot_id returned');
      return null;
    }

    const results = await pollForResults(snapshotId, datasetId, apiToken);

    if (results.length === 0) {
      console.log('⚠️  No video data found');
      return null;
    }

    const post = normalizeYouTubeVideo(results[0]);
    console.log(`✅ Fetched YouTube video: ${post.title}`);
    return post;
  } catch (error) {
    console.error('Error fetching YouTube video:', error);
    return null;
  }
}

/**
 * Poll Bright Data API for results
 */
async function pollForResults(
  snapshotId: string,
  datasetId: string,
  apiToken: string,
  maxAttempts: number = 30,
  delayMs: number = 2000
): Promise<any[]> {
  const resultsUrl = `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(resultsUrl, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      });

      if (response.ok) {
        const results = await response.json();

        // Check if we have results
        if (Array.isArray(results) && results.length > 0) {
          return results;
        }
      }

      // Wait before next attempt
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`Poll attempt ${attempt + 1} failed:`, error);
    }
  }

  console.log('⚠️  Polling timeout - results may not be ready yet');
  return [];
}

/**
 * Normalize YouTube video data to our SocialPost format
 */
function normalizeYouTubeVideo(video: any): SocialPost {
  // Extract video ID from URL
  let videoId = video.video_id || '';

  if (!videoId && video.url) {
    const match = video.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
    videoId = match ? match[1] : '';
  }

  // Parse date
  let createdAt = new Date();
  if (video.post_date) {
    createdAt = new Date(video.post_date);
  } else if (video.posted_at) {
    createdAt = new Date(video.posted_at);
  }

  // Build tags from available metadata
  const tags: string[] = [];
  if (video.category) tags.push(video.category);
  if (video.is_live) tags.push('live');
  if (video.is_verified) tags.push('verified');

  // Clean up content - use description or title
  const content = video.description || video.title || '';

  return {
    id: `youtube_${videoId}`,
    platform: 'youtube',
    title: video.title || 'No title',
    content: content,
    author: video.youtuber || video.channel_name || 'Unknown',
    url: video.url || `https://www.youtube.com/watch?v=${videoId}`,
    created_at: createdAt,
    score: video.likes || 0,
    num_comments: video.num_comments || 0,
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
 * Helper function to format date for Bright Data API (MM-DD-YYYY)
 */
export function formatDateForYouTube(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
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
