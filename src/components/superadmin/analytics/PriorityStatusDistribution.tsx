import { useMemo } from 'react';
import type { Grievance } from '../../../lib/store';
import { getSLAStatus } from '../../../lib/slaUtils';

export function PriorityStatusDistribution({ grievances }: { grievances: Grievance[] }) {
  const data = useMemo(() => {
    const priority = { Critical: 0, High: 0, Medium: 0, Low: 0, Total: 0 };
    const status = { Pending: 0, 'In Progress': 0, Resolved: 0, Total: 0 };
    const sla = { 'On Time': 0, 'At Risk': 0, Overdue: 0, Total: 0 };
    
    grievances.forEach(g => {
      // Priority
      if (g.priority === 'Critical') priority.Critical++;
      else if (g.priority === 'High') priority.High++;
      else if (g.priority === 'Medium') priority.Medium++;
      else priority.Low++;
      priority.Total++;

      // Status (Pending = newly filed / unassigned, In Progress = assigned & working, Resolved = done)
      if (g.status === 'Resolved') status.Resolved++;
      else if (g.status === 'In Progress') status['In Progress']++;
      else status.Pending++;
      status.Total++;

      // SLA mapping
      if (g.status === 'Resolved') {
        // Assume resolved are on time for simplicity unless we have a breach record.
        sla['On Time']++;
      } else {
        // Check SLA
        const stat = getSLAStatus(g);
        if (stat === 'On Time') sla['On Time']++;
        else if (stat === 'At Risk') sla['At Risk']++;
        else if (stat === 'Overdue') sla.Overdue++;
      }
      sla.Total++;
    });

    return { priority, status, sla };
  }, [grievances]);

  const Bar = ({ label, count, total, colorClass }: { label: string, count: number, total: number, colorClass: string }) => (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
        <span>{label}</span>
        <span>{count} <span className="text-gray-400 font-normal">({((count / (total || 1)) * 100).toFixed(0)}%)</span></span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
        <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${(count / (total || 1)) * 100}%` }}></div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
      <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-5">
        <h3 className="font-bold text-gray-900 dark:text-white mb-1">Priority Distribution</h3>
        <p className="text-xs text-gray-500 mb-6">Distribution of grievance severity</p>
        
        <Bar label="Critical" count={data.priority.Critical} total={data.priority.Total} colorClass="bg-red-500" />
        <Bar label="High" count={data.priority.High} total={data.priority.Total} colorClass="bg-orange-500" />
        <Bar label="Medium" count={data.priority.Medium} total={data.priority.Total} colorClass="bg-blue-500" />
        <Bar label="Low" count={data.priority.Low} total={data.priority.Total} colorClass="bg-gray-400" />
      </div>

      <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-5">
        <h3 className="font-bold text-gray-900 dark:text-white mb-1">Grievance Status & SLA</h3>
        <p className="text-xs text-gray-500 mb-6">Operational state and compliance</p>
        
        <div className="mb-5">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Status Distribution</div>
          <Bar label="Pending" count={data.status.Pending} total={data.status.Total} colorClass="bg-yellow-500" />
          <Bar label="In Progress" count={data.status['In Progress']} total={data.status.Total} colorClass="bg-purple-500" />
          <Bar label="Resolved" count={data.status.Resolved} total={data.status.Total} colorClass="bg-green-500" />
        </div>

        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-t border-gray-100 dark:border-gray-800 pt-4">SLA Condition</div>
          <Bar label="On Time" count={data.sla['On Time']} total={data.sla.Total} colorClass="bg-green-500" />
          <Bar label="At Risk (<24h)" count={data.sla['At Risk']} total={data.sla.Total} colorClass="bg-orange-500" />
          <Bar label="Overdue" count={data.sla.Overdue} total={data.sla.Total} colorClass="bg-red-500" />
        </div>
      </div>
    </div>
  );
}
