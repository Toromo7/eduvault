import React from 'react';

/**
 * A reusable wrapper for handling TanStack Query states consistently.
 */
export function QueryStateProvider({ 
  query, 
  children, 
  loadingComponent, 
  errorComponent, 
  emptyComponent,
  renderData 
}) {
  const { data, isLoading, isError, error } = query;

  if (isLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return errorComponent || (
      <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100">
        <p className="text-red-600 font-medium">Failed to load data</p>
        <p className="text-red-400 text-sm mt-1">{error?.message || 'Please try again later'}</p>
      </div>
    );
  }

  const items = data?.items || data;
  const isEmpty = !items || (Array.isArray(items) && items.length === 0);

  if (isEmpty) {
    return emptyComponent || (
      <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
        No items found
      </div>
    );
  }

  if (renderData) {
    return renderData(items);
  }

  return children;
}
