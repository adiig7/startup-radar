'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../providers/ThemeProvider';

interface EmptyStateProps {
  searchQuery: string;
}

const NoResultsFound = ({ searchQuery }: EmptyStateProps) => {
  const { theme } = useTheme();

  return (
    <div id="search-results" className="mt-3 sm:mt-6">
      <div className={`backdrop-blur-sm rounded-lg border p-8 sm:p-12 text-center ${
        theme === 'dark'
          ? 'bg-[#1f1a1733] border-[#4a3824]'
          : 'bg-[#ffffff99] border-[#e8dcc8]'
      }`}>
        <ExclamationTriangleIcon className={`w-16 h-16 mx-auto mb-4 ${
          theme === 'dark' ? 'text-amber-500' : 'text-amber-600'
        }`} />
        <h3 className={`text-xl sm:text-2xl font-bold mb-3 ${
          theme === 'dark' ? 'text-amber-100' : 'text-gray-900'
        }`}>
          No Results Found
        </h3>
        <p className={`text-base sm:text-lg mb-4 ${
          theme === 'dark' ? 'text-[#e8dcc8]' : 'text-gray-700'
        }`}>
          We couldn't find any discussions matching your search.
        </p>
        <div className={`text-sm sm:text-base ${
          theme === 'dark' ? 'text-[#d4c5ae]' : 'text-gray-600'
        }`}>
          <p className="mb-2">Try:</p>
          <ul className="space-y-1">
            <li>• Using different or more general keywords</li>
            <li>• Expanding your time range</li>
            <li>• Selecting additional platforms</li>
            <li>• Checking your spelling</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NoResultsFound;
