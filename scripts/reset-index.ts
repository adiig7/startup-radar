import * as dotenv from 'dotenv';
import { getEsClient, SIGNALS_INDEX, createSignalsIndex } from '../lib/elasticsearch/client';

dotenv.config({ path: '.env' });

const resetIndex = async () => {
  console.log(' Deleting existing index...\n');

  try {
    const client = getEsClient();
    const exists = await client.indices.exists({ index: SIGNALS_INDEX });

    if (exists) {
      await client.indices.delete({ index: SIGNALS_INDEX });
      console.log(` Deleted index "${SIGNALS_INDEX}"`);
    } else {
      console.log(`ℹ️  Index "${SIGNALS_INDEX}" doesn't exist`);
    }

    // Recreate with new schema
    console.log('\n🚀 Creating new index with updated schema...\n');
    await createSignalsIndex();

    console.log('\n Index reset complete!');
    console.log('Next step: Run `npm run collect-data` to populate the index');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

resetIndex();
