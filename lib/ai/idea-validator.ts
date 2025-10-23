import { VertexAI } from '@google-cloud/vertexai';
import { hybridSearch } from '../elasticsearch/search';

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

const getModel = (): any => {
  if (!_model) {
    const vertexAI = getVertexAI();
    _model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
  }
  return _model;
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
  const model = getModel();
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

  const keywordResult = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: keywordPrompt }] }],
  });

  let keywordResponse = keywordResult.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  keywordResponse = keywordResponse.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
  const { searchQuery } = JSON.parse(keywordResponse);


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

    return `[Post ${idx + 1}] ${post.platform.toUpperCase()} - ${post.title}
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
    "evidence": ["evidence 1", "evidence 2", "evidence 3"],
    "postsAnalyzed": ${searchResults.results.length}
  },
  "problemSeverity": {
    "score": <0-100>,
    "signals": ["people are frustrated", "spending time on workarounds", etc]
  },
  "competitionLevel": {
    "level": "Low|Medium|High",
    "existingSolutions": ["competitor 1", "competitor 2"],
    "yourAdvantage": "what makes this idea unique"
  },
  "monetization": {
    "score": <0-100, willingness to pay>,
    "signals": ["mention of paying for solutions", "complaining about expensive tools"],
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

  const validationResult = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: validationPrompt }] }],
  });

  let validationResponse = validationResult.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  validationResponse = validationResponse.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');

  const report = JSON.parse(validationResponse);


  return {
    idea,
    searchQuery,
    ...report,
  };
}
