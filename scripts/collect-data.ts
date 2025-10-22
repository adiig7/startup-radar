// Background job to collect data from social media platforms

import * as dotenv from 'dotenv';
import { fetchRedditPosts } from '../lib/connectors/reddit';
import { fetchHackerNewsStories, fetchAskHNPosts, fetchShowHNPosts } from '../lib/connectors/hackernews';
import { fetchProductHuntPosts } from '../lib/connectors/producthunt';
import { searchYouTubeVideos } from '../lib/connectors/youtube';
import { generateBatchEmbeddings, prepareTextForEmbedding } from '../lib/ai/embeddings';
import { bulkIndexPosts, getIndexStats } from '../lib/elasticsearch/client';
import { analyzeSentiment } from '../lib/analysis/sentiment';
import { analyzeQuality, classifyDomain } from '../lib/analysis/quality';
import type { SocialPost } from '../lib/types';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function collectData() {
  console.log('🌐 Starting data collection from social media...\n');
  console.log(`Started at: ${new Date().toLocaleString()}\n`);

  try {
    // Step 1: Fetch data from all sources
    console.log('=== STEP 1: Fetching Data ===');

    // Define trending topics for YouTube search
    const youtubeKeywords = [
      'startup problems',
      'entrepreneur struggles',
      'remote work challenges',
      'saas feedback',
      'small business pain points'
    ];

    const [redditPosts, hnStories, askHN, showHN, phPosts, youtubePosts] = await Promise.all([
      fetchRedditPosts(['startups', 'Entrepreneur', 'SaaS', 'smallbusiness', 'sidehustle', 'buildinpublic'], 25),
      fetchHackerNewsStories(30),
      fetchAskHNPosts(20),
      fetchShowHNPosts(20),
      fetchProductHuntPosts(20),
      // Fetch YouTube videos for each keyword (5 videos per keyword)
      Promise.all(youtubeKeywords.map(keyword =>
        searchYouTubeVideos(keyword, { numOfPosts: 5 })
      )).then(results => results.flat()),
    ]);

    // Combine all posts
    const allPosts: SocialPost[] = [...redditPosts, ...hnStories, ...askHN, ...showHN, ...phPosts, ...youtubePosts];

    console.log(`\n📊 Collection Summary:`);
    console.log(`  - Reddit posts: ${redditPosts.length}`);
    console.log(`  - HN top stories: ${hnStories.length}`);
    console.log(`  - Ask HN: ${askHN.length}`);
    console.log(`  - Show HN: ${showHN.length}`);
    console.log(`  - Product Hunt: ${phPosts.length}`);
    console.log(`  - YouTube videos: ${youtubePosts.length}`);
    console.log(`  - TOTAL: ${allPosts.length} posts\n`);

    if (allPosts.length === 0) {
      console.error('❌ No posts collected. Check your API connectivity.');
      process.exit(1);
    }

    // Step 2: Analyze content (sentiment, quality, domain)
    console.log('\n=== STEP 2: Analyzing Content ===');
    allPosts.forEach((post) => {
      const fullText = `${post.title} ${post.content}`;

      // Sentiment analysis
      post.sentiment = analyzeSentiment(fullText);

      // Quality metrics
      post.quality = analyzeQuality(fullText);

      // Domain classification
      post.domain_context = classifyDomain(fullText, post.tags);
    });

    console.log('✅ Content analysis complete');

    // Step 3: Generate embeddings
    console.log('\n=== STEP 3: Generating Embeddings ===');
    const texts = allPosts.map(prepareTextForEmbedding);
    const embeddings = await generateBatchEmbeddings(texts);

    allPosts.forEach((post, idx) => {
      post.embedding = embeddings[idx];
    });

    // Step 4: Index to Elasticsearch
    console.log('\n=== STEP 4: Indexing to Elasticsearch ===');
    await bulkIndexPosts(allPosts);

    // Step 5: Show final stats
    const stats = await getIndexStats();
    console.log(`\n📈 Index Stats:`);
    console.log(`  - Total documents in index: ${stats.total_documents}`);

    // Show analysis summary
    const sentimentCounts = allPosts.reduce((acc, post) => {
      const label = post.sentiment?.label || 'unknown';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const highQualityCount = allPosts.filter(p => p.quality && p.quality.spamScore < 0.3).length;

    console.log(`\n📊 Analysis Summary:`);
    console.log(`  - Positive sentiment: ${sentimentCounts.positive || 0}`);
    console.log(`  - Negative sentiment: ${sentimentCounts.negative || 0}`);
    console.log(`  - Neutral sentiment: ${sentimentCounts.neutral || 0}`);
    console.log(`  - High quality posts: ${highQualityCount}`);

    console.log(`\n✅ Data collection completed successfully!`);
    console.log(`Finished at: ${new Date().toLocaleString()}`);

    console.log(`\n💡 Tip: Set up a cron job to run this script every 6 hours:`);
    console.log(`   crontab: 0 */6 * * * cd /path/to/startupradar && npm run collect-data`);
  } catch (error) {
    console.error('\n❌ Error during data collection:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure you ran `npm run setup-es` first');
    console.error('2. Check that all environment variables are set in .env.local:');
    console.error('   - GOOGLE_CLOUD_PROJECT_ID (required)');
    console.error('   - ELASTIC_CLOUD_ID (required)');
    console.error('   - ELASTIC_API_KEY (required)');
    console.error('3. Verify your network connection');
    console.error('4. Check API rate limits');
    process.exit(1);
  }
}

// Run the collection
collectData();
