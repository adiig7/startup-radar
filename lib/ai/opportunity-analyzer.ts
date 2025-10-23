import { VertexAI } from '@google-cloud/vertexai';
import type { SocialPost } from '../types';

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

export interface OpportunityReport {
  query: string;
  overallScore: number;
  problemValidation: {
    score: number;
    mainProblems: string[];
    frequency: number;
  };
  urgencyScore: {
    score: number;
    signals: string[];
  };
  willingnessToPayScore: {
    score: number;
    paymentSignals: string[];
  };
  marketSize: {
    size: 'Small' | 'Medium' | 'Large';
    estimatedUsers: string;
    reasoning: string;
  };
  earlyAdopters: {
    profiles: Array<{
      author: string;
      platform: string;
      engagement: number;
      quote: string;
    }>;
  };
  competitorGaps: {
    existingSolutions: string[];
    gaps: string[];
  };
  recommendation: string;
  keyInsights: string[];
}

export async function analyzeOpportunity(
  query: string,
  posts: SocialPost[]
): Promise<OpportunityReport> {
  console.log(`\n[Opportunity Analyzer] Analyzing "${query}" with ${posts.length} posts`);

  const top50Posts = posts.slice(0, 50);

  const postsContext = top50Posts.map((post, idx) => {
    const dateStr = post.created_at instanceof Date
      ? post.created_at.toLocaleDateString()
      : new Date(post.created_at).toLocaleDateString();

    return `
[Post ${idx + 1}] ${post.platform.toUpperCase()} - ${post.title}
Author: ${post.author}
Engagement: ${post.score} upvotes, ${post.num_comments} comments
Date: ${dateStr}
Content: ${post.content.substring(0, 400)}${post.content.length > 400 ? '...' : ''}
---`;
  }).join('\n\n');

  const prompt = `You are an expert startup opportunity analyst. Analyze these social media posts about "${query}" to evaluate if this is a viable startup opportunity.

POSTS TO ANALYZE:
${postsContext}

Provide a comprehensive analysis in the following JSON format:

{
  "overallScore": <number 0-100>,
  "problemValidation": {
    "score": <number 0-100>,
    "mainProblems": ["problem 1", "problem 2", "problem 3"],
    "frequency": <how many posts mention problems>
  },
  "urgencyScore": {
    "score": <number 0-100>,
    "signals": ["signal 1", "signal 2", "signal 3"]
  },
  "willingnessToPayScore": {
    "score": <number 0-100>,
    "paymentSignals": ["people mentioning they'd pay", "frustrated with current paid solutions", etc.]
  },
  "marketSize": {
    "size": "Small|Medium|Large",
    "estimatedUsers": "e.g., 10K-100K developers",
    "reasoning": "why this market size"
  },
  "earlyAdopters": {
    "profiles": [
      {
        "author": "username",
        "platform": "reddit",
        "engagement": <score + comments>,
        "quote": "direct quote showing pain point"
      }
    ]
  },
  "competitorGaps": {
    "existingSolutions": ["solution 1", "solution 2"],
    "gaps": ["what's missing 1", "what's missing 2"]
  },
  "recommendation": "Should you build this? Yes/No/Maybe and why",
  "keyInsights": ["insight 1", "insight 2", "insight 3"]
}

SCORING CRITERIA:
- Problem Validation (0-100): How many people mention this problem? Is it recurring?
- Urgency Score (0-100): Are people desperate? Using words like "frustrated", "need", "struggling"?
- Willingness to Pay (0-100): Do they mention spending money on solutions or willingness to pay?
- Overall Score (0-100): Weighted average considering all factors + your expert judgment

Return ONLY the JSON object, no markdown formatting.`;

  const model = getModel();
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';

  let cleanJson = responseText.trim();
  if (cleanJson.startsWith('```json')) {
    cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/```\n?/g, '');
  }

  const report = JSON.parse(cleanJson);

  console.log(`[Opportunity Analyzer] Generated report with overall score: ${report.overallScore}`);

  return {
    query,
    ...report,
  };
}
