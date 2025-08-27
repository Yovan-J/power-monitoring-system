// frontend/src/components/Pagination.tsx
import { useState, useEffect } from 'react';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const [jumpToPage, setJumpToPage] = useState(String(currentPage));

  useEffect(() => {
    setJumpToPage(String(currentPage));
  }, [currentPage]);

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpToPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJumpToPage(e.target.value);
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-md disabled:opacity-50"
      >
        Previous
      </button>

      <form onSubmit={handleJump} className="flex items-center gap-2">
        <span className="text-sm">Page</span>
        <input 
          type="number"
          value={jumpToPage}
          onChange={handleInputChange}
          onBlur={() => handleJump({ preventDefault: () => {} } as React.FormEvent)} // Trigger jump when input loses focus
          className="w-16 p-1 text-center bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md"
        />
        <span className="text-sm">of {totalPages}</span>
      </form>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-md disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}