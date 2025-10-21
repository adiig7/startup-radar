// Core types for SignalScout

export type Platform = 'reddit' | 'hackernews' | 'producthunt' | 'quora' | 'youtube';

export interface SentimentScore {
  score: number; // -5 to 5 (negative to positive)
  comparative: number; // normalized score
  label: 'positive' | 'negative' | 'neutral';
  confidence: number; // 0-1
}

export interface QualityMetrics {
  textLength: number;
  wordCount: number;
  readabilityScore: number; // 0-1
  hasCode: boolean;
  hasLinks: boolean;
  spamScore: number; // 0-1 (higher = more likely spam)
}

export interface SocialPost {
  id: string;
  platform: Platform;
  title: string;
  content: string;
  author: string;
  url: string;
  created_at: Date;
  score: number; // upvotes, karma, etc.
  num_comments: number;
  tags: string[]; // subreddit, category, etc.
  embedding?: number[]; // Vector embedding from Vertex AI
  indexed_at: Date;

  // Enhanced analysis fields
  sentiment?: SentimentScore;
  quality?: QualityMetrics;
  domain_context?: string; // e.g., 'remote_work', 'saas', 'ai_tools'
  relevance_score?: number; // 0-1
}

export interface SearchFilters {
  platforms?: Platform[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  minScore?: number;
  tags?: string[];
  keywords?: string[];

  // Enhanced filters
  sentiment?: 'positive' | 'negative' | 'neutral';
  domains?: string[]; // e.g., ['remote_work', 'saas']
  minQuality?: number; // 0-1 (filters by spam score < threshold)
  problemsOnly?: boolean; // Only show posts with problems/pain points
}

export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}

export interface SignalInsight {
  problem: string;
  description: string;
  evidence: SocialPost[];
  confidence: number; // 0-1
  trend: 'rising' | 'steady' | 'declining';
  opportunity_score: number; // 0-100
}

export interface SearchResponse {
  query: string;
  results: SocialPost[];
  insights?: SignalInsight[];
  total_results: number;
  search_time_ms: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: SocialPost[];
  timestamp: Date;
}

export interface ConversationContext {
  messages: ChatMessage[];
  filters?: SearchFilters;
}
