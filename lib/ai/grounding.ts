import { hybridSearch } from '../elasticsearch/search';
import { getGoogleAuth } from '../utils/google-auth';
import type { ChatMessage, ConversationContext, SocialPost } from '../types';

const callGemini = async (prompt: string): Promise<string> => {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID!;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT_ID not set in environment');
  }

  const auth = getGoogleAuth();
  const client = await auth.getClient();
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash:generateContent`;

  // @ts-ignore
  const response = await client.request({
    url: endpoint,
    method: 'POST',
    data: {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    },
  });

  const responseData = response.data as any;
  return responseData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export const sendGroundedMessage = async (
  userMessage: string,
  context?: ConversationContext,
  providedResults?: SocialPost[]
): Promise<{ response: string; citations: SocialPost[] }> => {
  try {

    let relevantPosts: SocialPost[];

    if (providedResults && providedResults.length > 0) {
      relevantPosts = providedResults.slice(0, 15);
    } else {
      const searchResults = await hybridSearch({
        query: userMessage,
        filters: context?.filters,
        limit: 10,
      });
      relevantPosts = searchResults.results;
    }

    const groundingContext = prepareGroundingContext(relevantPosts);
    const chatHistory = context?.messages || [];
    const conversationPrompt = buildConversationPrompt(userMessage, groundingContext, chatHistory);

    const response = await callGemini(conversationPrompt);

    return {
      response: response,
      citations: relevantPosts.slice(0, 5),
    };
  } catch (error: any) {
    console.error('Grounding error:', error.message);
    throw new Error(`Failed to generate grounded response: ${error.message}`);
  }
}

const prepareGroundingContext = (posts: SocialPost[]): string => {
  if (posts.length === 0) {
    return 'No relevant discussions found.';
  }

  const contextParts = posts.map((post, idx) => {
    const dateStr = post.created_at instanceof Date
      ? post.created_at.toLocaleDateString()
      : new Date(post.created_at).toLocaleDateString();

    return `
[Source ${idx + 1}] ${post.platform.toUpperCase()} - ${post.title}
Author: ${post.author}
Score: ${post.score} | Comments: ${post.num_comments}
Date: ${dateStr}

Content: ${post.content.substring(0, 300)}${post.content.length > 300 ? '...' : ''}
---`;
  });

  return `
RELEVANT DISCUSSIONS FROM SOCIAL MEDIA:
${contextParts.join('\n\n')}

Use these real discussions as the PRIMARY source for your answer. Always cite specific sources when making claims.
`;
}

const buildConversationPrompt = (
  userMessage: string,
  groundingContext: string,
  chatHistory: ChatMessage[]
): string => {
  const systemPrompt = `You are StartupRadar AI, an expert at analyzing social media discussions to identify startup opportunities and market trends.

Your job is to:
1. Analyze the search results provided from Reddit, Hacker News, YouTube, and Product Hunt
2. Identify problems, pain points, and market opportunities in these specific discussions
3. Provide insights grounded in the actual user discussions shown in the search results
4. Cite specific sources when making claims

IMPORTANT RULES:
- Be EXTREMELY CONCISE and DIRECT - answer ONLY what was asked, nothing more
- If asked for "the best" or "which one", give ONLY that ONE answer, not a ranking or comparison
- If asked for a list, give the list. If asked for one thing, give ONE thing
- Skip ALL preambles like "Of course", "Based on the provided results", "Here's my analysis"
- Skip explanations about methodology or how you measure things
- Get straight to the answer in the first sentence
- Always cite sources using [Source X] format when referencing discussions
- Focus on REAL problems mentioned by actual users in the search results, not generic advice
- Be specific about the opportunity size and validation signals based on the engagement metrics (scores, comments)
- ONLY analyze the posts provided in the context below - do not make up information or search for new content
- When asked about "engagement" or "most popular", look at the score and num_comments fields and sort by them
- Use bullet points and clear headers only when asked for multiple items
`;

  let conversationHistory = '';
  if (chatHistory.length > 0) {
    conversationHistory = '\n\nCONVERSATION HISTORY:\n';
    chatHistory.slice(-3).forEach((msg) => {
      conversationHistory += `${msg.role.toUpperCase()}: ${msg.content}\n`;
    });
  }

  return `${systemPrompt}

${groundingContext}
${conversationHistory}

USER QUESTION: ${userMessage}

Please provide a detailed, well-cited answer based on the discussions above:`;
}

