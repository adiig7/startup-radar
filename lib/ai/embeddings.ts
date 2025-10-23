import { VertexAI } from '@google-cloud/vertexai';
import type { SocialPost } from '../types';

// Lazy-load VertexAI client to avoid initialization during build
let _vertexAI: VertexAI | null = null;

export const getVertexAI = (): VertexAI => {
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

export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {

    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID!;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT_ID not set in environment');
    }

    const { GoogleAuth } = require('google-auth-library');

    const credentialsEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentialsEnv) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set in environment');
    }

    let auth;
    
    if (credentialsEnv.includes('/') || credentialsEnv.includes('\\')) {
      auth = new GoogleAuth({
        keyFilename: credentialsEnv,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    } else {
      let credentials;
      try {
        try {
          credentials = JSON.parse(credentialsEnv);
        } catch (directParseError) {          
          // Validate that it looks like base64 (no binary characters)
          if (!/^[A-Za-z0-9+/=\s]*$/.test(credentialsEnv)) {
            throw new Error('Credentials contain invalid characters - not valid base64 or JSON');
          }
          
          const credentialsJson = Buffer.from(credentialsEnv.trim(), 'base64').toString('utf-8');
          credentials = JSON.parse(credentialsJson);
        }

        if (!credentials.client_email) {
          throw new Error('Credentials missing client_email field');
        }
        if (!credentials.private_key) {
          throw new Error('Credentials missing private_key field');
        }

        auth = new GoogleAuth({
          credentials: credentials,
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
      } catch (parseError: any) {
        throw new Error(`Invalid GOOGLE_APPLICATION_CREDENTIALS format: ${parseError.message}`);
      }
    }

    const client = await auth.getClient();

    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/text-embedding-004:predict`;
    const request = {
      instances: [{ content: text }],
    };

    // @ts-ignore
    const response = await client.request({
      url: endpoint,
      method: 'POST',
      data: request,
    });

    if (response.data?.predictions?.[0]?.embeddings?.values) {
      const embedding = response.data.predictions[0].embeddings.values;
      return embedding;
    }

    throw new Error('No embedding found in response');
  } catch (error: any) {
    throw error;
  }
}

export const generateBatchEmbeddings = async (texts: string[]): Promise<number[][]> => {
  const batchSize = 5;
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    try {
      const batchResults = await Promise.all(batch.map((text) => generateEmbedding(text)));
      embeddings.push(...batchResults);
    } catch (batchError: any) {
      throw batchError;
    }

    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return embeddings;
}

// Prepare text for embedding from social post
export const prepareTextForEmbedding = (post: SocialPost): string => {
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
