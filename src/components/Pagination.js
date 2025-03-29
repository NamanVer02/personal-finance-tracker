import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems
}) => {
  // Generate page buttons with ellipsis logic
  const generatePageButtons = () => {
    // If total pages is 6 or less, show all pages
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Complex logic for pagination with ellipsis
    const pages = [];
    
    // Always show first page
    pages.push(1);

    // Determine the range of pages to show
    let startPage, endPage;
    if (currentPage <= 3) {
      // If current page is in the first 3 pages
      startPage = 2;
      endPage = 4;
      pages.push('start-ellipsis');
    } else if (currentPage >= totalPages - 2) {
      // If current page is in the last 3 pages
      startPage = totalPages - 3;
      endPage = totalPages - 1;
      pages.push('start-ellipsis');
    } else {
      // Current page is in the middle
      startPage = currentPage - 1;
      endPage = currentPage + 1;
      pages.push('start-ellipsis');
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      if (i > 1 && i < totalPages) {
        pages.push(i);
      }
    }

    // Add end ellipsis if needed
    if (currentPage < totalPages - 2) {
      pages.push('end-ellipsis');
    }

    // Always show last page
    pages.push(totalPages);

    return pages;
  };

  // Render page buttons
  const renderPageButtons = () => {
    const pages = generatePageButtons();

    return pages.map((page, index) => {
      if (page === 'start-ellipsis' || page === 'end-ellipsis') {
        return (
          <div 
            key={`ellipsis-${index}`} 
            className="flex items-center justify-center w-10 h-10 text-gray-500"
          >
            <MoreHorizontal size={20} />
          </div>
        );
      }

      return (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`
            px-3 py-1 text-sm rounded-lg transition-all duration-200
            ${currentPage === page 
              ? 'bg-primary text-primary-foreground shadow-neumorphic-inset-button' 
              : 'bg-gray-100 shadow-neumorphic-button hover:bg-gray-200'}
          `}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div className="flex items-center justify-between mt-4">
      {/* Items showing information */}
      <div className="text-sm text-gray-600">
        Showing{" "}
        {totalItems > 0
          ? (currentPage - 1) * itemsPerPage + 1
          : 0}{" "}
        to{" "}
        {Math.min(
          currentPage * itemsPerPage,
          totalItems
        )}{" "}
        of {totalItems} entries
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="
            px-3 py-1 text-sm rounded-lg bg-gray-100 
            shadow-neumorphic-button 
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center
          "
        >
          <ChevronLeft size={20} />
        </button>

        {/* Page buttons */}
        <div className="flex items-center gap-1">
          {renderPageButtons()}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="
            px-3 py-1 text-sm rounded-lg bg-gray-100 
            shadow-neumorphic-button 
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center
          "
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;