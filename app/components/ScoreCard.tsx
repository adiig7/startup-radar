const ScoreCard = ({
  title,
  score,
  theme,
  children,
}: {
  title: string;
  score: number;
  theme: string;
  children: React.ReactNode;
}) => {
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
      <div className="max-h-96 overflow-y-auto pr-2">
        {children}
      </div>
    </div>
  );
}

export default ScoreCard;