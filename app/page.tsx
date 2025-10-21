'use client';

import { useState } from 'react';
import { ChatBubbleLeftRightIcon, MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { ChatMessage, SocialPost } from '@/lib/types';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          context: { messages },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const assistantMessage: ChatMessage = await response.json();
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const exampleQueries = [
    'What problems are fintech founders facing?',
    'Find early adopters for AI developer tools',
    'What are people saying about no-code tools?',
    'Trending problems in SaaS this week',
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SignalScout
            </h1>
          </div>
          <p className="text-sm text-gray-600 hidden sm:block">
            Find startup opportunities in social conversations
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {messages.length === 0 ? (
          // Welcome Screen
          <div className="text-center py-12">
            <SparklesIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Find Your Next Startup Idea
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Ask me anything about startup opportunities, market trends, or early adopter insights from Reddit, Hacker
              News, and more.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
              {exampleQueries.map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(query)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all text-left bg-white"
                >
                  <MagnifyingGlassIcon className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-sm text-gray-700">{query}</p>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Real-time data</span>
              </div>
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-blue-600" />
                <span>AI-powered insights</span>
              </div>
              <div className="flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-purple-600" />
                <span>Grounded in facts</span>
              </div>
            </div>
          </div>
        ) : (
          // Chat Messages
          <div className="space-y-6 mb-24">
            {messages.map((message, idx) => (
              <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-3xl rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {/* Citations */}
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-semibold mb-2 text-gray-600">Sources:</p>
                      <div className="space-y-2">
                        {message.citations.map((citation: SocialPost, citIdx) => (
                          <a
                            key={citIdx}
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-2 bg-gray-50 rounded text-sm hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-gray-900">{citation.title}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {citation.platform} • {citation.score} points • {citation.num_comments} comments
                                </p>
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input Box */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about startup opportunities, trends, or problems..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Thinking...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
