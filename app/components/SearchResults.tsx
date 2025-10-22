'use client';

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
  onPageChange
}: SearchResultsProps) {
  const { theme } = useTheme();

  if (results.length === 0) return null;

  return (
    <div id="search-results" className="mt-3 sm:mt-6">
      {/* Results Header */}
      <div className={`backdrop-blur-sm rounded-lg border p-3 sm:p-4 mb-3 sm:mb-4 ${
        theme === 'dark'
          ? 'bg-[#1f1a1733] border-[#4a3824]'
          : 'bg-[#ffffff99] border-[#e8dcc8]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
      </div>

      {/* Posts List */}
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

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
