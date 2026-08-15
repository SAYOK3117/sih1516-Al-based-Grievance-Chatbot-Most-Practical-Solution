import { useMemo } from 'react';
import type { Grievance } from '../../../lib/store';
import { AlertTriangle } from 'lucide-react';

export function DepartmentAnalytics({ grievances }: { grievances: Grievance[] }) {
  const deptStats = useMemo(() => {
    const stats: Record<string, { dept: string, total: number, resolved: number, pending: number, overdue: number }> = {};
    
    grievances.forEach(g => {
      if (!g.dept) return;
      if (!stats[g.dept]) {
        stats[g.dept] = { dept: g.dept, total: 0, resolved: 0, pending: 0, overdue: 0 };
      }
      
      stats[g.dept].total++;
      if (g.status === 'Resolved') {
        stats[g.dept].resolved++;
      } else {
        stats[g.dept].pending++;
        const isOverdue = g.dueAt ? new Date(g.dueAt) < new Date() : g.sla.toLowerCase().includes('overdue');
        if (isOverdue) stats[g.dept].overdue++;
      }
    });

    return Object.values(stats)
      .sort((a, b) => {
        // Sort by operational relevance: highest overdue first, then highest pending
        if (b.overdue !== a.overdue) return b.overdue - a.overdue;
        return b.pending - a.pending;
      })
      .slice(0, 10); // top 10
  }, [grievances]);

  return (
    <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden h-full">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Department Performance</h3>
          <p className="text-xs text-gray-500 mt-1">Sorted by operational relevance</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium">
            <tr>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Resolved</th>
              <th className="px-4 py-3 text-right">Pending</th>
              <th className="px-4 py-3 text-right">Overdue</th>
              <th className="px-4 py-3 text-right">Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {deptStats.map(d => (
              <tr key={d.dept} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  {d.overdue > 0 && <AlertTriangle size={14} className="text-red-500" />}
                  {d.dept}
                </td>
                <td className="px-4 py-3 text-right">{d.total}</td>
                <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">{d.resolved}</td>
                <td className="px-4 py-3 text-right text-purple-600 dark:text-purple-400">{d.pending}</td>
                <td className="px-4 py-3 text-right font-bold">
                  <span className={d.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}>
                    {d.overdue}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {((d.resolved / d.total) * 100).toFixed(0)}%
                </td>
              </tr>
            ))}
            {deptStats.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No data available</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
