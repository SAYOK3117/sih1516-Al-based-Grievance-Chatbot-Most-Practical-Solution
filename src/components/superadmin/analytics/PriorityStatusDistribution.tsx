import { useMemo } from 'react';
import type { Grievance } from '../../../lib/store';
import { getSLAStatus } from '../../../lib/slaUtils';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

const PRIORITY_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#3b82f6',
  Low: '#9ca3af',
};

export function PriorityStatusDistribution({ grievances }: { grievances: Grievance[] }) {
  const { priorityData, statusData, slaData, totalGrievances } = useMemo(() => {
    const priority = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    const status = { Pending: 0, 'In Progress': 0, Resolved: 0 };
    const sla = { 'On Time': 0, 'At Risk': 0, Overdue: 0 };
    
    grievances.forEach(g => {
      // Priority
      if (g.priority === 'Critical') priority.Critical++;
      else if (g.priority === 'High') priority.High++;
      else if (g.priority === 'Medium') priority.Medium++;
      else priority.Low++;

      // Status
      if (g.status === 'Resolved') status.Resolved++;
      else if (g.status === 'In Progress') status['In Progress']++;
      else status.Pending++;

      // SLA
      if (g.status === 'Resolved') {
        sla['On Time']++;
      } else {
        const stat = getSLAStatus(g);
        if (stat === 'On Time') sla['On Time']++;
        else if (stat === 'At Risk') sla['At Risk']++;
        else if (stat === 'Overdue') sla.Overdue++;
      }
    });

    const pData = [
      { name: 'Critical', value: priority.Critical, color: PRIORITY_COLORS.Critical },
      { name: 'High', value: priority.High, color: PRIORITY_COLORS.High },
      { name: 'Medium', value: priority.Medium, color: PRIORITY_COLORS.Medium },
      { name: 'Low', value: priority.Low, color: PRIORITY_COLORS.Low },
    ];

    const sData = [
      { name: 'Pending', count: status.Pending, fill: '#eab308' },
      { name: 'In Progress', count: status['In Progress'], fill: '#a855f7' },
      { name: 'Resolved', count: status.Resolved, fill: '#10b981' },
      { name: 'Overdue SLA', count: sla.Overdue, fill: '#ef4444' },
    ];

    return {
      priorityData: pData,
      statusData: sData,
      slaData: sla,
      totalGrievances: grievances.length
    };
  }, [grievances]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Priority Severity Donut Chart */}
      <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              Priority & Severity Breakdown
            </h3>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {totalGrievances} total
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            AI-classified severity distribution of all nationwide complaints
          </p>
        </div>

        <div className="h-[220px] w-full flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0F1620', 
                  borderColor: '#1F2937', 
                  borderRadius: '8px', 
                  color: '#fff',
                  fontSize: '12px' 
                }}
              />
              <Pie
                data={priorityData}
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-gray-900 dark:text-white">{totalGrievances}</span>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Reports</span>
          </div>
        </div>

        {/* Legend stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs">
          {priorityData.map((item) => (
            <div key={item.name} className="flex flex-col items-center text-center p-1.5 rounded-lg bg-gray-50/60 dark:bg-gray-900/30">
              <div className="flex items-center gap-1.5 font-semibold text-gray-800 dark:text-gray-200">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
              </div>
              <span className="text-xs font-bold mt-0.5 text-gray-900 dark:text-white">
                {item.value} ({((item.value / (totalGrievances || 1)) * 100).toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status & SLA Grouped Bar Chart */}
      <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-green-500" />
              Operational Status & SLA Health
            </h3>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              {slaData['On Time']} On Time
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Live grievance resolution pipeline and SLA risk counts
          </p>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.15} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
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
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {statusData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* SLA Breakdown Footnote */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs">
          <div className="text-center p-1.5 rounded-lg bg-green-50/60 dark:bg-green-950/20 text-green-700 dark:text-green-300">
            <span className="font-bold">{slaData['On Time']}</span> On Time
          </div>
          <div className="text-center p-1.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300">
            <span className="font-bold">{slaData['At Risk']}</span> At Risk
          </div>
          <div className="text-center p-1.5 rounded-lg bg-red-50/60 dark:bg-red-950/20 text-red-700 dark:text-red-300">
            <span className="font-bold">{slaData.Overdue}</span> SLA Breached
          </div>
        </div>

      </div>

    </div>
  );
}
