'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { Platform, SocialPost } from '@/lib/types';

type Timeframe = '1hour' | '24hours' | '7days' | '30days' | '1year' | 'alltime';

export default function DashboardPage() {
  const router = useRouter();

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
    <main className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#fbf9f4] to-[#f0ebe0]">
      {/* Navigation */}
      <nav className="border-b border-[#e8dcc8] bg-[#fbf9f4cc] backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <SparklesIcon className="w-8 h-8 text-amber-700" />
              <span className="text-2xl font-bold text-gray-900">
                SignalScout
              </span>
            </button>
            <div className="flex items-center gap-6">
              <button
                className="text-amber-800 font-medium border-b-2 border-amber-800 pb-1"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/')}
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Form */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-[#ffffff99] backdrop-blur-sm rounded-lg border border-[#e8dcc8] p-6">
          {/* Query Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-800 mb-2">Search Query</label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'people struggling with remote work' or 'alternatives to Slack for small teams'"
              className="w-full px-4 py-3 bg-[#ffffffcc] border border-[#d4c5ae] rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 resize-none text-gray-900 placeholder-gray-500"
              rows={3}
            />
            <p className="text-sm text-gray-600 mt-1">{query.length} characters</p>
          </div>

          {/* Timeframe */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-800 mb-3">Timeframe</label>
            <div className="grid grid-cols-5 gap-3">
              {timeframeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeframe(option.value as Timeframe)}
                  className={`px-4 py-2 rounded-lg border font-medium transition-all ${
                    timeframe === option.value
                      ? 'border-amber-700 bg-[#a890703d] text-amber-900'
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
            <label className="block text-sm font-medium text-gray-800 mb-3">Results Limit</label>
            <div className="flex items-center gap-3">
              {[10, 25, 50, 100].map((value) => (
                <button
                  key={value}
                  onClick={() => setLimit(value)}
                  className={`px-4 py-2 rounded-lg border font-medium transition-all ${
                    limit === value
                      ? 'border-amber-700 bg-[#a890703d] text-amber-900'
                      : 'border-[#d4c5ae] bg-[#ffffff80] text-gray-700 hover:border-amber-400'
                  }`}
                >
                  {value}
                </button>
              ))}
              <div className="flex items-center gap-2 text-gray-800 ml-auto">
                <span className="text-2xl">📊</span>
                <span className="font-medium">{limit} results</span>
              </div>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-800 mb-3">Select Platforms</label>
            <div className="grid grid-cols-4 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.value}
                  onClick={() => togglePlatform(platform.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border font-medium transition-all ${
                    selectedPlatforms.includes(platform.value)
                      ? 'border-amber-700 bg-[#a890703d]'
                      : 'border-[#d4c5ae] bg-[#ffffff80] hover:border-amber-400'
                  }`}
                >
                  <span className="text-xl">{platform.icon}</span>
                  <span className={selectedPlatforms.includes(platform.value) ? 'text-amber-900' : 'text-gray-700'}>
                    {platform.label}
                  </span>
                  {selectedPlatforms.includes(platform.value) && <span className="ml-auto text-amber-700">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim() || selectedPlatforms.length === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-800 text-white rounded-lg font-medium hover:bg-amber-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            {loading ? 'Searching & Collecting Data...' : 'Search'}
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-6">
            <div className="bg-[#ffffff99] backdrop-blur-sm rounded-lg border border-[#e8dcc8] p-4 mb-4">
              <p className="text-gray-900 font-medium">
                Found {totalResults} results in {selectedPlatforms.length} platform
                {selectedPlatforms.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="space-y-4">
              {results.map((post) => (
                <div key={post.id} className="bg-[#ffffff99] backdrop-blur-sm rounded-lg border border-[#e8dcc8] p-4 hover:border-[#a8906e] transition-all">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getPlatformIcon(post.platform)}</span>
                    <div className="flex-1">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-amber-800 hover:text-amber-900 transition-colors"
                      >
                        {post.title}
                      </a>
                      <p className="text-gray-700 mt-1 line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                        <span className="capitalize font-medium text-gray-800">{post.platform}</span>
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
                            <span key={idx} className="px-2 py-1 bg-[#fbe8b880] border border-[#d4c5ae] text-amber-900 text-xs rounded">
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
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-700 border-t-transparent"></div>
            <p className="mt-4 text-gray-700">Searching across platforms...</p>
          </div>
        )}
      </div>
    </main>
  );
}
