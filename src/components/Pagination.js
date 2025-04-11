import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const Pagination = ({
  currentPage,  // Zero-indexed (0 = first page)
  totalPages,
  onPageChange,
  itemsPerPage,
  setItemsPerPage,
  totalItems
}) => {
  // Common page size options
  const pageSizeOptions = [10, 25, 50, 100];

  // Generate page buttons with ellipsis logic
  const generatePageButtons = () => {
    // If total pages is 6 or less, show all pages
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    // Complex logic for pagination with ellipsis
    const pages = [];
    
    // Always show first page (page 0)
    pages.push(0);

    // Determine the range of pages to show
    let startPage, endPage;
    if (currentPage <= 2) {
      // If current page is in the first 3 pages
      startPage = 1;
      endPage = 3;
      pages.push('start-ellipsis');
    } else if (currentPage >= totalPages - 3) {
      // If current page is in the last 3 pages
      startPage = totalPages - 4;
      endPage = totalPages - 2;
      pages.push('start-ellipsis');
    } else {
      // Current page is in the middle
      startPage = currentPage - 1;
      endPage = currentPage + 1;
      pages.push('start-ellipsis');
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      if (i > 0 && i < totalPages - 1) {
        pages.push(i);
      }
    }

    // Add end ellipsis if needed
    if (currentPage < totalPages - 3) {
      pages.push('end-ellipsis');
    }

    // Always show last page
    pages.push(totalPages - 1);

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

      // For display purposes, show page + 1 (so page 0 shows as "1")
      const displayPage = page + 1;

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
          {displayPage}
        </button>
      );
    });
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    
    // Adjust current page if necessary to avoid showing empty pages
    const newMaxPage = Math.ceil(totalItems / newItemsPerPage) - 1;
    if (currentPage > newMaxPage) {
      onPageChange(newMaxPage >= 0 ? newMaxPage : 0);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4">
      {/* Items showing information and items per page selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="text-sm text-gray-600">
          Showing{" "}
          {totalItems > 0
            ? (currentPage) * itemsPerPage + 1
            : 0}{" "}
          to{" "}
          {Math.min(
            (currentPage + 1) * itemsPerPage,
            totalItems
          )}{" "}
          of {totalItems} entries
        </div>
        
        {/* Items per page dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-600">
            Show
          </label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="rounded-lg bg-gray-100 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none p-2 text-sm"
          >
            {pageSizeOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">per page</span>
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
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
          onClick={() => {onPageChange(currentPage + 1);}}
          disabled={currentPage === totalPages - 1}
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