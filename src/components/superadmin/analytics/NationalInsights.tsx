import { useMemo } from 'react';
import type { Grievance, Admin } from '../../../lib/store';
import { getSLAStatus } from '../../../lib/slaUtils';
import { Info, AlertTriangle, ShieldAlert } from 'lucide-react';

interface Insight {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
}

export function NationalInsights({ grievances, admins }: { grievances: Grievance[], admins: Admin[] }) {
  const insights = useMemo(() => {
    const results: Insight[] = [];

    if (grievances.length === 0) {
      results.push({ id: 'no-data', severity: 'INFO', message: 'No grievance data available for insights.' });
      return results;
    }

    // 1. Identify state with highest volume
    const stateStats: Record<string, { total: number, overdue: number }> = {};
    const deptStats: Record<string, { total: number, resolved: number, overdue: number }> = {};
    let criticalUnresolved = 0;
    let totalEscalated = 0;
    let totalReopened = 0;

    grievances.forEach(g => {
      // State
      if (g.state) {
        if (!stateStats[g.state]) stateStats[g.state] = { total: 0, overdue: 0 };
        stateStats[g.state].total++;
        if (g.status !== 'Resolved') {
           if (getSLAStatus(g) === 'Overdue') stateStats[g.state].overdue++;
        }
      }

      // Dept
      if (g.dept) {
        if (!deptStats[g.dept]) deptStats[g.dept] = { total: 0, resolved: 0, overdue: 0 };
        deptStats[g.dept].total++;
        if (g.status === 'Resolved') deptStats[g.dept].resolved++;
        else {
           if (getSLAStatus(g) === 'Overdue') deptStats[g.dept].overdue++;
        }
      }

      // Critical unresolved
      if (g.status !== 'Resolved' && g.priority === 'Critical') criticalUnresolved++;
      
      // Escalated / Reopened
      if (g.escalated && g.status !== 'Resolved') totalEscalated++;
      if (g.reopened) totalReopened++;
    });

    // Generate Insights
    // State highest volume
    const statesByVol = Object.keys(stateStats).sort((a, b) => stateStats[b].total - stateStats[a].total);
    if (statesByVol.length > 0) {
      results.push({
        id: 'highest-vol-state',
        severity: 'INFO',
        message: `${statesByVol[0]} currently has the highest grievance volume (${stateStats[statesByVol[0]].total} total).`
      });
    }

    // State highest overdue
    const statesByOverdue = Object.keys(stateStats).filter(s => stateStats[s].overdue > 0).sort((a, b) => stateStats[b].overdue - stateStats[a].overdue);
    if (statesByOverdue.length > 0) {
      results.push({
        id: 'highest-overdue-state',
        severity: stateStats[statesByOverdue[0]].overdue > 5 ? 'CRITICAL' : 'WARNING',
        message: `${statesByOverdue[0]} has the highest number of overdue grievances (${stateStats[statesByOverdue[0]].overdue} overdue).`
      });
    }

    // Dept lowest resolution rate (min 5 total)
    const deptsByRes = Object.keys(deptStats).filter(d => deptStats[d].total > 2).sort((a, b) => {
      const rateA = deptStats[a].resolved / deptStats[a].total;
      const rateB = deptStats[b].resolved / deptStats[b].total;
      return rateA - rateB; // lowest first
    });
    if (deptsByRes.length > 0) {
      const worstDept = deptsByRes[0];
      const rate = ((deptStats[worstDept].resolved / deptStats[worstDept].total) * 100).toFixed(0);
      if (Number(rate) < 70) {
        results.push({
          id: 'lowest-res-dept',
          severity: 'WARNING',
          message: `${worstDept} department has the lowest resolution rate (${rate}%).`
        });
      }
    }

    // Critical Unresolved
    if (criticalUnresolved > 0) {
      results.push({
        id: 'critical-unresolved',
        severity: 'CRITICAL',
        message: `${criticalUnresolved} critical grievances remain unresolved and require immediate attention.`
      });
    } else {
      results.push({
        id: 'no-critical',
        severity: 'INFO',
        message: 'No critical grievances are currently pending.'
      });
    }

    // Escalations
    if (totalEscalated > 2) {
      results.push({
        id: 'high-escalations',
        severity: 'WARNING',
        message: `${totalEscalated} active grievances are currently escalated.`
      });
    }

    // Admin Workload
    const adminAssignments: Record<string, number> = {};
    grievances.forEach(g => {
      if (g.status !== 'Resolved' && g.assignedAdminId) {
        adminAssignments[g.assignedAdminId] = (adminAssignments[g.assignedAdminId] || 0) + 1;
      }
    });
    const overloadedAdmins = Object.keys(adminAssignments).filter(id => adminAssignments[id] > 20).length;
    if (overloadedAdmins > 0) {
      results.push({
        id: 'overloaded-admins',
        severity: 'WARNING',
        message: `${overloadedAdmins} admins are currently managing a high workload (>20 pending grievances).`
      });
    }

    // Sort by severity: CRITICAL, WARNING, INFO
    const order = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    results.sort((a, b) => order[a.severity] - order[b.severity]);

    return results;
  }, [grievances, admins]);

  return (
    <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-5">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">National Insights</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map(insight => (
          <div key={insight.id} className={`flex items-start gap-3 p-4 rounded-xl border ${
            insight.severity === 'CRITICAL' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' :
            insight.severity === 'WARNING' ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30' :
            'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30'
          }`}>
            <div className={`mt-0.5 ${
              insight.severity === 'CRITICAL' ? 'text-red-600 dark:text-red-400' :
              insight.severity === 'WARNING' ? 'text-orange-600 dark:text-orange-400' :
              'text-blue-600 dark:text-blue-400'
            }`}>
              {insight.severity === 'CRITICAL' ? <ShieldAlert size={20} /> :
               insight.severity === 'WARNING' ? <AlertTriangle size={20} /> :
               <Info size={20} />}
            </div>
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                insight.severity === 'CRITICAL' ? 'text-red-800 dark:text-red-400' :
                insight.severity === 'WARNING' ? 'text-orange-800 dark:text-orange-400' :
                'text-blue-800 dark:text-blue-400'
              }`}>{insight.severity}</span>
              <p className={`text-sm font-medium ${
                insight.severity === 'CRITICAL' ? 'text-red-900 dark:text-red-300' :
                insight.severity === 'WARNING' ? 'text-orange-900 dark:text-orange-300' :
                'text-blue-900 dark:text-blue-300'
              }`}>{insight.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
