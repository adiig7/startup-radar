import type { SentimentScore } from '../types';

const POSITIVE_WORDS = new Set([
  'good', 'great', 'excellent', 'amazing', 'awesome', 'fantastic', 'wonderful',
  'love', 'best', 'perfect', 'happy', 'thanks', 'thank', 'solved', 'working',
  'success', 'useful', 'helpful', 'easy', 'simple', 'better', 'improved',
  'innovative', 'excited', 'brilliant', 'outstanding', 'recommend', 'win',
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'sucks', 'poor',
  'broken', 'fail', 'failed', 'error', 'bug', 'issue', 'problem', 'struggling',
  'frustrated', 'annoying', 'difficult', 'hard', 'impossible', 'slow', 'slow',
  'confusing', 'complicated', 'useless', 'waste', 'disappointed', 'wrong',
]);

const INTENSIFIERS = new Set(['very', 'really', 'extremely', 'absolutely', 'totally']);

const NEGATIONS = new Set(['not', 'no', 'never', 'none', 'nobody', 'nothing', "don't", "doesn't", "didn't"]);

export function analyzeSentiment(text: string): SentimentScore {
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;
  let positiveCount = 0;
  let negativeCount = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^\w]/g, '');
    const isNegated = i > 0 && NEGATIONS.has(words[i - 1].replace(/[^\w]/g, ''));

    const isIntensified = i > 0 && INTENSIFIERS.has(words[i - 1].replace(/[^\w]/g, ''));
    const multiplier = isIntensified ? 2 : 1;

    if (POSITIVE_WORDS.has(word)) {
      const wordScore = isNegated ? -1 : 1;
      score += wordScore * multiplier;
      if (wordScore > 0) positiveCount++;
      else negativeCount++;
    } else if (NEGATIVE_WORDS.has(word)) {
      const wordScore = isNegated ? 1 : -1;
      score += wordScore * multiplier;
      if (wordScore < 0) negativeCount++;
      else positiveCount++;
    }
  }

  const comparative = words.length > 0 ? score / words.length : 0;

  let label: 'positive' | 'negative' | 'neutral';
  if (score > 0.5) label = 'positive';
  else if (score < -0.5) label = 'negative';
  else label = 'neutral';

  const sentimentWordCount = positiveCount + negativeCount;
  const confidence = Math.min(sentimentWordCount / Math.max(words.length / 10, 1), 1);

  return {
    score,
    comparative,
    label,
    confidence,
  };
}

export function isProblemPost(text: string, sentiment: SentimentScore): boolean {
  const problemIndicators = [
    'problem', 'issue', 'struggling', 'difficulty', 'frustrated', 'help',
    'how to', 'how do', 'cant', "can't", 'stuck', 'broken', 'not working',
    'need', 'looking for', 'any suggestions', 'advice', 'tips',
  ];

  const lowerText = text.toLowerCase();
  const hasProblemKeyword = problemIndicators.some(keyword => lowerText.includes(keyword));
  const isNegativeSentiment = sentiment.label === 'negative' || sentiment.score < 0;

  return hasProblemKeyword || isNegativeSentiment;
}

export function extractPainPoints(text: string): string[] {
  const painPointPatterns = [
    /(?:struggling with|problem with|issue with|difficult to|hard to|frustrated by)\s+([^,.!?]+)/gi,
    /(?:need|want|looking for|wish there was)\s+(?:a|an|some)?\s*([^,.!?]+)/gi,
    /(?:why (?:is|are|does)|how (?:do|can))\s+([^?]+)/gi,
  ];

  const painPoints: string[] = [];

  for (const pattern of painPointPatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      if (match[1]) {
        painPoints.push(match[1].trim());
      }
    }
  }

  return painPoints;
}
