'use client';

import { useState, useEffect } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../providers/ThemeProvider';

interface Stats {
  total_posts: number;
  platforms: number;
  last_updated: string;
  fallback?: boolean;
}

export default function Footer() {
  const { theme } = useTheme();
  const [stats, setStats] = useState<Stats>({
    total_posts: 300,
    platforms: 4,
    last_updated: new Date().toISOString(),
    fallback: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats', {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error(`Failed to fetch stats: ${error}`);
        // Keep fallback stats
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className={`border-t backdrop-blur-sm py-8 sm:py-12 ${
      theme === 'dark'
        ? 'border-[#3d2f1f] bg-[#29241f66]'
        : 'border-[#e8dcc8] bg-[#ffffff66]'
    }`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-2 text-center md:text-left">
            <SparklesIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'}`} />
            <span className={`text-sm sm:text-base ${theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}`}>
              Powered by <span className={`font-medium ${theme === 'dark' ? 'text-amber-300' : 'text-amber-800'}`}>Elasticsearch</span> & <span className={`font-medium ${theme === 'dark' ? 'text-amber-300' : 'text-amber-800'}`}>Vertex AI</span>
            </span>
          </div>
          <div className={`flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm ${theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'}`}>
            <span>
              {loading ? (
                <span className="inline-block animate-pulse">Loading...</span>
              ) : (
                <>
                  {Math.floor(stats.total_posts / 100) * 100}+ indexed posts
                </>
              )}
            </span>
            <span className="hidden sm:inline">•</span>
            <span>{stats.platforms} platforms</span>
            <span className="hidden sm:inline">•</span>
            <span>Real-time updates</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
