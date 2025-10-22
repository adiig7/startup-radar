'use client';

import { useRouter } from 'next/navigation';
import { SparklesIcon, MagnifyingGlassIcon, ChartBarIcon, LightBulbIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function LandingPage() {
  const router = useRouter();

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
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                SignalScout
              </span>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
          <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
            <span className="text-blue-300 text-sm font-medium">Your Startup's Secret Weapon</span>
          </div>

          <h1 className="text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Find Signals
            </span>
            <br />
            <span className="text-white">That Build Startups</span>
          </h1>

          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Discover startup opportunities hidden in social conversations. Find early adopters, validate ideas, and spot trending problems across Reddit, Hacker News, Stack Overflow, Quora, Product Hunt, and 5+ more platforms.
          </p>

          <div className="space-y-4 mb-8 max-w-md mx-auto text-left">
            <div className="flex items-start gap-3">
              <div className="text-green-400 mt-1">✓</div>
              <p className="text-gray-300">Discover early adopters and validate startup ideas with real conversations</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-green-400 mt-1">✓</div>
              <p className="text-gray-300">Identify trending problems and market gaps before competitors</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-green-400 mt-1">✓</div>
              <p className="text-gray-300">Free to start - no credit card required</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              Detect Signals
              <ArrowRightIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium"
            >
              How It Works
            </button>
          </div>
        </div>

        {/* Platform Icons */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-16 opacity-60">
          <div className="text-4xl">🔴</div>
          <div className="text-4xl">🔶</div>
          <div className="text-4xl">📺</div>
          <div className="text-4xl">🚀</div>
          <div className="text-4xl">💬</div>
          <div className="text-4xl">📌</div>
          <div className="text-4xl">🐙</div>
          <div className="text-4xl">🟣</div>
        </div>
      </section>

      {/* Core Features */}
      <section className="bg-black/20 backdrop-blur-sm border-y border-white/10 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Core Features</h2>
            <p className="text-gray-300 text-lg">
              Everything you need to discover market opportunities, validate ideas, and stay ahead of the competition.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:border-blue-500/50 transition-all"
              >
                <div className="text-blue-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How Social Media Search Works</h2>
            <p className="text-gray-300 text-lg">
              Our advanced search technology helps you find meaningful conversations and validate startup ideas across multiple social media platforms.
            </p>
          </div>

          <div className="space-y-12">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="flex gap-8 items-start bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8"
              >
                <div className="flex-shrink-0 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-300 text-lg">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-y border-white/10 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Find Your Next Startup Idea?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of founders discovering opportunities in social conversations
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-10 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg inline-flex items-center gap-2"
          >
            Start Searching Now
            <ArrowRightIcon className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-blue-400" />
              <span className="text-gray-300">
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
