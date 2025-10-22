// Check what's actually in the Elasticsearch index

import * as dotenv from 'dotenv';
import { esClient, SIGNALS_INDEX } from '../lib/elasticsearch/client';

dotenv.config({ path: '.env.local' });

async function checkIndex() {
  console.log('📊 Checking Elasticsearch index...\n');

  try {
    // Get index stats
    const stats = await esClient.count({ index: SIGNALS_INDEX });
    console.log(`Total documents: ${stats.count}\n`);

    // Get breakdown by platform
    const platformAgg = await esClient.search({
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
    platformAgg.aggregations.platforms.buckets.forEach((bucket: any) => {
      console.log(`  - ${bucket.key}: ${bucket.doc_count}`);
    });

    // Get some sample documents
    console.log('\nSample documents:');
    const samples = await esClient.search({
      index: SIGNALS_INDEX,
      body: {
        size: 5,
        sort: [{ created_at: { order: 'desc' } }]
      }
    });

    samples.hits.hits.forEach((hit: any, idx: number) => {
      const doc = hit._source;
      console.log(`\n${idx + 1}. [${doc.platform}] ${doc.title.substring(0, 80)}...`);
      console.log(`   Created: ${new Date(doc.created_at).toLocaleDateString()}`);
      console.log(`   Score: ${doc.score}, Comments: ${doc.num_comments}`);
      console.log(`   Has embedding: ${doc.embedding ? 'YES' : 'NO'}`);
    });

    // Check for embeddings
    const withEmbeddings = await esClient.count({
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
