// Vertex AI Grounding with Elasticsearch
// This is the KEY feature that makes SignalScout work!

import { VertexAI } from '@google-cloud/vertexai';
import { hybridSearch } from '../elasticsearch/search';
import type { ChatMessage, ConversationContext, SocialPost } from '../types';

// Lazy-load VertexAI client to avoid initialization during build
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

/**
 * Send a message to Gemini with grounding from Elasticsearch
 * This retrieves relevant social posts and uses them as context
 */
export async function sendGroundedMessage(
  userMessage: string,
  context?: ConversationContext
): Promise<ChatMessage> {
  try {
    console.log(`\n[Grounded Chat] User query: "${userMessage}"`);

    // Step 1: Search Elasticsearch for relevant posts
    const searchResults = await hybridSearch({
      query: userMessage,
      filters: context?.filters,
      limit: 10, // Get top 10 relevant posts for grounding
    });

    console.log(`[Grounded Chat] Found ${searchResults.results.length} relevant posts`);

    // Step 2: Prepare grounding context from search results
    const groundingContext = prepareGroundingContext(searchResults.results);

    // Step 3: Build conversation history
    const chatHistory = context?.messages || [];
    const conversationPrompt = buildConversationPrompt(userMessage, groundingContext, chatHistory);

    // Step 4: Send to Gemini
    const model = getModel();
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: conversationPrompt }] }],
    });

    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

    console.log(`[Grounded Chat] Generated response (${responseText.length} chars)`);

    // Return assistant message with citations
    return {
      role: 'assistant',
      content: responseText,
      citations: searchResults.results.slice(0, 5), // Top 5 posts as citations
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('[Grounded Chat] Error:', error);
    throw new Error('Failed to generate grounded response');
  }
}

/**
 * Prepare grounding context from social posts
 * This formats the posts into a context that Gemini can understand
 */
function prepareGroundingContext(posts: SocialPost[]): string {
  if (posts.length === 0) {
    return 'No relevant discussions found.';
  }

  const contextParts = posts.map((post, idx) => {
    return `
[Source ${idx + 1}] ${post.platform.toUpperCase()} - ${post.title}
Author: ${post.author}
Score: ${post.score} | Comments: ${post.num_comments}
Date: ${post.created_at.toLocaleDateString()}
URL: ${post.url}

Content: ${post.content.substring(0, 500)}${post.content.length > 500 ? '...' : ''}
Tags: ${post.tags.join(', ')}
---`;
  });

  return `
RELEVANT DISCUSSIONS FROM SOCIAL MEDIA:
${contextParts.join('\n\n')}

Use these real discussions as the PRIMARY source for your answer. Always cite specific sources when making claims.
`;
}

/**
 * Build the full conversation prompt with grounding
 */
function buildConversationPrompt(
  userMessage: string,
  groundingContext: string,
  chatHistory: ChatMessage[]
): string {
  const systemPrompt = `You are SignalScout AI, an expert at analyzing social media discussions to identify startup opportunities and market trends.

Your job is to:
1. Analyze real conversations from Reddit, Hacker News, Stack Overflow, and other platforms
2. Identify problems, pain points, and market opportunities
3. Provide insights grounded in actual user discussions
4. Cite specific sources when making claims

IMPORTANT RULES:
- Always cite sources using [Source X] format when referencing discussions
- Focus on REAL problems mentioned by actual users, not generic advice
- Identify patterns across multiple discussions
- Be specific about the opportunity size and validation signals
- Don't make up information - only use the grounding context provided
`;

  // Add conversation history
  let conversationHistory = '';
  if (chatHistory.length > 0) {
    conversationHistory = '\n\nCONVERSATION HISTORY:\n';
    chatHistory.slice(-3).forEach((msg) => {
      // Last 3 messages for context
      conversationHistory += `${msg.role.toUpperCase()}: ${msg.content}\n`;
    });
  }

  return `${systemPrompt}

${groundingContext}
${conversationHistory}

USER QUESTION: ${userMessage}

Please provide a detailed, well-cited answer based on the discussions above:`;
}

/**
 * Analyze a topic to find startup opportunities
 */
export async function analyzeOpportunity(topic: string): Promise<string> {
  const prompt = `Analyze this topic for startup opportunities: "${topic}"

Based on the grounding context, provide:
1. **Top 3 Problems** - What are users struggling with?
2. **Validation Signals** - Evidence from discussions (cite sources)
3. **Market Size Indicators** - How many people care?
4. **Competitive Gaps** - What existing solutions are missing?
5. **Opportunity Score** - Rate 0-100 with justification

Format your response clearly with these sections.`;

  const response = await sendGroundedMessage(prompt);
  return response.content;
}

/**
 * Find early adopters for a specific problem
 */
export async function findEarlyAdopters(problem: string): Promise<string> {
  const prompt = `Find early adopters discussing this problem: "${problem}"

Provide:
1. **Who are they?** - User profiles from discussions (cite sources)
2. **Where are they?** - Platforms and communities
3. **What they're saying** - Direct quotes showing pain points
4. **Engagement level** - Upvotes, comments, urgency signals
5. **Contact strategy** - How to reach them

Focus on users who seem most frustrated and engaged.`;

  const response = await sendGroundedMessage(prompt);
  return response.content;
}
