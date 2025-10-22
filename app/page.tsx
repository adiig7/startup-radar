'use client';

import { useRouter } from 'next/navigation';
import { SparklesIcon, MagnifyingGlassIcon, ChartBarIcon, LightBulbIcon, ArrowRightIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from './providers/ThemeProvider';

export default function LandingPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: <MagnifyingGlassIcon className="w-8 h-8" />,
      title: 'Social Media Search',
      description: 'Search across Reddit, Stack Overflow, Hacker News, Quora, Product Hunt, YouTube, and more platforms to find relevant conversations and discussions.'
    },
    {
      icon: <LightBulbIcon className="w-8 h-8" />,
      title: 'Trending Problems',
      description: 'Identify trending problems and market gaps before competitors by analyzing real-time social conversations and discussions.'
    },
    {
      icon: <ChartBarIcon className="w-8 h-8" />,
      title: 'Competitive Intelligence',
      description: 'Monitor your competitors and discover market opportunities before they become obvious to everyone else with AI-powered analysis.'
    },
    {
      icon: <SparklesIcon className="w-8 h-8" />,
      title: 'GPT Analysis',
      description: 'Analyze how well your brand gets recommended by AI systems and get actionable insights to improve your visibility.'
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Enter Your Search',
      description: 'Start by entering keywords or a natural language query that describes what your startup is about. Our smart search understands context and intent.'
    },
    {
      number: '2',
      title: 'Select Platforms',
      description: 'Choose from Reddit, Stack Overflow, Hacker News, Pinterest, Tumblr, GitHub, YouTube, Quora, and Mastodon to search across multiple platforms simultaneously.'
    },
    {
      number: '3',
      title: 'Advanced Analysis',
      description: 'We analyze posts for emotional content, intent, and relevance to help you find exactly what you\'re looking for with signal strength indicators.'
    },
    {
      number: '4',
      title: 'Get Results',
      description: 'Receive curated results with emotional context, making it easy to identify and connect with the right people for your startup.'
    },
  ];

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
            <div className="flex items-center gap-2">
              <SparklesIcon className={`w-8 h-8 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'}`} />
              <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-amber-100' : 'text-gray-900'}`}>
                SignalScout
              </span>
            </div>
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
                onClick={() => router.push('/dashboard')}
                className={`transition-colors ${
                  theme === 'dark'
                    ? 'text-amber-200 hover:text-amber-100'
                    : 'text-gray-800 hover:text-gray-900'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className={`px-6 py-2 rounded-lg transition-colors font-medium ${
                  theme === 'dark'
                    ? 'bg-amber-700 text-white hover:bg-amber-600'
                    : 'bg-amber-800 text-white hover:bg-amber-900'
                }`}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <div className={`inline-block px-4 py-2 border rounded-full mb-6 ${
            theme === 'dark'
              ? 'bg-[#3d2f1f] border-[#6b5943]'
              : 'bg-[#f5eddb] border-[#d4c5ae]'
          }`}>
            <span className={`text-sm font-medium ${
              theme === 'dark' ? 'text-amber-300' : 'text-amber-900'
            }`}>Your Startup's Secret Weapon</span>
          </div>

          <h1 className="text-6xl font-bold mb-6">
            <span className={theme === 'dark' ? 'text-amber-100' : 'text-gray-900'}>
              Find Signals
            </span>
            <br />
            <span className={theme === 'dark' ? 'text-amber-200' : 'text-gray-800'}>That Build Startups</span>
          </h1>

          <p className={`text-xl mb-8 max-w-3xl mx-auto ${
            theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'
          }`}>
            Discover startup opportunities hidden in social conversations. Find early adopters, validate ideas, and spot trending problems across Reddit, Hacker News, Stack Overflow, Quora, Product Hunt, and 5+ more platforms.
          </p>

          <div className="space-y-4 mb-8 max-w-md mx-auto text-left">
            <div className="flex items-start gap-3">
              <div className={theme === 'dark' ? 'text-amber-500 mt-1' : 'text-green-600 mt-1'}>✓</div>
              <p className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}>
                Discover early adopters and validate startup ideas with real conversations
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className={theme === 'dark' ? 'text-amber-500 mt-1' : 'text-green-600 mt-1'}>✓</div>
              <p className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}>
                Identify trending problems and market gaps before competitors
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className={theme === 'dark' ? 'text-amber-500 mt-1' : 'text-green-600 mt-1'}>✓</div>
              <p className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}>
                Free to start - no credit card required
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className={`px-8 py-4 rounded-lg transition-colors font-medium flex items-center gap-2 ${
                theme === 'dark'
                  ? 'bg-amber-700 text-white hover:bg-amber-600'
                  : 'bg-amber-800 text-white hover:bg-amber-900'
              }`}
            >
              Detect Signals
              <ArrowRightIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`px-8 py-4 rounded-lg transition-colors font-medium ${
                theme === 'dark'
                  ? 'bg-[#3d2f1f] text-amber-100 hover:bg-[#4a3824]'
                  : 'bg-[#e8dcc8] text-gray-900 hover:bg-[#d4c5ae]'
              }`}
            >
              How It Works
            </button>
          </div>
        </div>

        {/* Platform Icons */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-16 opacity-60">
          <div className="text-4xl">📺</div>
          <div className="text-4xl">🚀</div>
          <div className="text-4xl">💬</div>
          <div className="text-4xl">📌</div>
        </div>
      </section>

      {/* Core Features */}
      <section className={`backdrop-blur-sm border-y py-20 ${
        theme === 'dark'
          ? 'bg-[#29241f66] border-[#3d2f1f]'
          : 'bg-[#ffffff66] border-[#e8dcc8]'
      }`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-amber-100' : 'text-gray-900'}`}>Core Features</h2>
            <p className={`text-lg ${theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}`}>
              Everything you need to discover market opportunities, validate ideas, and stay ahead of the competition.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={`backdrop-blur-sm border rounded-xl p-8 hover:border-amber-600 transition-all ${
                  theme === 'dark'
                    ? 'bg-[#1f1a1733] border-[#4a3824]'
                    : 'bg-[#ffffff99] border-[#e8dcc8]'
                }`}
              >
                <div className={theme === 'dark' ? 'text-amber-400 mb-4' : 'text-amber-700 mb-4'}>{feature.icon}</div>
                <h3 className={`text-xl font-bold mb-3 ${theme === 'dark' ? 'text-amber-100' : 'text-gray-900'}`}>{feature.title}</h3>
                <p className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-amber-100' : 'text-gray-900'}`}>How Social Media Search Works</h2>
            <p className={`text-lg ${theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}`}>
              Our advanced search technology helps you find meaningful conversations and validate startup ideas across multiple social media platforms.
            </p>
          </div>

          <div className="space-y-12">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`flex gap-8 items-start backdrop-blur-sm border rounded-xl p-8 ${
                  theme === 'dark'
                    ? 'bg-[#1f1a1733] border-[#4a3824]'
                    : 'bg-[#ffffff99] border-[#e8dcc8]'
                }`}
              >
                <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                  theme === 'dark'
                    ? 'bg-amber-700 text-white'
                    : 'bg-amber-800 text-white'
                }`}>
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className={`text-2xl font-bold mb-3 ${theme === 'dark' ? 'text-amber-100' : 'text-gray-900'}`}>{step.title}</h3>
                  <p className={`text-lg ${theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}`}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`border-y py-20 ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-[#3d2f1f] to-[#4a3824] border-[#3d2f1f]'
          : 'bg-gradient-to-r from-[#f5eddb] to-[#e8dcc8] border-[#e8dcc8]'
      }`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className={`text-4xl font-bold mb-6 ${theme === 'dark' ? 'text-amber-100' : 'text-gray-900'}`}>Ready to Find Your Next Startup Idea?</h2>
          <p className={`text-xl mb-8 ${theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}`}>
            Join thousands of founders discovering opportunities in social conversations
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className={`px-10 py-4 rounded-lg transition-colors font-medium text-lg inline-flex items-center gap-2 ${
              theme === 'dark'
                ? 'bg-amber-700 text-white hover:bg-amber-600'
                : 'bg-amber-800 text-white hover:bg-amber-900'
            }`}
          >
            Start Searching Now
            <ArrowRightIcon className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t backdrop-blur-sm py-12 ${
        theme === 'dark'
          ? 'border-[#3d2f1f] bg-[#29241f66]'
          : 'border-[#e8dcc8] bg-[#ffffff66]'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <SparklesIcon className={`w-6 h-6 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'}`} />
              <span className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}>
                Powered by Elasticsearch & Google Cloud Vertex AI
              </span>
            </div>
            <div className={`flex items-center gap-6 text-sm ${theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'}`}>
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
