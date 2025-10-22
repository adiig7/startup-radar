
import * as dotenv from 'dotenv';
import { createSignalsIndex } from '../lib/elasticsearch/client';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function setupElasticsearch() {
  console.log('🚀 Setting up Elasticsearch index...\n');

  try {
    await createSignalsIndex();

    console.log('\n✅ Elasticsearch setup complete!');
    console.log('\nNext step: Run `npm run collect-data` to start collecting social media posts');
  } catch (error) {
    console.error('\n❌ Error during setup:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Check that ELASTIC_CLOUD_ID and ELASTIC_API_KEY are set in .env.local');
    console.error('2. Verify your Elasticsearch cluster is running');
    console.error('3. Ensure you have proper permissions');
    process.exit(1);
  }
}

setupElasticsearch();
