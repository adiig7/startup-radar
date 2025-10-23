'use client';

import { useRouter } from 'next/navigation';
import { SparklesIcon, SunIcon, MoonIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../providers/ThemeProvider';

interface HeaderProps {
  showDashboardButton?: boolean;
  currentPage?: 'home' | 'dashboard' | 'validate';
}

export default function Header({ showDashboardButton = false, currentPage = 'home' }: HeaderProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className={`border-b sticky top-0 z-50 backdrop-blur-sm ${
      theme === 'dark'
        ? 'border-[#3d2f1f] bg-[#29241fcc]'
        : 'border-[#e8dcc8] bg-[#fbf9f4cc]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-amber-700' : 'bg-amber-800'}`}>
              <MagnifyingGlassIcon className="w-5 h-5 text-white" />
            </div>
            <span className={`text-lg sm:text-2xl font-bold ${theme === 'dark' ? 'text-amber-100' : 'text-gray-900'}`}>
              StartupRadar
            </span>
          </button>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {currentPage !== 'dashboard' && (
              <button
                onClick={() => router.push('/dashboard')}
                className={`px-3 py-2 sm:px-4 rounded-lg transition-colors font-medium text-xs sm:text-sm ${
                  theme === 'dark'
                    ? 'bg-amber-700 text-white hover:bg-amber-600'
                    : 'bg-amber-800 text-white hover:bg-amber-900'
                }`}
              >
                Discover Problems
              </button>
            )}

            {currentPage !== 'validate' && (
              <button
                onClick={() => router.push('/validate')}
                className={`px-3 py-2 sm:px-4 rounded-lg transition-colors font-medium text-xs sm:text-sm ${
                  theme === 'dark'
                    ? 'bg-amber-700 text-white hover:bg-amber-600'
                    : 'bg-amber-800 text-white hover:bg-amber-900'
                }`}
              >
                Validate Ideas
              </button>
            )}

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
                <SunIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <MoonIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
