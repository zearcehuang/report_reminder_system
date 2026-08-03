import React from 'react';

interface SkeletonLoaderProps {
  type: 'card' | 'table-row' | 'text';
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, count = 1 }) => {
  const renderCardSkeleton = () => (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-sm animate-pulse h-48 w-full flex flex-col justify-between">
      <div className="space-y-3">
        <div className="h-6 bg-white/20 rounded-md w-3/4"></div>
        <div className="h-4 bg-white/10 rounded-md w-1/2"></div>
      </div>
      <div className="flex justify-between items-center mt-4">
        <div className="h-4 bg-white/10 rounded-md w-1/4"></div>
        <div className="h-8 bg-white/20 rounded-lg w-1/3"></div>
      </div>
    </div>
  );

  const renderTableRowSkeleton = () => (
    <div className="flex items-center space-x-4 py-4 border-b border-white/5 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-1/4"></div>
      <div className="h-4 bg-white/10 rounded w-1/4"></div>
      <div className="h-4 bg-white/10 rounded w-1/3"></div>
      <div className="h-6 bg-white/20 rounded-full w-16 ml-auto"></div>
    </div>
  );

  const renderTextSkeleton = () => (
    <div className="h-4 bg-white/10 rounded w-full animate-pulse my-2"></div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return renderCardSkeleton();
      case 'table-row':
        return renderTableRowSkeleton();
      case 'text':
      default:
        return renderTextSkeleton();
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <React.Fragment key={i}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </>
  );
};

export default SkeletonLoader;
