'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, ChartBarIcon, LightBulbIcon, ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { FaReddit, FaYoutube } from 'react-icons/fa';
import { SiProducthunt } from 'react-icons/si';
import { useTheme } from './providers/ThemeProvider';
import Header from './components/Header';
import Footer from './components/Footer';

export default function LandingPage() {
  const router = useRouter();
  const { theme } = useTheme();

  const features = [
    {
      icon: <SparklesIcon className="w-8 h-8" />,
      title: 'AI Idea Validation',
      description: 'Enter your startup idea and get instant validation backed by real social media discussions. Get scores for market demand, problem severity, competition, and monetization potential.'
    },
    {
      icon: <MagnifyingGlassIcon className="w-8 h-8" />,
      title: 'Social Media Search',
      description: 'Search across Reddit, Hacker News, YouTube, Product Hunt, and more platforms to find relevant conversations and discover what people are struggling with.'
    },
    {
      icon: <LightBulbIcon className="w-8 h-8" />,
      title: 'Opportunity Analysis',
      description: 'Analyze search results to identify trending problems, early adopters, and market gaps with AI-powered opportunity scoring and insights.'
    },
    {
      icon: <ChartBarIcon className="w-8 h-8" />,
      title: 'Grounded AI Chat',
      description: 'Ask questions about your search results and get instant answers grounded in real discussions, not hallucinated information.'
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Enter Your Search',
      description: 'Enter keywords or describe the problem your startup solves. Our hybrid search combines keyword matching with semantic understanding to find relevant discussions.'
    },
    {
      number: '2',
      title: 'Select Platforms',
      description: 'Search across Reddit, Hacker News, YouTube, and Product Hunt. Filter by date range and choose to enable AI-powered reranking for superior relevance.'
    },
    {
      number: '3',
      title: 'AI-Powered Analysis',
      description: 'Posts are analyzed for sentiment, quality, and spam detection. Optional AI reranking uses Vertex AI to surface the most relevant results from thousands of discussions.'
    },
    {
      number: '4',
      title: 'Get Insights',
      description: 'View analytics dashboards, get AI opportunity analysis, or chat with results for deeper insights. All answers are grounded in real discussions, not hallucinated.'
    },
  ];

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-[#29241f] via-[#39322c] to-[#29241f]'
        : 'bg-gradient-to-br from-[#f5f1e8] via-[#fbf9f4] to-[#f0ebe0]'
    }`}>
      <Header currentPage="home" />

      <main className="flex-1">

      <section className="max-w-6xl mx-auto px-4 py-12 sm:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <div className={`inline-block px-3 py-2 sm:px-4 border rounded-full mb-4 sm:mb-6 ${
            theme === 'dark'
              ? 'bg-[#3d2f1f] border-[#6b5943]'
              : 'bg-[#f5eddb] border-[#d4c5ae]'
          }`}>
            <span className={`text-xs sm:text-sm font-medium ${
              theme === 'dark' ? 'text-amber-300' : 'text-amber-900'
            }`}>Your Startup's Secret Weapon</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            <span className={theme === 'dark' ? 'text-amber-100' : 'text-gray-900'}>
              Discover Problems,
            </span>
            <br />
            <span className={theme === 'dark' ? 'text-amber-200' : 'text-gray-800'}>Validate Ideas</span>
          </h1>

          <p className={`text-base sm:text-xl mb-6 sm:mb-8 max-w-3xl mx-auto ${
            theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'
          }`}>
            Powered by <span className={`font-semibold ${theme === 'dark' ? 'text-amber-300' : 'text-amber-800'}`}>Elasticsearch hybrid search</span> and <span className={`font-semibold ${theme === 'dark' ? 'text-amber-300' : 'text-amber-800'}`}>Vertex AI</span>, StartupRadar analyzes thousands of real discussions from Reddit, Hacker News, YouTube, and Product Hunt to help you find trending problems and validate startup ideas before you build.
          </p>

          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 max-w-2xl mx-auto text-left">
            <div className="flex items-start gap-3">
              <div className={`${theme === 'dark' ? 'text-amber-500 mt-1' : 'text-green-600 mt-1'} text-sm sm:text-base`}>✓</div>
              <p className={`${theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'} text-sm sm:text-base`}>
                <span className="font-semibold">Validate startup ideas</span> by searching thousands of real discussions for market demand, pain points, and willingness to pay
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className={`${theme === 'dark' ? 'text-amber-500 mt-1' : 'text-green-600 mt-1'} text-sm sm:text-base`}>✓</div>
              <p className={`${theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'} text-sm sm:text-base`}>
                <span className="font-semibold">Discover trending problems</span> and market gaps before competitors by analyzing social conversations
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className={`${theme === 'dark' ? 'text-amber-500 mt-1' : 'text-green-600 mt-1'} text-sm sm:text-base`}>✓</div>
              <p className={`${theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'} text-sm sm:text-base`}>
                <span className="font-semibold">Find early adopters</span> and understand your target users with AI-powered analysis
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => router.push('/validate')}
              className={`w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 rounded-lg transition-all hover:scale-105 font-semibold flex items-center justify-center gap-2 text-sm sm:text-base ${
                theme === 'dark'
                  ? 'bg-amber-700 text-white hover:bg-amber-600'
                  : 'bg-amber-800 text-white hover:bg-amber-900'
              }`}
            >
              <SparklesIcon className="w-5 h-5" />
              Validate an Idea
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className={`w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 rounded-lg transition-all hover:scale-105 font-semibold flex items-center justify-center gap-2 text-sm sm:text-base border-2 ${
                theme === 'dark'
                  ? 'border-amber-600 text-amber-200 hover:bg-[#3d2f1f]'
                  : 'border-amber-700 text-amber-900 hover:bg-[#f5eddb]'
              }`}
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
              Discover Problems
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 mt-8 sm:mt-16 opacity-60">
          <div className="flex items-center gap-2">
            <FaYoutube className="w-8 h-8 sm:w-12 sm:h-12 text-red-600" />
            <span className={`text-sm sm:text-base font-medium ${theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'}`}>YouTube</span>
          </div>
          <div className="flex items-center gap-2">
            <SiProducthunt className="w-8 h-8 sm:w-12 sm:h-12 text-orange-500" />
            <span className={`text-sm sm:text-base font-medium ${theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'}`}>Product Hunt</span>
          </div>
          <div className="flex items-center gap-2">
            <FaReddit className="w-8 h-8 sm:w-12 sm:h-12 text-orange-500" />
            <span className={`text-sm sm:text-base font-medium ${theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'}`}>Reddit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded bg-orange-600 flex items-center justify-center">
              <span className="text-white text-sm sm:text-xl font-bold">Y</span>
            </div>
            <span className={`text-sm sm:text-base font-medium ${theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'}`}>Hacker News</span>
          </div>
        </div>
      </section>

      <section className={`backdrop-blur-sm border-y py-12 sm:py-20 ${
        theme === 'dark'
          ? 'bg-[#29241f66] border-[#3d2f1f]'
          : 'bg-[#ffffff66] border-[#e8dcc8]'
      }`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className={`text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-amber-100' : 'text-gray-900'}`}>Core Features</h2>
            <p className={`text-base sm:text-lg ${theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}`}>
              Everything you need to discover market opportunities, validate ideas, and stay ahead of the competition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={`backdrop-blur-sm border rounded-xl p-4 sm:p-8 hover:border-amber-600 transition-all ${
                  theme === 'dark'
                    ? 'bg-[#1f1a1733] border-[#4a3824]'
                    : 'bg-[#ffffff99] border-[#e8dcc8]'
                }`}
              >
                <div className={`${theme === 'dark' ? 'text-amber-400 mb-3 sm:mb-4' : 'text-amber-700 mb-3 sm:mb-4'}`}>
                  {React.cloneElement(feature.icon, { className: "w-6 h-6 sm:w-8 sm:h-8" })}
                </div>
                <h3 className={`text-lg sm:text-xl font-bold mb-2 sm:mb-3 ${theme === 'dark' ? 'text-amber-100' : 'text-gray-900'}`}>{feature.title}</h3>
                <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className={`text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-amber-100' : 'text-gray-900'}`}>How It Works</h2>
            <p className={`text-base sm:text-lg ${theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}`}>
              Our hybrid search and AI validation technology analyzes thousands of real discussions to help you discover problems and validate startup ideas.
            </p>
          </div>

          <div className="space-y-6 sm:space-y-12">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`flex flex-col sm:flex-row gap-4 sm:gap-8 items-start backdrop-blur-sm border rounded-xl p-4 sm:p-8 ${
                  theme === 'dark'
                    ? 'bg-[#1f1a1733] border-[#4a3824]'
                    : 'bg-[#ffffff99] border-[#e8dcc8]'
                }`}
              >
                <div className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-lg sm:text-2xl font-bold ${
                  theme === 'dark'
                    ? 'bg-amber-700 text-white'
                    : 'bg-amber-800 text-white'
                }`}>
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg sm:text-2xl font-bold mb-2 sm:mb-3 ${theme === 'dark' ? 'text-amber-100' : 'text-gray-900'}`}>{step.title}</h3>
                  <p className={`text-sm sm:text-lg ${theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}`}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`border-y py-12 sm:py-20 ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-[#3d2f1f] to-[#4a3824] border-[#3d2f1f]'
          : 'bg-gradient-to-r from-[#f5eddb] to-[#e8dcc8] border-[#e8dcc8]'
      }`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className={`text-2xl sm:text-4xl font-bold mb-4 sm:mb-6 ${theme === 'dark' ? 'text-amber-100' : 'text-gray-900'}`}>Ready to Build Your Next Startup?</h2>
          <p className={`text-base sm:text-xl mb-6 sm:mb-8 ${theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}`}>
            Validate your ideas and discover opportunities backed by real conversations
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => router.push('/validate')}
              className={`w-full sm:w-auto px-6 py-3 sm:px-10 sm:py-4 rounded-lg transition-all hover:scale-105 font-semibold text-base sm:text-lg inline-flex items-center justify-center gap-2 ${
                theme === 'dark'
                  ? 'bg-amber-700 text-white hover:bg-amber-600'
                  : 'bg-amber-800 text-white hover:bg-amber-900'
              }`}
            >
              <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              Validate an Idea
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className={`w-full sm:w-auto px-6 py-3 sm:px-10 sm:py-4 rounded-lg transition-all hover:scale-105 font-semibold text-base sm:text-lg inline-flex items-center justify-center gap-2 border-2 ${
                theme === 'dark'
                  ? 'border-amber-400 text-amber-200 hover:bg-[#3d2f1f]'
                  : 'border-amber-700 text-amber-900 hover:bg-[#f5eddb]'
              }`}
            >
              <MagnifyingGlassIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              Discover Problems
            </button>
          </div>
        </div>
      </section>
      </main>

      <Footer />
    </div>
  );
}
