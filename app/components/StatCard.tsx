interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  theme: string;
}

const StatCard = ({ title, value, icon, theme }: StatCardProps) => {
  return (
    <div
      className={`p-6 rounded-xl border ${
        theme === 'dark'
          ? 'bg-[#1f1a17] border-[#4a3824]'
          : 'bg-white border-[#e8dcc8]'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className={`text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'
            }`}
          >
            {title}
          </p>
          <p
            className={`text-3xl font-bold ${
              theme === 'dark' ? 'text-amber-200' : 'text-gray-900'
            }`}
          >
            {value}
          </p>
        </div>
        <div className={theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default StatCard;