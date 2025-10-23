'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../providers/ThemeProvider';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchForm from '../components/SearchForm';
import SearchResults from '../components/SearchResults';
import ChatPanel from '../components/ChatPanel';
import OpportunityReport from '../components/OpportunityReport';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import type { Platform, SocialPost } from '@/lib/types';
import type { OpportunityReport as OpportunityReportType } from '@/lib/ai/opportunity-analyzer';
import type { AnalyticsData } from '@/lib/elasticsearch/analytics';

type Timeframe = '1hour' | '24hours' | '7days' | '30days' | '1year' | 'alltime';

export default function DashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();

  const [query, setQuery] = useState('');
  const [timeframe, setTimeframe] = useState<Timeframe>('7days');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['youtube', 'reddit', 'hackernews', 'producthunt']);
  const [results, setResults] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [chatOpen, setChatOpen] = useState(false);
  const [opportunityReport, setOpportunityReport] = useState<OpportunityReportType | null>(null);
  const [analyzingOpportunity, setAnalyzingOpportunity] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);


  const toggleExpandPost = (postId: string) => {
    const newExpanded = new Set(expandedPosts);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedPosts(newExpanded);
  };

  const totalPages = Math.ceil(totalResults / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = results.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' });
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
        from.setFullYear(2000, 0, 1);
        break;
    }

    return { from, to: now };
  };

  const handleSearch = async (page: number = 1) => {
    if (!query.trim() || selectedPlatforms.length === 0) return;

    setLoading(true);
    
    if (page === 1) {
      setCurrentPage(1);
      setExpandedPosts(new Set());
    }

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
          limit: 1000,
          offset: 0,
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

  const handleAnalyzeOpportunity = async () => {
    if (!query.trim() || results.length === 0) return;

    setAnalyzingOpportunity(true);
    setOpportunityReport(null);

    try {
      const response = await fetch('/api/analyze-opportunity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          posts: results,
        }),
      });

      if (!response.ok) {
        throw new Error('Opportunity analysis failed');
      }

      const report = await response.json();
      setOpportunityReport(report);
    } catch (error) {
      console.error('Opportunity analysis error:', error);
      alert('Failed to analyze opportunity. Please try again.');
    } finally {
      setAnalyzingOpportunity(false);
    }
  };

  const handleViewAnalytics = async () => {
    if (!query.trim() || results.length === 0) return;

    setLoadingAnalytics(true);
    setShowAnalytics(true);

    try {
      const dateRange = getDateRange(timeframe);

      const response = await fetch('/api/analytics', {
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
        }),
      });

      if (!response.ok) {
        throw new Error('Analytics generation failed');
      }

      const analytics = await response.json();
      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Analytics error:', error);
      alert('Failed to generate analytics. Please try again.');
      setShowAnalytics(false);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-[#29241f] via-[#39322c] to-[#29241f]'
        : 'bg-gradient-to-br from-[#f5f1e8] via-[#fbf9f4] to-[#f0ebe0]'
    }`}>
      <Header showDashboardButton={false} currentPage="dashboard" />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-6">
          <SearchForm
            query={query}
            setQuery={setQuery}
            timeframe={timeframe}
            setTimeframe={setTimeframe}
            selectedPlatforms={selectedPlatforms}
            setSelectedPlatforms={setSelectedPlatforms}
            onSearch={() => handleSearch()}
            loading={loading}
          />

          <SearchResults
            results={results}
            totalResults={totalResults}
            selectedPlatforms={selectedPlatforms}
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            endIndex={endIndex}
            currentResults={currentResults}
            expandedPosts={expandedPosts}
            onToggleExpand={toggleExpandPost}
            onPageChange={handlePageChange}
            onToggleChat={() => setChatOpen(!chatOpen)}
            onAnalyzeOpportunity={handleAnalyzeOpportunity}
            onViewAnalytics={handleViewAnalytics}
            searchQuery={query}
          />

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

      <ChatPanel
        searchResults={results}
        searchQuery={query}
        isOpen={chatOpen}
        onToggle={() => setChatOpen(!chatOpen)}
      />

      {(opportunityReport || analyzingOpportunity) && (
        <OpportunityReport
          report={opportunityReport}
          loading={analyzingOpportunity}
          onClose={() => setOpportunityReport(null)}
        />
      )}

      {(analyticsData || loadingAnalytics) && (
        <AnalyticsDashboard
          analytics={analyticsData}
          loading={loadingAnalytics}
          onClose={() => {
            setAnalyticsData(null);
            setShowAnalytics(false);
          }}
        />
      )}

      <Footer />
    </div>
  );
}
