'use client';

import { useTheme } from '../providers/ThemeProvider';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const { theme } = useTheme();

  if (totalPages <= 1) return null;

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={`mt-6 mb-8 p-3 sm:p-4 backdrop-blur-sm rounded-lg border ${
      theme === 'dark'
        ? 'bg-[#1f1a1733] border-[#4a3824]'
        : 'bg-[#ffffff99] border-[#e8dcc8]'
    }`}>
      <div className="flex sm:hidden flex-col items-center gap-3">
        <div className={`text-sm font-medium ${
          theme === 'dark' ? 'text-amber-200' : 'text-gray-800'
        }`}>
          Page {currentPage} of {totalPages}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded-lg border font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === 'dark'
                ? 'border-[#6b5943] bg-[#3d2f1f80] text-[#d4c5ae] hover:border-amber-500 disabled:hover:border-[#6b5943]'
                : 'border-[#d4c5ae] bg-[#ffffff80] text-gray-700 hover:border-amber-400 disabled:hover:border-[#d4c5ae]'
            }`}
          >
            Prev
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 3) {
                pageNum = i + 1;
              } else if (currentPage <= 2) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 1) {
                pageNum = totalPages - 2 + i;
              } else {
                pageNum = currentPage - 1 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-9 h-9 rounded-lg border font-medium transition-all text-sm flex items-center justify-center ${
                    currentPage === pageNum
                      ? theme === 'dark'
                        ? 'border-amber-600 bg-[#a8907033] text-amber-200'
                        : 'border-amber-700 bg-[#a890703d] text-amber-900'
                      : theme === 'dark'
                        ? 'border-[#6b5943] bg-[#3d2f1f80] text-[#d4c5ae] hover:border-amber-500'
                        : 'border-[#d4c5ae] bg-[#ffffff80] text-gray-700 hover:border-amber-400'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 rounded-lg border font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === 'dark'
                ? 'border-[#6b5943] bg-[#3d2f1f80] text-[#d4c5ae] hover:border-amber-500 disabled:hover:border-[#6b5943]'
                : 'border-[#d4c5ae] bg-[#ffffff80] text-gray-700 hover:border-amber-400 disabled:hover:border-[#d4c5ae]'
            }`}
          >
            Next
          </button>
        </div>
      </div>

      <div className="hidden sm:flex items-center justify-center gap-4">
        <div className={`text-sm font-medium ${
          theme === 'dark' ? 'text-amber-200' : 'text-gray-800'
        }`}>
          Page {currentPage} of {totalPages}
        </div>
        
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-lg border font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
            theme === 'dark'
              ? 'border-[#6b5943] bg-[#3d2f1f80] text-[#d4c5ae] hover:border-amber-500 disabled:hover:border-[#6b5943]'
              : 'border-[#d4c5ae] bg-[#ffffff80] text-gray-700 hover:border-amber-400 disabled:hover:border-[#d4c5ae]'
          }`}
        >
          Previous
        </button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-10 h-10 rounded-lg border font-medium transition-all text-sm flex items-center justify-center ${
                  currentPage === pageNum
                    ? theme === 'dark'
                      ? 'border-amber-600 bg-[#a8907033] text-amber-200'
                      : 'border-amber-700 bg-[#a890703d] text-amber-900'
                    : theme === 'dark'
                      ? 'border-[#6b5943] bg-[#3d2f1f80] text-[#d4c5ae] hover:border-amber-500'
                      : 'border-[#d4c5ae] bg-[#ffffff80] text-gray-700 hover:border-amber-400'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        
        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-lg border font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
            theme === 'dark'
              ? 'border-[#6b5943] bg-[#3d2f1f80] text-[#d4c5ae] hover:border-amber-500 disabled:hover:border-[#6b5943]'
              : 'border-[#d4c5ae] bg-[#ffffff80] text-gray-700 hover:border-amber-400 disabled:hover:border-[#d4c5ae]'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Pagination;