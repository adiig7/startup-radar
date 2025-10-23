'use client';

import { ChatBubbleLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../providers/ThemeProvider';
import PostCard from './PostCard';
import Pagination from './Pagination';
import type { SocialPost, Platform } from '@/lib/types';

interface SearchResultsProps {
  results: SocialPost[];
  totalResults: number;
  selectedPlatforms: Platform[];
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  currentResults: SocialPost[];
  expandedPosts: Set<string>;
  onToggleExpand: (postId: string) => void;
  onPageChange: (page: number) => void;
  onToggleChat: () => void;
  onAnalyzeOpportunity: () => void;
  searchQuery: string;
}

export default function SearchResults({
  results,
  totalResults,
  selectedPlatforms,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  currentResults,
  expandedPosts,
  onToggleExpand,
  onPageChange,
  onToggleChat,
  onAnalyzeOpportunity,
  searchQuery
}: SearchResultsProps) {
  const { theme } = useTheme();

  if (results.length === 0) return null;

  return (
    <div id="search-results" className="mt-3 sm:mt-6">
      <div className={`backdrop-blur-sm rounded-lg border p-3 sm:p-4 mb-3 sm:mb-4 ${
        theme === 'dark'
          ? 'bg-[#1f1a1733] border-[#4a3824]'
          : 'bg-[#ffffff99] border-[#e8dcc8]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className={`font-medium text-sm sm:text-base ${
              theme === 'dark' ? 'text-amber-100' : 'text-gray-900'
            }`}>
              Found {totalResults} results in {selectedPlatforms.length} platform
              {selectedPlatforms.length > 1 ? 's' : ''}
            </p>
            <p className={`text-xs sm:text-sm ${
              theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'
            }`}>
              Showing {startIndex + 1}-{Math.min(endIndex, totalResults)} of {totalResults}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onAnalyzeOpportunity}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-medium text-sm transition-all hover:scale-105 ${
                theme === 'dark'
                  ? 'border-amber-600 bg-amber-900 bg-opacity-30 text-amber-300 hover:bg-amber-900 hover:bg-opacity-50'
                  : 'border-amber-600 bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              <SparklesIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Analyze Opportunity</span>
              <span className="sm:hidden">Analyze</span>
            </button>

            <button
              onClick={onToggleChat}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-medium text-sm transition-all hover:scale-105 ${
                theme === 'dark'
                  ? 'border-[#6b5943] bg-[#3d2f1f80] text-[#d4c5ae] hover:border-amber-500 hover:text-amber-300'
                  : 'border-[#d4c5ae] bg-[#ffffff80] text-gray-700 hover:border-amber-400 hover:text-amber-800'
              }`}
            >
              <ChatBubbleLeftIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Chat about results</span>
              <span className="sm:hidden">Chat</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {currentResults.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isExpanded={expandedPosts.has(post.id)}
            onToggleExpand={onToggleExpand}
          />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
