// Vertex AI embeddings generation for semantic search

import { VertexAI } from '@google-cloud/vertexai';
import type { SocialPost } from '../types';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
});

// Use text-embedding-004 model
const embeddingModel = vertexAI.preview.getGenerativeModel({
  model: 'text-embedding-004',
});

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID!;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

    const { GoogleAuth } = require('google-auth-library');
    const path = require('path');
    const fs = require('fs');

    // Load credentials directly from file
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!credentialsPath) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set in environment');
    }

    // Read and parse the credentials file
    let credentials;
    try {
      const credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
      credentials = JSON.parse(credentialsContent);
    } catch (error) {
      throw new Error(`Failed to read credentials file at ${credentialsPath}: ${error.message}`);
    }

    // Create auth client with credentials directly
    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();

    // Make the API request
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
      return response.data.predictions[0].embeddings.values;
    }

    throw new Error('No embedding found in response');
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error; // Don't fallback to zero vector - let it fail properly
  }
}

export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  console.log(`Generating embeddings for ${texts.length} items...`);

  // Process in smaller batches to avoid rate limits (5 per batch)
  const batchSize = 5;
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)} (items ${i + 1}-${Math.min(i + batchSize, texts.length)}/${texts.length})...`);

    const batchResults = await Promise.all(batch.map((text) => generateEmbedding(text)));

    embeddings.push(...batchResults);

    // Longer delay to avoid rate limiting (2 seconds between batches)
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log(`✅ Generated ${embeddings.length} embeddings`);
  return embeddings;
}

// Prepare text for embedding from social post
export function prepareTextForEmbedding(post: SocialPost): string {
  const parts: string[] = [];

  // Title (weighted more)
  parts.push(`Title: ${post.title}`);
  parts.push(`Title: ${post.title}`); // Repeat for emphasis

  // Content
  if (post.content) {
    parts.push(`Content: ${post.content.substring(0, 500)}`); // Limit content length
  }

  // Tags/Categories
  if (post.tags.length > 0) {
    parts.push(`Tags: ${post.tags.join(', ')}`);
  }

  // Platform context
  parts.push(`Platform: ${post.platform}`);

  return parts.join(' | ');
}
