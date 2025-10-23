
import * as dotenv from 'dotenv';
import { createSignalsIndex } from '../lib/elasticsearch/client';

dotenv.config({ path: '.env' });

const setupElasticsearch = async () => {
  console.log('🚀 Setting up Elasticsearch index...\n');

  try {
    await createSignalsIndex();

    console.log('\nIndex setup complete!');
    console.log('\nNext step: Run `npm run collect-data` to start collecting social media posts');
  } catch (error) {
    console.error('\nError during setup:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Check that ELASTIC_CLOUD_ID and ELASTIC_API_KEY are set in .env.local');
    console.error('2. Verify your Elasticsearch cluster is running');
    console.error('3. Ensure you have proper permissions');
    process.exit(1);
  }
}

setupElasticsearch();
