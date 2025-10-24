import { hybridSearch } from '../elasticsearch/search';
import { getGoogleAuth } from '../utils/google-auth';

const cleanJsonResponse = (response: string): string => {
  return response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
};

async function callGemini(prompt: string): Promise<string> {
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

export interface ValidationReport {
  idea: string;
  searchQuery: string;
  overallScore: number;
  verdict: 'BUILD IT' | 'MAYBE' | "DON'T BUILD";
  marketDemand: {
    score: number;
    evidence: string[];
    postsAnalyzed: number;
  };
  problemSeverity: {
    score: number;
    signals: string[];
  };
  competitionLevel: {
    level: 'Low' | 'Medium' | 'High';
    existingSolutions: string[];
    yourAdvantage: string;
  };
  monetization: {
    score: number;
    signals: string[];
    suggestedModel: string;
  };
  targetUsers: {
    who: string;
    size: string;
    whereToFind: string[];
  };
  risks: string[];
  nextSteps: string[];
  recommendation: string;
}

export const validateStartupIdea = async (idea: string): Promise<ValidationReport> => {
  try {
    const keywordPrompt = `Extract 2-4 search keywords from this startup idea to find relevant discussions on social media.

Startup idea: "${idea}"

Return ONLY a JSON object with this format:
{
  "searchQuery": "the search query to use (combine keywords into one searchable phrase)"
}

Example:
Input: "A Slack bot that automates meeting notes"
Output: {"searchQuery": "struggling with meeting notes automation"}

Return ONLY the JSON, no markdown.`;

    const keywordResponse = await callGemini(keywordPrompt);
    const { searchQuery } = JSON.parse(cleanJsonResponse(keywordResponse));

    const searchResults = await hybridSearch({
      query: searchQuery,
      limit: 50,
      offset: 0,
    });

    if (searchResults.results.length === 0) {
      return {
        idea,
        searchQuery,
        overallScore: 20,
        verdict: "DON'T BUILD",
        marketDemand: {
          score: 10,
          evidence: ['No discussions found about this problem'],
          postsAnalyzed: 0,
        },
        problemSeverity: {
          score: 0,
          signals: ['No evidence of people struggling with this'],
        },
        competitionLevel: {
          level: 'Low',
          existingSolutions: [],
          yourAdvantage: 'First mover advantage, but may indicate no market demand',
        },
        monetization: {
          score: 20,
          signals: [],
          suggestedModel: 'Unknown - validate demand first',
        },
        targetUsers: {
          who: 'Unknown',
          size: 'Unknown',
          whereToFind: [],
        },
        risks: [
          'No evidence of market demand',
          'No discussions found about this problem',
          'May be solving a problem that doesn\'t exist',
        ],
        nextSteps: [
          'Conduct user interviews to validate the problem exists',
          'Search with different keywords',
          'Consider pivoting to a related problem with more evidence',
        ],
        recommendation: 'Insufficient market validation. No discussions found about this problem, which is a major red flag. Before building, conduct extensive user research to confirm the problem exists and people care about it.',
      };
    }

    const postsContext = searchResults.results.slice(0, 30).map((post, idx) => {
      const dateStr = post.created_at instanceof Date
        ? post.created_at.toLocaleDateString()
        : new Date(post.created_at).toLocaleDateString();

      return `${post.platform.toUpperCase()} - ${post.title}
URL: ${post.url}
Author: ${post.author}
Engagement: ${post.score} upvotes, ${post.num_comments} comments
Date: ${dateStr}
Content: ${post.content.substring(0, 300)}${post.content.length > 300 ? '...' : ''}
---`;
    }).join('\n\n');

    const validationPrompt = `You are a startup validation expert. Analyze if this startup idea is viable based on real social media discussions.

STARTUP IDEA: "${idea}"

RELEVANT DISCUSSIONS FOUND:
${postsContext}

Provide a comprehensive validation report in JSON format:

{
  "overallScore": <0-100>,
  "verdict": "BUILD IT" | "MAYBE" | "DON'T BUILD",
  "marketDemand": {
    "score": <0-100>,
    "evidence": ["Quote from discussion with source URL", "Another quote with URL"],
    "postsAnalyzed": ${searchResults.results.length}
  },
  "problemSeverity": {
    "score": <0-100>,
    "signals": ["Quote showing frustration with source URL", "Another pain point with URL"]
  },
  "competitionLevel": {
    "level": "Low|Medium|High",
    "existingSolutions": ["competitor 1", "competitor 2"],
    "yourAdvantage": "what makes this idea unique"
  },
  "monetization": {
    "score": <0-100, willingness to pay>,
    "signals": ["Quote about paying for solutions with source URL"],
    "suggestedModel": "SaaS subscription | One-time purchase | Freemium | etc"
  },
  "targetUsers": {
    "who": "developers | small business owners | freelancers | etc",
    "size": "estimated market size",
    "whereToFind": ["reddit.com/r/...", "twitter", "linkedin groups"]
  },
  "risks": ["risk 1", "risk 2", "risk 3"],
  "nextSteps": ["step 1", "step 2", "step 3"],
  "recommendation": "detailed recommendation paragraph"
}

IMPORTANT: When referencing evidence, include the source URL from the discussions above. Format evidence like: "Quote or summary (Source: URL)"

SCORING GUIDE:
- Overall Score: Weighted average considering demand, problem severity, and monetization
- Market Demand: How many people discuss this problem?
- Problem Severity: How badly do they need a solution?
- Monetization: Do they mention paying for solutions?

VERDICT RULES:
- "BUILD IT" (70-100): Strong demand, clear pain, monetization signals
- "MAYBE" (40-69): Some demand but concerns exist
- "DON'T BUILD" (0-39): Weak demand or high risk

Return ONLY the JSON object.`;

    const validationResponse = await callGemini(validationPrompt);
    const report = JSON.parse(cleanJsonResponse(validationResponse));

    return {
      idea,
      searchQuery,
      ...report,
    };
  } catch (error: any) {
    console.error('[Idea Validator]', error.message);
    throw error;
  }
}
