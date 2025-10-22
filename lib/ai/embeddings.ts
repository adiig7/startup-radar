import { VertexAI } from '@google-cloud/vertexai';
import type { SocialPost } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('Embeddings');

// Lazy-load VertexAI client to avoid initialization during build
let _vertexAI: VertexAI | null = null;

function getVertexAI(): VertexAI {
  if (!_vertexAI) {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable is required');
    }

    _vertexAI = new VertexAI({
      project: projectId,
      location: location,
    });
  }
  return _vertexAI;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const startTime = Date.now();

  try {
    logger.debug('Starting embedding generation', {
      textLength: text.length,
      textPreview: text.substring(0, 100) + '...',
    });

    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID!;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

    if (!projectId) {
      logger.error('Missing GOOGLE_CLOUD_PROJECT_ID');
      throw new Error('GOOGLE_CLOUD_PROJECT_ID not set in environment');
    }

    logger.debug('Using Google Cloud configuration', {
      projectId,
      location,
    });

    const { GoogleAuth } = require('google-auth-library');

    const credentialsEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentialsEnv) {
      logger.error('Missing GOOGLE_APPLICATION_CREDENTIALS');
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set in environment');
    }

    logger.debug('Processing Google credentials', {
      credentialsType: credentialsEnv.includes('/') ? 'file_path' : 'content',
      credentialsInfo: credentialsEnv.includes('/') ? credentialsEnv : `${credentialsEnv.length} chars`,
    });

    logger.debug('Creating Google Auth client');
    let auth;
    
    if (credentialsEnv.includes('/') || credentialsEnv.includes('\\')) {
      logger.debug('Using credentials file path');
      auth = new GoogleAuth({
        keyFilename: credentialsEnv,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    } else {
      logger.debug('Parsing credentials content');
      let credentials;
      try {
        try {
          credentials = JSON.parse(credentialsEnv);
          logger.debug('Credentials parsed as direct JSON');
        } catch (directParseError) {          
          // Validate that it looks like base64 (no binary characters)
          if (!/^[A-Za-z0-9+/=\s]*$/.test(credentialsEnv)) {
            throw new Error('Credentials contain invalid characters - not valid base64 or JSON');
          }
          
          const credentialsJson = Buffer.from(credentialsEnv.trim(), 'base64').toString('utf-8');
          credentials = JSON.parse(credentialsJson);
          logger.debug('Credentials decoded from base64 and parsed');
        }

        if (!credentials.client_email) {
          throw new Error('Credentials missing client_email field');
        }
        if (!credentials.private_key) {
          throw new Error('Credentials missing private_key field');
        }

        logger.debug('Credentials validated successfully', {
          clientEmail: credentials.client_email,
          projectId: credentials.project_id,
        });

        auth = new GoogleAuth({
          credentials: credentials,
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
      } catch (parseError: any) {
        logger.error('Failed to parse Google credentials', parseError, {
          credentialsLength: credentialsEnv.length,
          credentialsPreview: credentialsEnv.substring(0, 100),
        });
        throw new Error(`Invalid GOOGLE_APPLICATION_CREDENTIALS format: ${parseError.message}`);
      }
    }

    logger.debug('Getting authenticated client');
    const client = await auth.getClient();

    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/text-embedding-004:predict`;
    const request = {
      instances: [{ content: text }],
    };

    logger.debug('Making Vertex AI API request', { endpoint });

    // @ts-ignore
    const response = await client.request({
      url: endpoint,
      method: 'POST',
      data: request,
    });

    if (response.data?.predictions?.[0]?.embeddings?.values) {
      const embedding = response.data.predictions[0].embeddings.values;
      const elapsedTime = Date.now() - startTime;

      logger.info('Embedding generated successfully', {
        dimensions: embedding.length,
        timeMs: elapsedTime,
      });

      return embedding;
    }

    logger.error('No embedding found in API response', null, {
      responseData: response.data,
    });
    throw new Error('No embedding found in response');
  } catch (error: any) {
    const elapsedTime = Date.now() - startTime;
    logger.error('Embedding generation failed', error, {
      timeMs: elapsedTime,
      textLength: text?.length,
    });
    throw error;
  }
}

export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const startTime = Date.now();
  logger.info('Starting batch embedding generation', { count: texts.length });

  const batchSize = 5;
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(texts.length / batchSize);

    logger.info(`Processing batch ${batchNumber}/${totalBatches}`, {
      batchNumber,
      totalBatches,
      itemsRange: `${i + 1}-${Math.min(i + batchSize, texts.length)}`,
      totalItems: texts.length,
    });

    try {
      const batchResults = await Promise.all(batch.map((text) => generateEmbedding(text)));
      embeddings.push(...batchResults);

      logger.debug(`Batch ${batchNumber} completed successfully`, {
        embeddingsGenerated: batchResults.length,
      });
    } catch (batchError: any) {
      logger.error(`Batch ${batchNumber} failed`, batchError);
      throw batchError;
    }

    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const totalTime = Date.now() - startTime;
  logger.info('Batch embedding generation completed', {
    totalEmbeddings: embeddings.length,
    totalTimeMs: totalTime,
    averageTimePerEmbedding: Math.round(totalTime / embeddings.length),
  });

  return embeddings;
}

// Prepare text for embedding from social post
export function prepareTextForEmbedding(post: SocialPost): string {
  const parts: string[] = [];

  // Title (weighted more)
  parts.push(`Title: ${post.title}`);
  parts.push(`Title: ${post.title}`); 

  if (post.content) {
    parts.push(`Content: ${post.content.substring(0, 500)}`);
  }

  if (post.tags.length > 0) {
    parts.push(`Tags: ${post.tags.join(', ')}`);
  }

  parts.push(`Platform: ${post.platform}`);

  return parts.join(' | ');
}
