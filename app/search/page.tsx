'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { Platform, SocialPost } from '@/lib/types';

type Timeframe = '1hour' | '24hours' | '7days' | '30days' | '1year';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [timeframe, setTimeframe] = useState<Timeframe>('24hours');
  const [limit, setLimit] = useState(10);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['reddit']);
  const [results, setResults] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const timeframeOptions = [
    { value: '1hour', label: '1 Hour' },
    { value: '24hours', label: '24 Hours' },
    { value: '7days', label: '7 Days' },
    { value: '30days', label: '30 Days' },
    { value: '1year', label: '1 Year' },
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
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Social Media Search</h1>
          <p className="text-gray-600 text-sm mt-1">
            Find conversations around your product to identify potential early users
          </p>
        </div>
      </header>

      {/* Search Form */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Query Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Natural Language Query</label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'people struggling with remote work' or 'alternatives to Slack for small teams'"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
            <p className="text-sm text-gray-500 mt-1">0/{query.length} characters</p>
          </div>

          {/* Timeframe */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Timeframe</label>
            <div className="grid grid-cols-5 gap-3">
              {timeframeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeframe(option.value as Timeframe)}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                    timeframe === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Limit */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Results Limit</label>
            <div className="flex items-center gap-3">
              {[10, 25, 50, 100].map((value) => (
                <button
                  key={value}
                  onClick={() => setLimit(value)}
                  className={`px-4 py-2 rounded-lg border font-medium transition-all ${
                    limit === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {value}
                </button>
              ))}
              <div className="flex items-center gap-2 text-gray-600 ml-auto">
                <span className="text-2xl">📊</span>
                <span className="font-medium">{limit} results</span>
              </div>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Platforms</label>
            <div className="grid grid-cols-4 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.value}
                  onClick={() => togglePlatform(platform.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                    selectedPlatforms.includes(platform.value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl">{platform.icon}</span>
                  <span className={selectedPlatforms.includes(platform.value) ? 'text-blue-700' : 'text-gray-700'}>
                    {platform.label}
                  </span>
                  {selectedPlatforms.includes(platform.value) && <span className="ml-auto text-blue-500">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Search Button */}
          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim() || selectedPlatforms.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
              {loading ? 'Searching...' : 'Search (Shift + Enter)'}
            </button>
            <button
              onClick={async () => {
                if (!query.trim()) return;
                const confirmed = confirm(`Collect fresh data for "${query}"?\n\nThis will fetch from YouTube, Reddit, HackerNews, and ProductHunt and index to Elasticsearch.`);
                if (!confirmed) return;

                setLoading(true);
                try {
                  const res = await fetch('/api/admin/collect-now', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: query.trim() })
                  });
                  const data = await res.json();
                  alert(`✅ Collected ${data.postsCollected} posts!\n\nYouTube: ${data.platforms.youtube}\nReddit: ${data.platforms.reddit}\nHackerNews: ${data.platforms.hackernews}\nProductHunt: ${data.platforms.producthunt}`);
                  // Re-run search to see new data
                  await handleSearch();
                } catch (err) {
                  alert('❌ Collection failed. Check console for errors.');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              🔄 Collect Fresh Data
            </button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-6">
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
              <p className="text-gray-700 font-medium">
                Found {totalResults} results in {selectedPlatforms.length} platform
                {selectedPlatforms.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="space-y-4">
              {results.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getPlatformIcon(post.platform)}</span>
                    <div className="flex-1">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {post.title}
                      </a>
                      <p className="text-gray-600 mt-1 line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="capitalize font-medium">{post.platform}</span>
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
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
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
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Searching across platforms...</p>
          </div>
        )}
      </div>
    </main>
  );
}
