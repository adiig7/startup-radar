'use client';

import { useTheme } from '../providers/ThemeProvider';
import { ChartBarIcon, ClockIcon, ChatBubbleLeftIcon, FireIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { AnalyticsData } from '@/lib/elasticsearch/analytics';
import StatCard from './StatCard';

interface AnalyticsDashboardProps {
  analytics: AnalyticsData | null;
  loading: boolean;
  onClose: () => void;
}

const AnalyticsDashboard = ({ analytics, loading, onClose }: AnalyticsDashboardProps) => {
  const { theme } = useTheme();

  if (!analytics && !loading) return null;

  const maxTrendCount = analytics ? Math.max(...analytics.trendOverTime.buckets.map(b => b.count), 1) : 1;
  const maxHeatmapCount = analytics ? Math.max(...analytics.timeOfDayHeatmap.buckets.map(b => b.count), 1) : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className={`w-full max-w-7xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${
          theme === 'dark'
            ? 'bg-[#1f1a17] border border-[#4a3824]'
            : 'bg-white border border-[#e8dcc8]'
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 z-10 p-6 border-b flex items-center justify-between ${
            theme === 'dark'
              ? 'bg-[#1f1a17] border-[#4a3824]'
              : 'bg-white border-[#e8dcc8]'
          }`}
        >
          <div className="flex items-center gap-3">
            <ChartBarIcon
              className={`w-6 h-6 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}
            />
            <h2
              className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-purple-200' : 'text-gray-900'
              }`}
            >
              Analytics Dashboard
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close analytics dashboard"
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-[#3d2f1f] text-[#d4c5ae]'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div
                className={`animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mb-4 ${
                  theme === 'dark' ? 'border-purple-600' : 'border-purple-700'
                }`}
              ></div>
              <p className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}>
                Generating analytics...
              </p>
            </div>
          )}

          {analytics && (
            <>
              {/* Engagement Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  title="Avg Upvotes"
                  value={analytics.engagementStats.avgScore.toFixed(1)}
                  icon={<FireIcon className="w-6 h-6" />}
                  theme={theme}
                />
                <StatCard
                  title="Avg Comments"
                  value={analytics.engagementStats.avgComments.toFixed(1)}
                  icon={<ChatBubbleLeftIcon className="w-6 h-6" />}
                  theme={theme}
                />
                <StatCard
                  title="Total Engagement"
                  value={analytics.engagementStats.totalEngagement.toFixed(1)}
                  icon={<ChartBarIcon className="w-6 h-6" />}
                  theme={theme}
                />
              </div>

              {/* Main Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Over Time */}
        <div
          className={`p-6 rounded-xl border ${
            theme === 'dark'
              ? 'bg-[#1f1a17] border-[#4a3824]'
              : 'bg-white border-[#e8dcc8]'
          }`}
        >
          <div className="mb-4">
            <h3
              className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-amber-300' : 'text-gray-900'
              }`}
            >
              Discussion Trend Over Time
            </h3>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'}`}>
              Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC{new Date().getTimezoneOffset() > 0 ? '-' : '+'}
              {Math.abs(new Date().getTimezoneOffset() / 60)})
            </p>
          </div>
          <div className="space-y-2">
            {analytics.trendOverTime.buckets.length === 0 ? (
              <p className={theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'}>
                No trend data available
              </p>
            ) : (
              <div className="space-y-1">
                {analytics.trendOverTime.buckets.map((bucket, idx) => {
                  const width = (bucket.count / maxTrendCount) * 100;
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span
                        className={`text-xs min-w-[90px] ${
                          theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'
                        }`}
                      >
                        {bucket.date}
                      </span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-amber-600 h-6 rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${width}%` }}
                        >
                          <span className="text-xs text-white font-medium">
                            {bucket.count}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Platform Breakdown */}
        <div
          className={`p-6 rounded-xl border ${
            theme === 'dark'
              ? 'bg-[#1f1a17] border-[#4a3824]'
              : 'bg-white border-[#e8dcc8]'
          }`}
        >
          <h3
            className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-amber-300' : 'text-gray-900'
            }`}
          >
            Platform Breakdown
          </h3>
          <div className="space-y-3">
            {analytics.platformBreakdown.buckets.map((bucket, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-medium capitalize ${
                      theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'
                    }`}
                  >
                    {bucket.platform}
                  </span>
                  <span
                    className={`text-sm ${
                      theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'
                    }`}
                  >
                    {bucket.count} ({bucket.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${getPlatformColor(idx)}`}
                    style={{ width: `${bucket.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment Distribution */}
        <div
          className={`p-6 rounded-xl border ${
            theme === 'dark'
              ? 'bg-[#1f1a17] border-[#4a3824]'
              : 'bg-white border-[#e8dcc8]'
          }`}
        >
          <h3
            className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-amber-300' : 'text-gray-900'
            }`}
          >
            Sentiment Distribution
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Positive', value: analytics.sentimentDistribution.positive, color: 'bg-green-500' },
              { label: 'Neutral', value: analytics.sentimentDistribution.neutral, color: 'bg-gray-500' },
              { label: 'Negative', value: analytics.sentimentDistribution.negative, color: 'bg-red-500' },
            ].map((item, idx) => {
              const total =
                analytics.sentimentDistribution.positive +
                analytics.sentimentDistribution.neutral +
                analytics.sentimentDistribution.negative || 1;
              const percentage = Math.round((item.value / total) * 100);

              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'
                      }`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`text-sm ${
                        theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'
                      }`}
                    >
                      {item.value} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${item.color}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time of Day Heatmap */}
        <div
          className={`p-6 rounded-xl border ${
            theme === 'dark'
              ? 'bg-[#1f1a17] border-[#4a3824]'
              : 'bg-white border-[#e8dcc8]'
          }`}
        >
          <div className="mb-4">
            <h3
              className={`text-lg font-semibold flex items-center gap-2 ${
                theme === 'dark' ? 'text-amber-300' : 'text-gray-900'
              }`}
            >
              <ClockIcon className="w-5 h-5" />
              Peak Activity Hours
            </h3>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'}`}>
              Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC{new Date().getTimezoneOffset() > 0 ? '-' : '+'}
              {Math.abs(new Date().getTimezoneOffset() / 60)})
            </p>
          </div>
          <div className="grid grid-cols-12 gap-1">
            {analytics.timeOfDayHeatmap.buckets.map((bucket) => {
              const intensity = bucket.count / maxHeatmapCount;
              const opacity = Math.max(0.2, intensity);
              const hourLabel = bucket.hour === 0 ? '12a' : bucket.hour < 12 ? `${bucket.hour}a` : bucket.hour === 12 ? '12p' : `${bucket.hour - 12}p`;

              return (
                <div
                  key={bucket.hour}
                  className="relative group"
                  title={`${hourLabel.replace('a', ' AM').replace('p', ' PM')} - ${bucket.count} posts`}
                >
                  <div
                    className="w-full aspect-square rounded flex items-center justify-center text-xs font-medium"
                    style={{
                      backgroundColor: `rgba(251, 191, 36, ${opacity})`,
                      color: intensity > 0.5 ? '#fff' : theme === 'dark' ? '#e8dcc8' : '#1f2937',
                    }}
                  >
                    {hourLabel}
                  </div>
                  <div
                    className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 ${
                      theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'
                    }`}
                  >
                    {hourLabel.replace('a', ' AM').replace('p', ' PM')}: {bucket.count} posts
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className={theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'}>
              Less active
            </span>
            <span className={theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'}>
              More active
            </span>
          </div>
        </div>
      </div>

              {/* Top Posts by Engagement */}
              <div
                className={`p-6 rounded-xl border ${
                  theme === 'dark'
                    ? 'bg-[#1f1a17] border-[#4a3824]'
                    : 'bg-white border-[#e8dcc8]'
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    theme === 'dark' ? 'text-amber-300' : 'text-gray-900'
                  }`}
                >
                  Top Posts by Engagement
                </h3>
                <div className="space-y-3">
                  {analytics.engagementStats.topPosts.map((post, idx) => (
                    <a
                      key={idx}
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block p-4 rounded-lg border transition-all hover:border-amber-500 ${
                        theme === 'dark'
                          ? 'bg-[#2a221c] border-[#4a3824] hover:bg-[#3d2f1f]'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4
                            className={`font-medium mb-1 line-clamp-2 ${
                              theme === 'dark' ? 'text-amber-200' : 'text-gray-900'
                            }`}
                          >
                            {post.title}
                          </h4>
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-sm capitalize ${
                                theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'
                              }`}
                            >
                              {post.platform}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`text-right ${
                            theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                          }`}
                        >
                          <div className="text-2xl font-bold">{post.engagement}</div>
                          <div className="text-xs">engagement</div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const getPlatformColor = (idx: number): string => {
  const colors = [
    'bg-blue-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-yellow-500',
  ];
  return colors[idx % colors.length];
}

export default AnalyticsDashboard;