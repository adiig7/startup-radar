// Content quality analysis for social posts

import type { QualityMetrics } from '../types';

/**
 * Analyze content quality
 */
export function analyzeQuality(text: string): QualityMetrics {
  const textLength = text.length;
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Calculate readability score (simplified Flesch reading ease)
  const readabilityScore = calculateReadability(text, words);

  // Check for code blocks
  const hasCode = /```|`[^`]+`|function |class |import |const |let |var /.test(text);

  // Check for links
  const hasLinks = /https?:\/\/|www\./i.test(text);

  // Calculate spam score
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

/**
 * Calculate readability score (0-1, higher = more readable)
 */
function calculateReadability(text: string, words: string[]): number {
  if (words.length === 0) return 0;

  // Count sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = Math.max(sentences.length, 1);

  // Average word length
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

  // Average sentence length
  const avgSentenceLength = words.length / sentenceCount;

  // Simplified readability formula
  // Lower word length and sentence length = more readable
  const wordLengthScore = Math.max(0, 1 - (avgWordLength - 4) / 10);
  const sentenceLengthScore = Math.max(0, 1 - (avgSentenceLength - 15) / 30);

  return (wordLengthScore + sentenceLengthScore) / 2;
}

/**
 * Calculate spam score (0-1, higher = more likely spam)
 */
function calculateSpamScore(text: string, words: string[]): number {
  let spamIndicators = 0;
  const lowerText = text.toLowerCase();

  // Check for spam patterns
  const spamPatterns = [
    /\b(buy now|click here|limited time|act now|free money|earn \$|make money fast)\b/i,
    /\b(viagra|casino|lottery|prize|winner)\b/i,
    /(!!!|!!!!)/, // Excessive exclamation marks
    /ALLCAPS{10,}/, // Long all-caps text
    /(.)\1{4,}/, // Repeated characters (aaaa, 1111)
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(text)) {
      spamIndicators++;
    }
  }

  // Check for excessive links (more than 3)
  const linkCount = (text.match(/https?:\/\//g) || []).length;
  if (linkCount > 3) {
    spamIndicators += Math.min(linkCount - 3, 3);
  }

  // Check for excessive emojis
  const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
  if (emojiCount > 5) {
    spamIndicators++;
  }

  // Very short or very long posts without structure
  if (words.length < 10 || (words.length > 500 && !text.includes('\n'))) {
    spamIndicators++;
  }

  // Normalize to 0-1 scale
  return Math.min(spamIndicators / 5, 1);
}

/**
 * Check if post is high quality
 */
export function isHighQuality(quality: QualityMetrics): boolean {
  return (
    quality.wordCount >= 20 && // At least 20 words
    quality.wordCount <= 1000 && // Not too long
    quality.readabilityScore > 0.4 && // Readable
    quality.spamScore < 0.3 // Low spam
  );
}

/**
 * Classify domain/topic of content using keyword matching
 */
export function classifyDomain(text: string, tags: string[]): string {
  const lowerText = text.toLowerCase();
  const allTags = tags.map(t => t.toLowerCase()).join(' ');

  // Domain keywords
  const domains: { [key: string]: string[] } = {
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
    let matches = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword) || allTags.includes(keyword)) {
        matches++;
      }
    }

    if (matches > maxMatches) {
      maxMatches = matches;
      bestDomain = domain;
    }
  }

  return bestDomain;
}
