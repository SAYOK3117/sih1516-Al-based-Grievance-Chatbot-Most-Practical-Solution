import { useMemo } from 'react';
import type { Grievance } from '../../../lib/store';
import { getSLAStatus } from '../../../lib/slaUtils';
import { KpiCard } from '../KpiCard';
import { FileText, CheckCircle2, Clock, AlertTriangle, Activity, ShieldCheck } from 'lucide-react';

export function NationalAnalyticsKpi({ grievances }: { grievances: Grievance[] }) {
  const kpis = useMemo(() => {
    const total = grievances.length;
    let resolved = 0;
    let pending = 0;
    let overdue = 0;

    grievances.forEach(g => {
      if (g.status === 'Resolved') {
        resolved++;
      } else {
        pending++;
        if (getSLAStatus(g) === 'Overdue') overdue++;
      }
    });

    const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;
    const slaCompliance = total > 0 ? ((total - overdue) / total) * 100 : 100;

    return { total, resolved, pending, overdue, resolutionRate, slaCompliance };
  }, [grievances]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <KpiCard 
        title="Total Grievances" 
        value={kpis.total} 
        icon={FileText} 
        colorClass="text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30"
      />
      <KpiCard 
        title="Resolved" 
        value={kpis.resolved} 
        icon={CheckCircle2} 
        colorClass="text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
      />
      <KpiCard 
        title="Pending" 
        value={kpis.pending} 
        icon={Clock} 
        colorClass="text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30"
      />
      <KpiCard 
        title="Overdue" 
        value={kpis.overdue} 
        icon={AlertTriangle} 
        colorClass="text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30"
      />
      <KpiCard 
        title="Resolution Rate" 
        value={`${kpis.resolutionRate.toFixed(1)}%`} 
        icon={Activity} 
        colorClass="text-teal-600 bg-teal-100 dark:text-teal-400 dark:bg-teal-900/30"
      />
      <KpiCard 
        title="SLA Compliance" 
        value={`${kpis.slaCompliance.toFixed(1)}%`} 
        icon={ShieldCheck} 
        colorClass="text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30"
      />
    </div>
  );
}
