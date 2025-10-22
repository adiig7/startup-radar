'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { FaReddit, FaYoutube } from 'react-icons/fa';
import { SiProducthunt } from 'react-icons/si';
import { useTheme } from '../providers/ThemeProvider';
import Header from '../components/Header';
import Footer from '../components/Footer';
import type { Platform, SocialPost } from '@/lib/types';
import { formatContentForDisplay } from '@/lib/utils/text';

type Timeframe = '1hour' | '24hours' | '7days' | '30days' | '1year' | 'alltime';

export default function DashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();

  const [query, setQuery] = useState('');
  const [timeframe, setTimeframe] = useState<Timeframe>('7days');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['youtube', 'reddit', 'hackernews', 'producthunt']);
  const [results, setResults] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  const timeframeOptions = [
    { value: '24hours', label: '24 Hours' },
    { value: '7days', label: '7 Days' },
    { value: '30days', label: '30 Days' },
    { value: '1year', label: '1 Year' },
    { value: 'alltime', label: 'All Time' },
  ];

  const platforms: { value: Platform; label: string; icon: JSX.Element; color: string }[] = [
    { 
      value: 'reddit', 
      label: 'Reddit', 
      icon: <FaReddit className="w-5 h-5 text-orange-500" />,
      color: 'text-orange-500'
    },
    { 
      value: 'hackernews', 
      label: 'Hacker News', 
      icon: (
        <div className="w-5 h-5 rounded bg-orange-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">Y</span>
        </div>
      ),
      color: 'text-orange-600'
    },
    { 
      value: 'youtube', 
      label: 'YouTube', 
      icon: <FaYoutube className="w-5 h-5 text-red-600" />,
      color: 'text-red-600'
    },
    { 
      value: 'producthunt', 
      label: 'ProductHunt', 
      icon: <SiProducthunt className="w-5 h-5 text-orange-500" />,
      color: 'text-orange-500'
    },
  ];

  const togglePlatform = (platform: Platform) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  const toggleExpandPost = (postId: string) => {
    const newExpanded = new Set(expandedPosts);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedPosts(newExpanded);
  };

  // Pagination helpers
  const totalPages = Math.ceil(totalResults / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = results.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of results
    document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' });
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const getDateRange = (timeframe: Timeframe) => {
    const now = new Date();
    const from = new Date();

    switch (timeframe) {
      case '1hour':
        from.setHours(now.getHours() - 1);
        break;
      case '24hours':
        from.setDate(now.getDate() - 1);
        break;
      case '7days':
        from.setDate(now.getDate() - 7);
        break;
      case '30days':
        from.setDate(now.getDate() - 30);
        break;
      case '1year':
        from.setFullYear(now.getFullYear() - 1);
        break;
      case 'alltime':
        // Set to a very old date (e.g., year 2000)
        from.setFullYear(2000, 0, 1);
        break;
    }

    return { from, to: now };
  };

  const handleSearch = async (page: number = 1) => {
    if (!query.trim() || selectedPlatforms.length === 0) return;

    setLoading(true);
    
    // Reset to first page if this is a new search
    if (page === 1) {
      setCurrentPage(1);
      setExpandedPosts(new Set());
    }

    try {
      const dateRange = getDateRange(timeframe);

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          filters: {
            platforms: selectedPlatforms,
            dateRange: {
              from: dateRange.from,
              to: dateRange.to,
            },
          },
          limit: 1000, // Fetch a large number to get all results
          offset: 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results);
      setTotalResults(data.total_results);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const platformData = platforms.find(p => p.value === platform);
    if (platformData) {
      return platformData.icon;
    }
    
    // Fallback for unknown platforms
    return (
      <div className="w-5 h-5 rounded bg-gray-500 flex items-center justify-center">
        <span className="text-white text-xs font-bold">?</span>
      </div>
    );
  };

  const getPlatformColor = (platform: string) => {
    const platformData = platforms.find(p => p.value === platform);
    return platformData?.color || 'bg-gray-500';
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-[#29241f] via-[#39322c] to-[#29241f]'
        : 'bg-gradient-to-br from-[#f5f1e8] via-[#fbf9f4] to-[#f0ebe0]'
    }`}>
      <Header showDashboardButton={false} currentPage="dashboard" />

      {/* Search Form */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-6">
        <div className={`backdrop-blur-sm rounded-lg border p-4 sm:p-6 ${
          theme === 'dark'
            ? 'bg-[#1f1a1733] border-[#4a3824]'
            : 'bg-[#ffffff99] border-[#e8dcc8]'
        }`}>
          {/* Query Input */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-amber-200' : 'text-gray-800'
            }`}>Search Query</label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'people struggling with remote work' or 'alternatives to Slack for small teams'"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 resize-none ${
                theme === 'dark'
                  ? 'bg-[#3d2f1f] border-[#6b5943] text-amber-100 placeholder-[#a8906e]'
                  : 'bg-[#ffffffcc] border-[#d4c5ae] text-gray-900 placeholder-gray-500'
              }`}
              rows={3}
            />
            <p className={`text-sm mt-1 ${
              theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'
            }`}>{query.length} characters</p>
          </div>

          {/* Timeframe */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-3 ${
              theme === 'dark' ? 'text-amber-200' : 'text-gray-800'
            }`}>Timeframe</label>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
              {timeframeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeframe(option.value as Timeframe)}
                  className={`px-3 py-2 sm:px-4 rounded-lg border font-medium transition-all text-sm sm:text-base ${
                    timeframe === option.value
                      ? theme === 'dark'
                        ? 'border-amber-600 bg-[#a8907033] text-amber-200'
                        : 'border-amber-700 bg-[#a890703d] text-amber-900'
                      : theme === 'dark'
                        ? 'border-[#6b5943] bg-[#3d2f1f80] text-[#d4c5ae] hover:border-amber-500'
                        : 'border-[#d4c5ae] bg-[#ffffff80] text-gray-700 hover:border-amber-400'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>


          {/* Platform Selection */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-3 ${
              theme === 'dark' ? 'text-amber-200' : 'text-gray-800'
            }`}>Select Platforms</label>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.value}
                  onClick={() => togglePlatform(platform.value)}
                  className={`w-full sm:flex-1 sm:min-w-[160px] flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-lg border font-medium transition-all text-sm sm:text-base ${
                    selectedPlatforms.includes(platform.value)
                      ? theme === 'dark'
                        ? 'border-amber-600 bg-[#a8907033]'
                        : 'border-amber-700 bg-[#a890703d]'
                      : theme === 'dark'
                        ? 'border-[#6b5943] bg-[#3d2f1f80] hover:border-amber-500'
                        : 'border-[#d4c5ae] bg-[#ffffff80] hover:border-amber-400'
                  }`}
                >
                  <div className="flex-shrink-0">{platform.icon}</div>
                  <span className={`flex-1 text-left ${selectedPlatforms.includes(platform.value) 
                    ? theme === 'dark' ? 'text-amber-200' : 'text-amber-900'
                    : theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-700'
                  }`}>
                    {platform.label}
                  </span>
                  {selectedPlatforms.includes(platform.value) && (
                    <span className={`${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'}`}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim() || selectedPlatforms.length === 0}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 sm:px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg text-sm sm:text-base ${
              theme === 'dark'
                ? 'bg-amber-700 text-white hover:bg-amber-600'
                : 'bg-amber-800 text-white hover:bg-amber-900'
            }`}
          >
            <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">{loading ? 'Searching & Collecting Data...' : 'Search'}</span>
            <span className="sm:hidden">{loading ? 'Searching...' : 'Search'}</span>
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div id="search-results" className="mt-3 sm:mt-6">
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

            <div className="space-y-3 sm:space-y-4">
              {currentResults.map((post) => (
                <div key={post.id} className={`backdrop-blur-sm rounded-lg border p-4 sm:p-6 transition-all ${
                  theme === 'dark'
                    ? 'bg-[#1f1a1733] border-[#4a3824] hover:border-amber-600'
                    : 'bg-[#ffffff99] border-[#e8dcc8] hover:border-[#a8906e]'
                }`}>
                  {/* Platform Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                      theme === 'dark' 
                        ? 'bg-[#2a2520] border-[#4a3824]' 
                        : 'bg-white border-[#e8dcc8]'
                    }`}>
                      <div className="flex-shrink-0">{getPlatformIcon(post.platform)}</div>
                      <span className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-amber-200' : 'text-gray-800'
                      }`}>
                        {post.platform === 'hackernews' ? 'Hacker News' : 
                         post.platform === 'producthunt' ? 'Product Hunt' : 
                         post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 ml-auto">
                      <div className={`flex items-center gap-1 text-xs ${
                        theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'
                      }`}>
                        <span className="text-green-500">▲</span>
                        <span className="font-medium">{post.score}</span>
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${
                        theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'
                      }`}>
                        <span className="text-blue-500">💬</span>
                        <span className="font-medium">{post.num_comments}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-lg sm:text-xl font-semibold transition-colors block leading-tight ${
                        theme === 'dark'
                          ? 'text-amber-300 hover:text-amber-200'
                          : 'text-amber-800 hover:text-amber-900'
                      }`}
                    >
                      {post.title}
                    </a>
                    
                    {(() => {
                      const isExpanded = expandedPosts.has(post.id);
                      const contentData = formatContentForDisplay(post.content || '', undefined, false);
                      const displayContent = isExpanded ? contentData.originalContent : contentData.content;
                      
                      return (
                        <div>
                          <p className={`text-sm sm:text-base leading-relaxed ${
                            theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'
                          }`}>
                            {displayContent}
                          </p>
                          
                          {contentData.isTruncated && (
                            <button
                              onClick={() => toggleExpandPost(post.id)}
                              className={`mt-2 flex items-center gap-1 text-xs font-medium transition-colors ${
                                theme === 'dark'
                                  ? 'text-amber-400 hover:text-amber-300'
                                  : 'text-amber-700 hover:text-amber-800'
                              }`}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUpIcon className="w-3 h-3" />
                                  Show less
                                </>
                              ) : (
                                <>
                                  <ChevronDownIcon className="w-3 h-3" />
                                  Show more ({contentData.originalLength - contentData.truncatedLength} more characters)
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    {/* Metadata */}
                    <div className={`flex flex-wrap items-center gap-3 pt-2 border-t text-xs ${
                      theme === 'dark' 
                        ? 'border-[#4a3824] text-[#d4c5ae]' 
                        : 'border-[#e8dcc8] text-gray-600'
                    }`}>
                      <span className="font-medium">by {post.author}</span>
                      <span>•</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      {post.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex flex-wrap gap-1">
                            {post.tags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} className={`px-2 py-0.5 rounded text-xs ${
                                theme === 'dark'
                                  ? 'bg-[#a8907033] text-amber-300'
                                  : 'bg-[#fbe8b880] text-amber-800'
                              }`}>
                                {tag}
                              </span>
                            ))}
                            {post.tags.length > 2 && (
                              <span className={`text-xs ${
                                theme === 'dark' ? 'text-amber-400' : 'text-amber-700'
                              }`}>
                                +{post.tags.length - 2} more
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className={`mt-6 mb-8 p-3 sm:p-4 backdrop-blur-sm rounded-lg border ${
                theme === 'dark'
                  ? 'bg-[#1f1a1733] border-[#4a3824]'
                  : 'bg-[#ffffff99] border-[#e8dcc8]'
              }`}>
                {/* Mobile Layout */}
                <div className="flex sm:hidden flex-col items-center gap-3">
                  <div className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-amber-200' : 'text-gray-800'
                  }`}>
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded-lg border font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        theme === 'dark'
                          ? 'border-[#6b5943] bg-[#3d2f1f80] text-[#d4c5ae] hover:border-amber-500 disabled:hover:border-[#6b5943]'
                          : 'border-[#d4c5ae] bg-[#ffffff80] text-gray-700 hover:border-amber-400 disabled:hover:border-[#d4c5ae]'
                      }`}
                    >
                      Prev
                    </button>
                    
                    {/* Show fewer page numbers on mobile */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage <= 2) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 1) {
                          pageNum = totalPages - 2 + i;
                        } else {
                          pageNum = currentPage - 1 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`w-9 h-9 rounded-lg border font-medium transition-all text-sm flex items-center justify-center ${
                              currentPage === pageNum
                                ? theme === 'dark'
                                  ? 'border-amber-600 bg-[#a8907033] text-amber-200'
                                  : 'border-amber-700 bg-[#a890703d] text-amber-900'
                                : theme === 'dark'
                                  ? 'border-[#6b5943] bg-[#3d2f1f80] text-[#d4c5ae] hover:border-amber-500'
                                  : 'border-[#d4c5ae] bg-[#ffffff80] text-gray-700 hover:border-amber-400'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 rounded-lg border font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        theme === 'dark'
                          ? 'border-[#6b5943] bg-[#3d2f1f80] text-[#d4c5ae] hover:border-amber-500 disabled:hover:border-[#6b5943]'
                          : 'border-[#d4c5ae] bg-[#ffffff80] text-gray-700 hover:border-amber-400 disabled:hover:border-[#d4c5ae]'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:flex items-center justify-center gap-4">
                  <div className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-amber-200' : 'text-gray-800'
                  }`}>
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg border font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      theme === 'dark'
                        ? 'border-[#6b5943] bg-[#3d2f1f80] text-[#d4c5ae] hover:border-amber-500 disabled:hover:border-[#6b5943]'
                        : 'border-[#d4c5ae] bg-[#ffffff80] text-gray-700 hover:border-amber-400 disabled:hover:border-[#d4c5ae]'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`w-10 h-10 rounded-lg border font-medium transition-all text-sm flex items-center justify-center ${
                            currentPage === pageNum
                              ? theme === 'dark'
                                ? 'border-amber-600 bg-[#a8907033] text-amber-200'
                                : 'border-amber-700 bg-[#a890703d] text-amber-900'
                              : theme === 'dark'
                                ? 'border-[#6b5943] bg-[#3d2f1f80] text-[#d4c5ae] hover:border-amber-500'
                                : 'border-[#d4c5ae] bg-[#ffffff80] text-gray-700 hover:border-amber-400'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg border font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      theme === 'dark'
                        ? 'border-[#6b5943] bg-[#3d2f1f80] text-[#d4c5ae] hover:border-amber-500 disabled:hover:border-[#6b5943]'
                        : 'border-[#d4c5ae] bg-[#ffffff80] text-gray-700 hover:border-amber-400 disabled:hover:border-[#d4c5ae]'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="mt-6 text-center py-12">
            <div className={`inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-transparent ${
              theme === 'dark' ? 'border-amber-600' : 'border-amber-700'
            }`}></div>
            <p className={`mt-4 ${
              theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'
            }`}>Searching across platforms...</p>
          </div>
        )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
