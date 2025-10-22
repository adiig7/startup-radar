'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, SparklesIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState('');

  const handleSearch = () => {
    if (!input.trim()) return;
    // Navigate to search page with query
    router.push(`/search?q=${encodeURIComponent(input.trim())}`);
  };

  const handleExampleClick = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const exampleQueries = [
    { icon: '💼', text: 'What problems are fintech founders facing?' },
    { icon: '🤖', text: 'Find early adopters for AI developer tools' },
    { icon: '🛠️', text: 'What are people saying about no-code tools?' },
    { icon: '📈', text: 'Trending problems in SaaS this week' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              SignalScout
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/search"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              🔍 Search
            </a>
            <p className="text-sm text-gray-300 hidden sm:block">
              Find startup opportunities in social conversations
            </p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <SparklesIcon className="w-20 h-20 text-blue-400" />
              <div className="absolute -top-2 -right-2">
                <SparklesIcon className="w-8 h-8 text-purple-400 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Find Your Next Startup Idea
          </h2>

          {/* Subtitle */}
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Ask me anything about startup opportunities, market trends, or early adopter insights from Reddit, Hacker News, and more.
          </p>

          {/* Example Queries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16 max-w-3xl mx-auto">
            {exampleQueries.map((query, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(query.text)}
                className="group p-6 border border-white/10 rounded-xl hover:border-blue-400/50 hover:bg-white/5 transition-all text-left bg-black/20 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <MagnifyingGlassIcon className="w-5 h-5 text-blue-400 mt-1 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-gray-200 group-hover:text-white transition-colors">
                      {query.text}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12 text-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300">Real-time data</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <SparklesIcon className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300">AI-powered insights</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
              <ChatBubbleLeftRightIcon className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300">Grounded in facts</span>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 p-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ask about startup opportunities, trends, or problems..."
              className="flex-1 px-6 py-4 bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg"
            />
            <button
              onClick={handleSearch}
              disabled={!input.trim()}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl"
            >
              Send
            </button>
          </div>
          <p className="text-center text-gray-400 text-sm mt-4">
            Press Enter to search across YouTube, Reddit, HackerNews, and ProductHunt
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-blue-400" />
              <span className="text-gray-300 text-sm">
                Powered by Elasticsearch & Google Cloud Vertex AI
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>295+ indexed posts</span>
              <span>•</span>
              <span>4 platforms</span>
              <span>•</span>
              <span>Real-time updates</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
