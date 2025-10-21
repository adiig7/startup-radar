// Reset Elasticsearch index (delete and recreate)
import * as dotenv from 'dotenv';
import { esClient, SIGNALS_INDEX, createSignalsIndex } from '../lib/elasticsearch/client';

dotenv.config({ path: '.env.local' });

async function resetIndex() {
  console.log('🗑️  Deleting existing index...\n');

  try {
    const exists = await esClient.indices.exists({ index: SIGNALS_INDEX });

    if (exists) {
      await esClient.indices.delete({ index: SIGNALS_INDEX });
      console.log(`✅ Deleted index "${SIGNALS_INDEX}"`);
    } else {
      console.log(`ℹ️  Index "${SIGNALS_INDEX}" doesn't exist`);
    }

    // Recreate with new schema
    console.log('\n🚀 Creating new index with updated schema...\n');
    await createSignalsIndex();

    console.log('\n✅ Index reset complete!');
    console.log('Next step: Run `npm run collect-data` to populate the index');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

resetIndex();
