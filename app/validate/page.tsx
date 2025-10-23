'use client';

import { useState } from 'react';
import axios from 'axios';
import { useTheme } from '../providers/ThemeProvider';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { SparklesIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { ValidationReport } from '@/lib/ai/idea-validator';

export default function ValidatePage() {
  const { theme } = useTheme();
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ValidationReport | null>(null);

  const handleValidate = async () => {
    if (!idea.trim()) return;

    setLoading(true);
    setReport(null);

    try {
      const { data: validationReport } = await axios.post('/api/validate-idea', {
        idea: idea.trim()
      });

      setReport(validationReport);
    } catch (error) {
      console.error(` Validation error: ${error}`);
      alert('Failed to validate idea. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getVerdictIcon = (verdict: string) => {
    if (verdict === 'BUILD IT') return <CheckCircleIcon className="w-12 h-12 text-green-500" />;
    if (verdict === 'MAYBE') return <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500" />;
    return <XCircleIcon className="w-12 h-12 text-red-500" />;
  };

  const getVerdictColor = (verdict: string) => {
    if (verdict === 'BUILD IT') return theme === 'dark' ? 'text-green-400' : 'text-green-600';
    if (verdict === 'MAYBE') return theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600';
    return theme === 'dark' ? 'text-red-400' : 'text-red-600';
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return theme === 'dark' ? 'text-green-400' : 'text-green-600';
    if (score >= 40) return theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600';
    return theme === 'dark' ? 'text-red-400' : 'text-red-600';
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-[#29241f] via-[#39322c] to-[#29241f]'
          : 'bg-gradient-to-br from-[#f5f1e8] via-[#fbf9f4] to-[#f0ebe0]'
      }`}
    >
      <Header showDashboardButton={true} currentPage="validate" />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <SparklesIcon
                className={`w-10 h-10 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}
              />
              <h1
                className={`text-4xl font-bold ${
                  theme === 'dark' ? 'text-amber-200' : 'text-gray-900'
                }`}
              >
                Validate Your Startup Idea
              </h1>
            </div>
            <p
              className={`text-lg ${theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'}`}
            >
              Get instant validation from real social media discussions
            </p>
          </div>

          <div
            className={`backdrop-blur-sm rounded-xl border p-6 mb-6 ${
              theme === 'dark'
                ? 'bg-[#1f1a1799] border-[#4a3824]'
                : 'bg-[#ffffff99] border-[#e8dcc8]'
            }`}
          >
            <label
              className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-amber-300' : 'text-gray-700'
              }`}
            >
              Describe your startup idea
            </label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g., A Slack bot that automatically summarizes meeting notes and action items"
              rows={4}
              disabled={loading}
              className={`w-full px-4 py-3 rounded-lg border text-base transition-colors disabled:opacity-50 ${
                theme === 'dark'
                  ? 'bg-[#3d2f1f] border-[#6b5943] text-amber-100 placeholder-[#a8906e] focus:border-amber-500 focus:ring-2 focus:ring-amber-500'
                  : 'bg-white border-[#d4c5ae] text-gray-900 placeholder-gray-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400'
              }`}
            />
            <div className="flex items-center justify-between mt-4">
              <p className={`text-sm ${theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'}`}>
                {idea.length}/500 characters
              </p>
              <button
                onClick={handleValidate}
                disabled={!idea.trim() || loading}
                className={`px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 ${
                  theme === 'dark'
                    ? 'bg-amber-700 text-white hover:bg-amber-600'
                    : 'bg-amber-800 text-white hover:bg-amber-900'
                }`}
              >
                {loading ? 'Analyzing...' : 'Validate Idea'}
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div
                className={`inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mb-4 ${
                  theme === 'dark' ? 'border-amber-600' : 'border-amber-700'
                }`}
              ></div>
              <p className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}>
                Searching 1000s of discussions and analyzing with AI...
              </p>
            </div>
          )}

          {report && (
            <div className="space-y-6">
              <div
                className={`p-8 rounded-xl text-center ${
                  theme === 'dark' ? 'bg-[#1f1a17] border border-[#4a3824]' : 'bg-white border border-[#e8dcc8]'
                }`}
              >
                <div className="flex items-center justify-center mb-4">
                  {getVerdictIcon(report.verdict)}
                </div>
                <h2
                  className={`text-4xl font-bold mb-2 ${getVerdictColor(report.verdict)}`}
                >
                  {report.verdict}
                </h2>
                <p
                  className={`text-2xl font-semibold mb-4 ${getScoreColor(report.overallScore)}`}
                >
                  Score: {report.overallScore}/100
                </p>
                <p className={theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'}>
                  Based on {report.marketDemand.postsAnalyzed} relevant discussions
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ScoreCard title="Market Demand" score={report.marketDemand.score} theme={theme}>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {report.marketDemand.evidence.map((evidence, idx) => (
                      <li key={idx} className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}>
                        {evidence}
                      </li>
                    ))}
                  </ul>
                </ScoreCard>

                <ScoreCard title="Problem Severity" score={report.problemSeverity.score} theme={theme}>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {report.problemSeverity.signals.map((signal, idx) => (
                      <li key={idx} className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}>
                        {signal}
                      </li>
                    ))}
                  </ul>
                </ScoreCard>

                <ScoreCard title="Monetization Potential" score={report.monetization.score} theme={theme}>
                  <div className="space-y-2 text-sm">
                    <p className={`font-medium ${theme === 'dark' ? 'text-amber-300' : 'text-amber-700'}`}>
                      Suggested: {report.monetization.suggestedModel}
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {report.monetization.signals.map((signal, idx) => (
                        <li key={idx} className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}>
                          {signal}
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScoreCard>

                <div
                  className={`p-4 rounded-lg ${
                    theme === 'dark'
                      ? 'bg-[#3d2f1f] border border-[#6b5943]'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-amber-300' : 'text-gray-900'}`}>
                    Competition: {report.competitionLevel.level}
                  </h4>
                  <div className="space-y-2 text-sm">
                    {report.competitionLevel.existingSolutions.length > 0 && (
                      <div>
                        <p className={`font-medium ${theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'}`}>
                          Existing:
                        </p>
                        <ul className="list-disc list-inside">
                          {report.competitionLevel.existingSolutions.map((solution, idx) => (
                            <li key={idx} className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}>
                              {solution}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}>
                      <span className="font-medium">Your edge:</span> {report.competitionLevel.yourAdvantage}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`p-6 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-[#3d2f1f] border border-[#6b5943]'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <h4 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-amber-300' : 'text-gray-900'}`}>
                  Target Users
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className={`font-medium ${theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'}`}>Who:</p>
                    <p className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}>{report.targetUsers.who}</p>
                  </div>
                  <div>
                    <p className={`font-medium ${theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'}`}>Size:</p>
                    <p className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}>{report.targetUsers.size}</p>
                  </div>
                  <div>
                    <p className={`font-medium ${theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'}`}>
                      Where to find:
                    </p>
                    <ul className="list-disc list-inside">
                      {report.targetUsers.whereToFind.map((place, idx) => (
                        <li key={idx} className={theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'}>
                          {place}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div
                className={`p-6 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-red-900 bg-opacity-20 border border-red-800'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <h4 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-red-300' : 'text-red-900'}`}>
                  Risks to Consider
                </h4>
                <ul className="space-y-2">
                  {report.risks.map((risk, idx) => (
                    <li key={idx} className={`flex items-start gap-2 ${theme === 'dark' ? 'text-red-200' : 'text-red-800'}`}>
                      <span>⚠️</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className={`p-6 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-green-900 bg-opacity-20 border border-green-800'
                    : 'bg-green-50 border border-green-200'
                }`}
              >
                <h4 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-green-300' : 'text-green-900'}`}>
                  Next Steps
                </h4>
                <ol className="space-y-2 list-decimal list-inside">
                  {report.nextSteps.map((step, idx) => (
                    <li key={idx} className={theme === 'dark' ? 'text-green-200' : 'text-green-800'}>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div
                className={`p-6 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-amber-900 bg-opacity-20 border border-amber-800'
                    : 'bg-amber-50 border border-amber-200'
                }`}
              >
                <h4 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-amber-300' : 'text-amber-900'}`}>
                  Final Recommendation
                </h4>
                <p className={theme === 'dark' ? 'text-amber-100' : 'text-amber-900'}>
                  {report.recommendation}
                </p>
              </div>

              <div className="text-center">
                <button
                  onClick={() => {
                    setReport(null);
                    setIdea('');
                  }}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 ${
                    theme === 'dark'
                      ? 'bg-[#3d2f1f] text-amber-300 hover:bg-[#4a3824]'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Validate Another Idea
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
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
