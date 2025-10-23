'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { FaReddit, FaYoutube } from 'react-icons/fa';
import { SiProducthunt } from 'react-icons/si';
import { useTheme } from '../providers/ThemeProvider';
import type { Platform } from '@/lib/types';

type Timeframe = '1hour' | '24hours' | '7days' | '30days' | '1year' | 'alltime';

interface SearchFormProps {
  query: string;
  setQuery: (query: string) => void;
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
  selectedPlatforms: Platform[];
  setSelectedPlatforms: (platforms: Platform[]) => void;
  useReranking: boolean;
  setUseReranking: (useReranking: boolean) => void;
  onSearch: () => void;
  loading: boolean;
}

export default function SearchForm({
  query,
  setQuery,
  timeframe,
  setTimeframe,
  selectedPlatforms,
  setSelectedPlatforms,
  useReranking,
  setUseReranking,
  onSearch,
  loading
}: SearchFormProps) {
  const { theme } = useTheme();

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

  return (
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

      {/* AI Reranking Toggle */}
      <div className="mb-6">
        <label className={`flex items-center gap-3 cursor-pointer group ${
          theme === 'dark' ? 'text-amber-200' : 'text-gray-800'
        }`}>
          <input
            type="checkbox"
            checked={useReranking}
            onChange={(e) => setUseReranking(e.target.checked)}
            className="w-5 h-5 rounded border-2 cursor-pointer transition-colors checked:bg-amber-600 checked:border-amber-600 focus:ring-2 focus:ring-amber-500"
          />
          <div className="flex-1">
            <span className="font-medium text-sm sm:text-base flex items-center gap-2">
              🔥 AI-Powered Reranking
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                theme === 'dark' ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
              }`}>
                Beta
              </span>
            </span>
            <p className={`text-xs mt-1 ${
              theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'
            }`}>
              Uses Vertex AI + Elastic Open Inference API for superior result relevance
            </p>
          </div>
        </label>
      </div>

      {/* Search Button */}
      <button
        onClick={onSearch}
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
  );
}
