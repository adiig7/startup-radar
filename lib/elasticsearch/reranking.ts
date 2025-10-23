import { getEsClient } from './client';

const RERANKER_INFERENCE_ID = 'vertex_ai_reranker';

export const checkRerankingEndpoint = async (): Promise<boolean> => {
  try {
    const client = getEsClient();
    await client.inference.get({
      inference_id: RERANKER_INFERENCE_ID,
    });
    return true;
  } catch (error: any) {
    if (error.meta?.statusCode === 404) {
      return false;
    }
    throw error;
  }
}

export const createRerankingEndpoint = async (): Promise<void> => {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const serviceAccountCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable is required for reranking');
  }

  if (!serviceAccountCredentials) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is required for reranking');
  }

  let serviceAccountJson: string;
  try {
    if (serviceAccountCredentials.length > 100 && !serviceAccountCredentials.startsWith('{')) {
      serviceAccountJson = Buffer.from(serviceAccountCredentials, 'base64').toString('utf-8');
    } else {
      serviceAccountJson = serviceAccountCredentials;
    }
    
    JSON.parse(serviceAccountJson);
  } catch (error) {
    throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS format. Must be valid JSON or base64-encoded JSON.');
  }

  const client = getEsClient();

  try {
    await client.inference.put({
      inference_id: RERANKER_INFERENCE_ID,
      task_type: 'rerank',
      inference_config: {
        service: 'googlevertexai',
        service_settings: {
          service_account_json: serviceAccountJson,
          project_id: projectId,
          model_id: 'semantic-ranker-512@latest',
        },
      },
    });

  } catch (error: any) {
    console.error('Failed to create reranking endpoint:', error.message);
  }
}

export const setupRerankingEndpoint = async (): Promise<void> => {
  try {
    const exists = await checkRerankingEndpoint();

    if (!exists) {
      await createRerankingEndpoint();
    }
  } catch (error: any) {
    throw error;
  }
}

export const deleteRerankingEndpoint = async (): Promise<void> => {
  const client = getEsClient();

  try {
    await client.inference.delete({
      inference_id: RERANKER_INFERENCE_ID,
    });

  } catch (error: any) {
    if (error.meta?.statusCode === 404) {
      return;
    }
    throw error;
  }
}

export { RERANKER_INFERENCE_ID };
