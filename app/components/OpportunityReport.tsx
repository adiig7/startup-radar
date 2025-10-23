'use client';

import { useTheme } from '../providers/ThemeProvider';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { OpportunityReport } from '@/lib/ai/opportunity-analyzer';

interface OpportunityReportProps {
  report: OpportunityReport | null;
  loading: boolean;
  onClose: () => void;
}

export default function OpportunityReport({ report, loading, onClose }: OpportunityReportProps) {
  const { theme } = useTheme();

  if (!report && !loading) return null;

  const getScoreColor = (score: number) => {
    if (score >= 70) return theme === 'dark' ? 'text-green-400' : 'text-green-600';
    if (score >= 40) return theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600';
    return theme === 'dark' ? 'text-red-400' : 'text-red-600';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${
          theme === 'dark'
            ? 'bg-[#1f1a17] border border-[#4a3824]'
            : 'bg-white border border-[#e8dcc8]'
        }`}
      >
        <div
          className={`sticky top-0 z-10 p-6 border-b flex items-center justify-between ${
            theme === 'dark'
              ? 'bg-[#1f1a17] border-[#4a3824]'
              : 'bg-white border-[#e8dcc8]'
          }`}
        >
          <div className="flex items-center gap-3">
            <SparklesIcon
              className={`w-6 h-6 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}
            />
            <h2
              className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-amber-200' : 'text-gray-900'
              }`}
            >
              Opportunity Analysis Report
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close opportunity report"
            onClick={onClose}
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
                  theme === 'dark' ? 'border-amber-600' : 'border-amber-700'
                }`}
              ></div>
              <p className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}>
                Analyzing opportunity with AI...
              </p>
            </div>
          )}

          {report && (
            <>
              <div
                className={`p-6 rounded-xl ${
                  theme === 'dark' ? 'bg-[#3d2f1f]' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className={`text-xl font-semibold ${
                      theme === 'dark' ? 'text-amber-200' : 'text-gray-900'
                    }`}
                  >
                    Overall Opportunity Score
                  </h3>
                  <span
                    className={`text-4xl font-bold ${getScoreColor(report.overallScore)}`}
                  >
                    {report.overallScore}/100
                  </span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${getScoreBarColor(report.overallScore)}`}
                    style={{ width: `${report.overallScore}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ScoreCard
                  title="Problem Validation"
                  score={report.problemValidation.score}
                  theme={theme}
                >
                  <div className="space-y-2">
                    <p className={theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'}>
                      Found in {report.problemValidation.frequency} posts
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {report.problemValidation.mainProblems.map((problem, idx) => (
                        <li
                          key={idx}
                          className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}
                        >
                          {problem}
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScoreCard>

                <ScoreCard title="Urgency Level" score={report.urgencyScore.score} theme={theme}>
                  <ul className="list-disc list-inside space-y-1">
                    {report.urgencyScore.signals.map((signal, idx) => (
                      <li
                        key={idx}
                        className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}
                      >
                        {signal}
                      </li>
                    ))}
                  </ul>
                </ScoreCard>

                <ScoreCard
                  title="Willingness to Pay"
                  score={report.willingnessToPayScore.score}
                  theme={theme}
                >
                  <ul className="list-disc list-inside space-y-1">
                    {report.willingnessToPayScore.paymentSignals.map((signal, idx) => (
                      <li
                        key={idx}
                        className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}
                      >
                        {signal}
                      </li>
                    ))}
                  </ul>
                </ScoreCard>

                <div
                  className={`p-4 rounded-lg ${
                    theme === 'dark'
                      ? 'bg-[#3d2f1f] border border-[#6b5943]'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <h4
                    className={`font-semibold mb-2 ${
                      theme === 'dark' ? 'text-amber-300' : 'text-gray-900'
                    }`}
                  >
                    Market Size: {report.marketSize.size}
                  </h4>
                  <p
                    className={`text-sm mb-2 ${
                      theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'
                    }`}
                  >
                    {report.marketSize.estimatedUsers}
                  </p>
                  <p className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}>
                    {report.marketSize.reasoning}
                  </p>
                </div>
              </div>

              <div
                className={`p-4 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-[#3d2f1f] border border-[#6b5943]'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <h4
                  className={`font-semibold mb-3 ${
                    theme === 'dark' ? 'text-amber-300' : 'text-gray-900'
                  }`}
                >
                  Early Adopters
                </h4>
                <div className="space-y-3">
                  {report.earlyAdopters.profiles.slice(0, 3).map((adopter, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded border ${
                        theme === 'dark'
                          ? 'bg-[#2a221c] border-[#4a3824]'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`font-medium ${
                            theme === 'dark' ? 'text-amber-200' : 'text-gray-900'
                          }`}
                        >
                          {adopter.author}
                        </span>
                        <span
                          className={`text-sm ${
                            theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'
                          }`}
                        >
                          {adopter.platform} • {adopter.engagement} engagement
                        </span>
                      </div>
                      <p
                        className={`text-sm italic ${
                          theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'
                        }`}
                      >
                        "{adopter.quote}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={`p-4 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-[#3d2f1f] border border-[#6b5943]'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <h4
                  className={`font-semibold mb-3 ${
                    theme === 'dark' ? 'text-amber-300' : 'text-gray-900'
                  }`}
                >
                  Competitor Analysis
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p
                      className={`text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'
                      }`}
                    >
                      Existing Solutions:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {report.competitorGaps.existingSolutions.map((solution, idx) => (
                        <li
                          key={idx}
                          className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}
                        >
                          {solution}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'
                      }`}
                    >
                      Market Gaps:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {report.competitorGaps.gaps.map((gap, idx) => (
                        <li
                          key={idx}
                          className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}
                        >
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-amber-900 bg-opacity-20 border border-amber-800'
                    : 'bg-amber-50 border border-amber-200'
                }`}
              >
                <h4
                  className={`font-semibold mb-2 ${
                    theme === 'dark' ? 'text-amber-300' : 'text-amber-900'
                  }`}
                >
                  Recommendation
                </h4>
                <p className={theme === 'dark' ? 'text-amber-100' : 'text-amber-900'}>
                  {report.recommendation}
                </p>
              </div>

              <div
                className={`p-4 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-[#3d2f1f] border border-[#6b5943]'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <h4
                  className={`font-semibold mb-3 ${
                    theme === 'dark' ? 'text-amber-300' : 'text-gray-900'
                  }`}
                >
                  Key Insights
                </h4>
                <ul className="space-y-2">
                  {report.keyInsights.map((insight, idx) => (
                    <li
                      key={idx}
                      className={`flex items-start gap-2 ${
                        theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'
                      }`}
                    >
                      <span className={theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}>
                        •
                      </span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({
  title,
  score,
  theme,
  children,
}: {
  title: string;
  score: number;
  theme: string;
  children: React.ReactNode;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return theme === 'dark' ? 'text-green-400' : 'text-green-600';
    if (score >= 40) return theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600';
    return theme === 'dark' ? 'text-red-400' : 'text-red-600';
  };

  return (
    <div
      className={`p-4 rounded-lg ${
        theme === 'dark'
          ? 'bg-[#3d2f1f] border border-[#6b5943]'
          : 'bg-gray-50 border border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className={`font-semibold ${theme === 'dark' ? 'text-amber-300' : 'text-gray-900'}`}>
          {title}
        </h4>
        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
      </div>
      {children}
    </div>
  );
}
