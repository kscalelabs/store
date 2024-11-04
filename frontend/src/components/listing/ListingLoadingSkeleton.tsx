const ListingLoadingSkeleton = () => {
  return (
    <div className="flex flex-col lg:flex-row items-start justify-between max-w-7xl mx-auto py-12 gap-12 mb-24">
      {/* Left side - Image section */}
      <div className="w-full lg:w-1/2 relative flex gap-4">
        <div className="flex flex-col items-center">
          {/* Vote button skeletons */}
          <div className="w-10 h-10 bg-gray-200 rounded-md mb-2 animate-pulse" />
          <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse" />
        </div>

        {/* Main image skeleton */}
        <div className="flex-1 aspect-square bg-gray-200 rounded-lg animate-pulse" />
      </div>

      {/* Right side - Content section */}
      <div className="w-full lg:w-1/2">
        {/* Title skeleton */}
        <div className="py-4 md:py-8">
          <div className="h-8 bg-gray-200 rounded-full w-3/4 mb-4 animate-pulse" />
        </div>

        <div className="h-[1px] bg-gray-200 w-full mb-4" />

        {/* Creator info skeleton */}
        <div className="py-4 md:py-8">
          <div className="h-6 bg-gray-200 rounded-full w-1/2 mb-2 animate-pulse" />
          <div className="flex gap-4 mt-2">
            <div className="h-4 bg-gray-200 rounded-full w-24 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded-full w-32 animate-pulse" />
          </div>
        </div>

        <div className="h-[1px] bg-gray-200 w-full mb-4" />

        {/* Description skeleton */}
        <div className="py-8 space-y-4">
          <div className="h-4 bg-gray-200 rounded-full w-full animate-pulse" />
          <div className="h-4 bg-gray-200 rounded-full w-5/6 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded-full w-4/6 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded-full w-5/6 animate-pulse" />
        </div>

        {/* Price and checkout button skeleton */}
        <div className="mt-8 flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded-full w-32 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded-full w-40 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default ListingLoadingSkeleton;
