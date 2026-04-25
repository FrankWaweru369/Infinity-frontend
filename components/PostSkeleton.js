export default function PostSkeleton() {
  return (
    <div className="animate-pulse p-4 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
      </div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-full"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
      <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded mt-3"></div>
    </div>
  );
}
