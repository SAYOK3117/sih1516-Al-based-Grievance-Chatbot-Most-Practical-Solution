import { useMemo } from 'react';
import type { Grievance } from '../../../lib/store';
import { getSLAStatus } from '../../../lib/slaUtils';
import { useNavigate } from 'react-router-dom';

export function StateAnalytics({ grievances }: { grievances: Grievance[] }) {
  const navigate = useNavigate();

  const stateStats = useMemo(() => {
    const stats: Record<string, { state: string, total: number, active: number, resolved: number, overdue: number, critical: number }> = {};
    
    grievances.forEach(g => {
      if (!g.state) return;
      if (!stats[g.state]) {
        stats[g.state] = { state: g.state, total: 0, active: 0, resolved: 0, overdue: 0, critical: 0 };
      }
      
      stats[g.state].total++;
      if (g.status === 'Resolved') {
        stats[g.state].resolved++;
      } else {
        stats[g.state].active++;
        if (getSLAStatus(g) === 'Overdue') stats[g.state].overdue++;
        if (g.priority === 'Critical') stats[g.state].critical++;
      }
    });

    return Object.values(stats);
  }, [grievances]);

  // Top states by volume
  const topVolumeStates = useMemo(() => {
    return [...stateStats].sort((a, b) => b.total - a.total).slice(0, 5);
  }, [stateStats]);

  // Top states by overdue %
  const topOverdueStates = useMemo(() => {
    return [...stateStats]
      .filter(s => s.total > 0)
      .sort((a, b) => (b.overdue / b.total) - (a.overdue / a.total))
      .slice(0, 5);
  }, [stateStats]);

  const handleStateClick = () => {
    // Navigate to map (assuming map might read URL params later, or just simple navigation)
    navigate(`/super-admin/map`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <h3 className="font-bold text-gray-900 dark:text-white">State-wise Grievance Distribution</h3>
          <p className="text-xs text-gray-500 mt-1">States with highest grievance volume</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium">
              <tr>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Active</th>
                <th className="px-4 py-3 text-right">Resolved</th>
                <th className="px-4 py-3 text-right">Resolution Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {topVolumeStates.map(s => (
                <tr key={s.state} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-purple-600 dark:text-purple-400 cursor-pointer hover:underline" onClick={() => handleStateClick()}>
                    {s.state}
                  </td>
                  <td className="px-4 py-3 text-right">{s.total}</td>
                  <td className="px-4 py-3 text-right text-orange-600 dark:text-orange-400">{s.active}</td>
                  <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">{s.resolved}</td>
                  <td className="px-4 py-3 text-right">
                    {((s.resolved / s.total) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
              {topVolumeStates.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-red-50/50 dark:bg-red-900/10">
          <h3 className="font-bold text-red-900 dark:text-red-400">States Requiring Attention</h3>
          <p className="text-xs text-red-700/70 dark:text-red-400/70 mt-1">States with highest overdue percentage</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium">
              <tr>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3 text-right">Overdue</th>
                <th className="px-4 py-3 text-right">Critical</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Overdue %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {topOverdueStates.map(s => (
                <tr key={s.state} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-purple-600 dark:text-purple-400 cursor-pointer hover:underline" onClick={() => handleStateClick()}>
                    {s.state}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">{s.overdue}</td>
                  <td className="px-4 py-3 text-right text-orange-600 dark:text-orange-400">{s.critical}</td>
                  <td className="px-4 py-3 text-right">{s.total}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {((s.overdue / s.total) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
              {topOverdueStates.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
