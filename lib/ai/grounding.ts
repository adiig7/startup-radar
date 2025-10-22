import { VertexAI } from '@google-cloud/vertexai';
import { hybridSearch } from '../elasticsearch/search';
import type { ChatMessage, ConversationContext, SocialPost } from '../types';

let _vertexAI: VertexAI | null = null;
let _model: any = null;

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

function getModel() {
  if (!_model) {
    const vertexAI = getVertexAI();
    _model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
  }
  return _model;
}

export async function sendGroundedMessage(
  userMessage: string,
  context?: ConversationContext,
  providedResults?: SocialPost[]
): Promise<{ stream: any; citations: SocialPost[] }> {
  try {
    console.log(`\n[Grounded Chat] User query: "${userMessage}"`);

    let relevantPosts: SocialPost[];

    if (providedResults && providedResults.length > 0) {
      console.log(`[Grounded Chat] Using ${providedResults.length} pre-fetched results from dashboard`);
      relevantPosts = providedResults.slice(0, 15);
    } else {
      console.log(`[Grounded Chat] No pre-fetched results, searching Elasticsearch...`);
      const searchResults = await hybridSearch({
        query: userMessage,
        filters: context?.filters,
        limit: 10,
      });
      console.log(`[Grounded Chat] Found ${searchResults.results.length} relevant posts from search`);
      relevantPosts = searchResults.results;
    }

    const groundingContext = prepareGroundingContext(relevantPosts);
    const chatHistory = context?.messages || [];
    const conversationPrompt = buildConversationPrompt(userMessage, groundingContext, chatHistory);

    const model = getModel();
    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: conversationPrompt }] }],
    });

    console.log(`[Grounded Chat] Streaming response...`);

    return {
      stream: result.stream,
      citations: relevantPosts.slice(0, 5),
    };
  } catch (error) {
    console.error('[Grounded Chat] Error:', error);
    throw new Error('Failed to generate grounded response');
  }
}

function prepareGroundingContext(posts: SocialPost[]): string {
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

function buildConversationPrompt(
  userMessage: string,
  groundingContext: string,
  chatHistory: ChatMessage[]
): string {
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

export async function analyzeOpportunity(topic: string): Promise<string> {
  const prompt = `Analyze this topic for startup opportunities: "${topic}"

Based on the grounding context, provide:
1. **Top 3 Problems** - What are users struggling with?
2. **Validation Signals** - Evidence from discussions (cite sources)
3. **Market Size Indicators** - How many people care?
4. **Competitive Gaps** - What existing solutions are missing?
5. **Opportunity Score** - Rate 0-100 with justification

Format your response clearly with these sections.`;

  const model = getModel();
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  return result.response.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
}

export async function findEarlyAdopters(problem: string): Promise<string> {
  const prompt = `Find early adopters discussing this problem: "${problem}"

Provide:
1. **Who are they?** - User profiles from discussions (cite sources)
2. **Where are they?** - Platforms and communities
3. **What they're saying** - Direct quotes showing pain points
4. **Engagement level** - Upvotes, comments, urgency signals
5. **Contact strategy** - How to reach them

Focus on users who seem most frustrated and engaged.`;

  const model = getModel();
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  return result.response.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
}
