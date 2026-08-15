export function MapLegend() {
  return (
    <div className="absolute bottom-6 right-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg pointer-events-none">
      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Grievance Intensity</h4>
      
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-[#f3f4f6] dark:bg-[#1f2937] border border-gray-200 dark:border-gray-700"></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">None</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-[#e9d5ff] dark:bg-[#4c1d95]"></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Low</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-[#c084fc] dark:bg-[#5b21b6]"></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Medium</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-[#9333ea] dark:bg-[#6d28d9]"></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">High</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-[#6b21a8] dark:bg-[#7c3aed]"></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Critical</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-xs font-bold text-red-600 dark:text-red-400">Attention Required</span>
        </div>
      </div>
    </div>
  );
}
