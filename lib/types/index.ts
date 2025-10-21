// Core types for SignalScout

export type Platform = 'reddit' | 'hackernews' | 'stackoverflow' | 'producthunt' | 'twitter' | 'quora';

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
