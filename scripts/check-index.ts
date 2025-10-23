import * as dotenv from 'dotenv';
import { getEsClient, SIGNALS_INDEX } from '../lib/elasticsearch/client';

dotenv.config({ path: '.env' });

const checkIndex = async () => {
  console.log('📊 Checking Elasticsearch index...\n');

  try {
    const client = getEsClient();

    // Get index stats
    const stats = await client.count({ index: SIGNALS_INDEX });
    console.log(`Total documents: ${stats.count}\n`);

    // Get breakdown by platform
    const platformAgg = await client.search({
      index: SIGNALS_INDEX,
      body: {
        size: 0,
        aggs: {
          platforms: {
            terms: { field: 'platform', size: 20 }
          }
        }
      }
    });

    console.log('Documents by platform:');
    if (platformAgg.aggregations?.platforms) {
      (platformAgg.aggregations.platforms as any).buckets.forEach((bucket: any) => {
        console.log(`  - ${bucket.key}: ${bucket.doc_count}`);
      });
    }

    // Get some sample documents
    console.log('\nSample documents:');
    const samples = await client.search({
      index: SIGNALS_INDEX,
      body: {
        size: 5,
        sort: [{ created_at: { order: 'desc' as const } }]
      }
    });

    samples.hits.hits.forEach((hit: any, idx: number) => {
      const doc = hit._source;
      console.log(`\n${idx + 1}. [${doc.platform}] ${doc.title.substring(0, 80)}...`);
      console.log(`   Created: ${new Date(doc.created_at).toLocaleDateString()}`);
      console.log(`   Score: ${doc.score}, Comments: ${doc.num_comments}`);
      console.log(`   Has embedding: ${doc.embedding ? 'YES' : 'NO'}`);
    });

    const withEmbeddings = await client.count({
      index: SIGNALS_INDEX,
      body: {
        query: {
          exists: { field: 'embedding' }
        }
      }
    });

    console.log(`\n\nDocuments with embeddings: ${withEmbeddings.count} / ${stats.count}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

checkIndex();
