import type { QualityMetrics } from '../types';

export function analyzeQuality(text: string): QualityMetrics {
  const textLength = text.length;
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  const readabilityScore = calculateReadability(text, words);

  const hasCode = /```|`[^`]+`|function |class |import |const |let |var /.test(text);

  const hasLinks = /https?:\/\/|www\./i.test(text);

  const spamScore = calculateSpamScore(text, words);

  return {
    textLength,
    wordCount,
    readabilityScore,
    hasCode,
    hasLinks,
    spamScore,
  };
}

function calculateReadability(text: string, words: string[]): number {
  if (words.length === 0) return 0;

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = Math.max(sentences.length, 1);

  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

  const avgSentenceLength = words.length / sentenceCount;

  const wordLengthScore = Math.max(0, 1 - (avgWordLength - 4) / 10);
  const sentenceLengthScore = Math.max(0, 1 - (avgSentenceLength - 15) / 30);

  return (wordLengthScore + sentenceLengthScore) / 2;
}

function calculateSpamScore(text: string, words: string[]): number {
  let spamIndicators = 0;
  const lowerText = text.toLowerCase();

  const spamPatterns = [
    /\b(buy now|click here|limited time|act now|free money|earn \$|make money fast)\b/i,
    /\b(viagra|casino|lottery|prize|winner)\b/i,
    /(!!!|!!!!)/,
    /ALLCAPS{10,}/,
    /(.)\1{4,}/,
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(text)) {
      spamIndicators++;
    }
  }

  const linkCount = (text.match(/https?:\/\//g) || []).length;
  if (linkCount > 3) {
    spamIndicators += Math.min(linkCount - 3, 3);
  }

  const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
  if (emojiCount > 5) {
    spamIndicators++;
  }

  if (words.length < 10 || (words.length > 500 && !text.includes('\n'))) {
    spamIndicators++;
  }

  return Math.min(spamIndicators / 5, 1);
}


export function classifyDomain(text: string, tags: string[]): string {
  const lowerText = text.toLowerCase();
  const allTags = tags.map(t => t.toLowerCase()).join(' ');

  const domains: Record<string, string[]> = {
    remote_work: ['remote', 'work from home', 'wfh', 'distributed', 'async', 'remote team'],
    saas: ['saas', 'subscription', 'b2b', 'software as a service', 'cloud'],
    ai_tools: ['ai', 'machine learning', 'gpt', 'llm', 'chatbot', 'artificial intelligence'],
    developer_tools: ['api', 'sdk', 'cli', 'developer', 'code', 'github', 'programming'],
    productivity: ['productivity', 'workflow', 'automation', 'efficiency', 'task management'],
    marketing: ['marketing', 'seo', 'content', 'social media', 'email marketing', 'growth'],
    ecommerce: ['ecommerce', 'shopify', 'online store', 'dropshipping', 'marketplace'],
    fintech: ['fintech', 'banking', 'payment', 'crypto', 'blockchain', 'finance'],
    health_tech: ['health', 'medical', 'healthcare', 'fitness', 'wellness', 'mental health'],
    education: ['education', 'learning', 'course', 'teaching', 'student', 'edtech'],
  };

  let bestDomain = 'general';
  let maxMatches = 0;

  for (const [domain, keywords] of Object.entries(domains)) {
    const matches = keywords.filter(k => lowerText.includes(k) || allTags.includes(k)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestDomain = domain;
    }
  }

  return bestDomain;
}
