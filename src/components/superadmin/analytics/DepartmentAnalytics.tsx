import { useState, useMemo } from 'react';
import type { Grievance } from '../../../lib/store';
import { AlertTriangle, BarChart3, Table as TableIcon } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

export function DepartmentAnalytics({ grievances }: { grievances: Grievance[] }) {
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');

  const deptStats = useMemo(() => {
    const stats: Record<string, { dept: string, total: number, resolved: number, pending: number, overdue: number, shortName: string }> = {};
    
    grievances.forEach(g => {
      if (!g.dept) return;
      if (!stats[g.dept]) {
        // Compute concise display name for charts
        let shortName = g.dept;
        if (g.dept.includes('UPPCL') || g.dept.includes('Electricity')) shortName = 'Electricity';
        else if (g.dept.includes('PWD') || g.dept.includes('Road')) shortName = 'PWD (Roads)';
        else if (g.dept.includes('Water') || g.dept.includes('Jal')) shortName = 'Water Works';
        else if (g.dept.includes('Cyber')) shortName = 'Cyber Cell';
        else if (g.dept.includes('Sanitation')) shortName = 'Sanitation';
        else if (g.dept.includes('Transport')) shortName = 'Transport';

        stats[g.dept] = { dept: g.dept, total: 0, resolved: 0, pending: 0, overdue: 0, shortName };
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
      .sort((a, b) => b.total - a.total);
  }, [grievances]);

  return (
    <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col justify-between">
      
      {/* Card Header with View Switcher */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Department Grievance Performance</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Complaint volume and resolution efficiency by agency</p>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('chart')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'chart'
                ? 'bg-white dark:bg-[#141C27] text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 size={13} /> Chart View
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'table'
                ? 'bg-white dark:bg-[#141C27] text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <TableIcon size={13} /> Table View
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1">
        {activeTab === 'chart' ? (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptStats.slice(0, 6)} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.15} />
                <XAxis 
                  dataKey="shortName" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9ca3af' }} 
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F1620', 
                    borderColor: '#1F2937', 
                    borderRadius: '8px', 
                    color: '#fff',
                    fontSize: '12px' 
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Bar name="Total Filed" dataKey="total" fill="#9333ea" radius={[4, 4, 0, 0]} />
                <Bar name="Resolved" dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar name="Overdue" dataKey="overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium text-xs">
                <tr>
                  <th className="px-3 py-2.5">Department</th>
                  <th className="px-3 py-2.5 text-right">Total</th>
                  <th className="px-3 py-2.5 text-right">Resolved</th>
                  <th className="px-3 py-2.5 text-right">Pending</th>
                  <th className="px-3 py-2.5 text-right">Overdue</th>
                  <th className="px-3 py-2.5 text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                {deptStats.map(d => (
                  <tr key={d.dept} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                      {d.overdue > 0 && <AlertTriangle size={13} className="text-red-500 shrink-0" />}
                      <span className="truncate max-w-[140px]">{d.dept}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold">{d.total}</td>
                    <td className="px-3 py-2.5 text-right text-green-600 dark:text-green-400 font-semibold">{d.resolved}</td>
                    <td className="px-3 py-2.5 text-right text-purple-600 dark:text-purple-400">{d.pending}</td>
                    <td className="px-3 py-2.5 text-right font-bold">
                      <span className={d.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}>
                        {d.overdue > 0 ? d.overdue : '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-gray-800 dark:text-gray-200">
                      {((d.resolved / (d.total || 1)) * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
