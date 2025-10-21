// Background job to collect data from social media platforms

import * as dotenv from 'dotenv';
import { fetchRedditPosts } from '../lib/connectors/reddit';
import { fetchHackerNewsStories, fetchAskHNPosts, fetchShowHNPosts } from '../lib/connectors/hackernews';
import { fetchProductHuntPosts } from '../lib/connectors/producthunt';
import { generateBatchEmbeddings, prepareTextForEmbedding } from '../lib/ai/embeddings';
import { bulkIndexPosts, getIndexStats } from '../lib/elasticsearch/client';
import type { SocialPost } from '../lib/types';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function collectData() {
  console.log('🌐 Starting data collection from social media...\n');
  console.log(`Started at: ${new Date().toLocaleString()}\n`);

  try {
    // Step 1: Fetch data from all sources
    console.log('=== STEP 1: Fetching Data ===');

    const [redditPosts, hnStories, askHN, showHN, phPosts] = await Promise.all([
      fetchRedditPosts(['startups', 'Entrepreneur', 'SaaS', 'smallbusiness', 'sidehustle', 'buildinpublic'], 25),
      fetchHackerNewsStories(30),
      fetchAskHNPosts(20),
      fetchShowHNPosts(20),
      fetchProductHuntPosts(20),
    ]);

    // Combine all posts
    const allPosts: SocialPost[] = [...redditPosts, ...hnStories, ...askHN, ...showHN, ...phPosts];

    console.log(`\n📊 Collection Summary:`);
    console.log(`  - Reddit posts: ${redditPosts.length}`);
    console.log(`  - HN top stories: ${hnStories.length}`);
    console.log(`  - Ask HN: ${askHN.length}`);
    console.log(`  - Show HN: ${showHN.length}`);
    console.log(`  - Product Hunt: ${phPosts.length}`);
    console.log(`  - TOTAL: ${allPosts.length} posts\n`);

    if (allPosts.length === 0) {
      console.error('❌ No posts collected. Check your API connectivity.');
      process.exit(1);
    }

    // Step 2: Generate embeddings
    console.log('=== STEP 2: Generating Embeddings ===');
    const texts = allPosts.map(prepareTextForEmbedding);
    const embeddings = await generateBatchEmbeddings(texts);

    allPosts.forEach((post, idx) => {
      post.embedding = embeddings[idx];
    });

    // Step 3: Index to Elasticsearch
    console.log('\n=== STEP 3: Indexing to Elasticsearch ===');
    await bulkIndexPosts(allPosts);

    // Step 4: Show final stats
    const stats = await getIndexStats();
    console.log(`\n📈 Index Stats:`);
    console.log(`  - Total documents in index: ${stats.total_documents}`);

    console.log(`\n✅ Data collection completed successfully!`);
    console.log(`Finished at: ${new Date().toLocaleString()}`);

    console.log(`\n💡 Tip: Set up a cron job to run this script every 6 hours:`);
    console.log(`   crontab: 0 */6 * * * cd /path/to/signalscout && npm run collect-data`);
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
