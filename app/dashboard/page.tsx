'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, SparklesIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../providers/ThemeProvider';
import type { Platform, SocialPost } from '@/lib/types';

type Timeframe = '1hour' | '24hours' | '7days' | '30days' | '1year' | 'alltime';

export default function DashboardPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [query, setQuery] = useState('');
  const [timeframe, setTimeframe] = useState<Timeframe>('1year');
  const [limit, setLimit] = useState(10);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['youtube', 'reddit', 'hackernews', 'producthunt']);
  const [results, setResults] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const timeframeOptions = [
    { value: '24hours', label: '24 Hours' },
    { value: '7days', label: '7 Days' },
    { value: '30days', label: '30 Days' },
    { value: '1year', label: '1 Year' },
    { value: 'alltime', label: 'All Time' },
  ];

  const platforms: { value: Platform; label: string; icon: string }[] = [
    { value: 'reddit', label: 'Reddit', icon: '🔴' },
    { value: 'hackernews', label: 'Hacker News', icon: '🔶' },
    { value: 'youtube', label: 'YouTube', icon: '📺' },
    { value: 'producthunt', label: 'ProductHunt', icon: '🚀' },
  ];

  const togglePlatform = (platform: Platform) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
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

  const handleSearch = async () => {
    if (!query.trim() || selectedPlatforms.length === 0) return;

    setLoading(true);

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
          limit,
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
    const icons: Record<string, string> = {
      reddit: '🔴',
      hackernews: '🔶',
      youtube: '📺',
      producthunt: '🚀',
    };
    return icons[platform] || '📌';
  };

  return (
    <main className={`min-h-screen transition-colors ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-[#29241f] via-[#39322c] to-[#29241f]'
        : 'bg-gradient-to-br from-[#f5f1e8] via-[#fbf9f4] to-[#f0ebe0]'
    }`}>
      {/* Navigation */}
      <nav className={`border-b sticky top-0 z-50 backdrop-blur-sm ${
        theme === 'dark'
          ? 'border-[#3d2f1f] bg-[#29241fcc]'
          : 'border-[#e8dcc8] bg-[#fbf9f4cc]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <SparklesIcon className={`w-8 h-8 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'}`} />
              <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-amber-100' : 'text-gray-900'}`}>
                SignalScout
              </span>
            </button>
            <div className="flex items-center gap-6">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-[#3d2f1f] text-amber-200'
                    : 'hover:bg-[#f5eddb] text-gray-700'
                }`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </button>
              <button
                className={`font-medium border-b-2 pb-1 ${
                  theme === 'dark'
                    ? 'text-amber-200 border-amber-200'
                    : 'text-amber-800 border-amber-800'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/')}
                className={`transition-colors ${
                  theme === 'dark'
                    ? 'text-amber-200 hover:text-amber-100'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Form */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className={`backdrop-blur-sm rounded-lg border p-6 ${
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
            <div className="grid grid-cols-5 gap-3">
              {timeframeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeframe(option.value as Timeframe)}
                  className={`px-4 py-2 rounded-lg border font-medium transition-all ${
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

          {/* Results Limit */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-3 ${
              theme === 'dark' ? 'text-amber-200' : 'text-gray-800'
            }`}>Results Limit</label>
            <div className="flex items-center gap-3">
              {[10, 25, 50, 100].map((value) => (
                <button
                  key={value}
                  onClick={() => setLimit(value)}
                  className={`px-4 py-2 rounded-lg border font-medium transition-all ${
                    limit === value
                      ? theme === 'dark'
                        ? 'border-amber-600 bg-[#a8907033] text-amber-200'
                        : 'border-amber-700 bg-[#a890703d] text-amber-900'
                      : theme === 'dark'
                        ? 'border-[#6b5943] bg-[#3d2f1f80] text-[#d4c5ae] hover:border-amber-500'
                        : 'border-[#d4c5ae] bg-[#ffffff80] text-gray-700 hover:border-amber-400'
                  }`}
                >
                  {value}
                </button>
              ))}
              <div className={`flex items-center gap-2 ml-auto ${
                theme === 'dark' ? 'text-amber-200' : 'text-gray-800'
              }`}>
                <span className="text-2xl">📊</span>
                <span className="font-medium">{limit} results</span>
              </div>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-3 ${
              theme === 'dark' ? 'text-amber-200' : 'text-gray-800'
            }`}>Select Platforms</label>
            <div className="grid grid-cols-4 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.value}
                  onClick={() => togglePlatform(platform.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border font-medium transition-all ${
                    selectedPlatforms.includes(platform.value)
                      ? theme === 'dark'
                        ? 'border-amber-600 bg-[#a8907033]'
                        : 'border-amber-700 bg-[#a890703d]'
                      : theme === 'dark'
                        ? 'border-[#6b5943] bg-[#3d2f1f80] hover:border-amber-500'
                        : 'border-[#d4c5ae] bg-[#ffffff80] hover:border-amber-400'
                  }`}
                >
                  <span className="text-xl">{platform.icon}</span>
                  <span className={selectedPlatforms.includes(platform.value) 
                    ? theme === 'dark' ? 'text-amber-200' : 'text-amber-900'
                    : theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-700'
                  }>
                    {platform.label}
                  </span>
                  {selectedPlatforms.includes(platform.value) && (
                    <span className={`ml-auto ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'}`}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim() || selectedPlatforms.length === 0}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg ${
              theme === 'dark'
                ? 'bg-amber-700 text-white hover:bg-amber-600'
                : 'bg-amber-800 text-white hover:bg-amber-900'
            }`}
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            {loading ? 'Searching & Collecting Data...' : 'Search'}
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-6">
            <div className={`backdrop-blur-sm rounded-lg border p-4 mb-4 ${
              theme === 'dark'
                ? 'bg-[#1f1a1733] border-[#4a3824]'
                : 'bg-[#ffffff99] border-[#e8dcc8]'
            }`}>
              <p className={`font-medium ${
                theme === 'dark' ? 'text-amber-100' : 'text-gray-900'
              }`}>
                Found {totalResults} results in {selectedPlatforms.length} platform
                {selectedPlatforms.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="space-y-4">
              {results.map((post) => (
                <div key={post.id} className={`backdrop-blur-sm rounded-lg border p-4 transition-all ${
                  theme === 'dark'
                    ? 'bg-[#1f1a1733] border-[#4a3824] hover:border-amber-600'
                    : 'bg-[#ffffff99] border-[#e8dcc8] hover:border-[#a8906e]'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getPlatformIcon(post.platform)}</span>
                    <div className="flex-1">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-lg font-semibold transition-colors ${
                          theme === 'dark'
                            ? 'text-amber-300 hover:text-amber-200'
                            : 'text-amber-800 hover:text-amber-900'
                        }`}
                      >
                        {post.title}
                      </a>
                      <p className={`mt-1 line-clamp-2 ${
                        theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'
                      }`}>{post.content}</p>
                      <div className={`flex items-center gap-4 mt-3 text-sm ${
                        theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'
                      }`}>
                        <span className={`capitalize font-medium ${
                          theme === 'dark' ? 'text-amber-200' : 'text-gray-800'
                        }`}>{post.platform}</span>
                        <span>•</span>
                        <span>{post.author}</span>
                        <span>•</span>
                        <span>👍 {post.score}</span>
                        <span>•</span>
                        <span>💬 {post.num_comments}</span>
                        <span>•</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                      {post.tags.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {post.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className={`px-2 py-1 border text-xs rounded ${
                              theme === 'dark'
                                ? 'bg-[#a8907033] border-[#6b5943] text-amber-200'
                                : 'bg-[#fbe8b880] border-[#d4c5ae] text-amber-900'
                            }`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
  );
}
