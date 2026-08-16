import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import type { Admin, Grievance } from '../../lib/store';
import { useStore } from '../../lib/store';
import { getSLAStatus } from '../../lib/slaUtils';
import { Users, TrendingUp, Award } from 'lucide-react';

interface AdminPerformanceProps {
  admins: Admin[];
  grievances?: Grievance[];
  onSelectAdmin?: (admin: Admin) => void;
}

export function AdminPerformance({ admins, onSelectAdmin }: AdminPerformanceProps) {
  const { grievances } = useStore();

  // Compute live dynamic stats for each admin from grievances
  const computedAdmins = useMemo(() => {
    return admins.map(admin => {
      const assignedGrievances = grievances.filter(g => g.assignedAdminId === admin.id);
      const assigned = assignedGrievances.length || admin.assignedGrievances || 0;
      const resolved = assignedGrievances.filter(g => g.status === 'Resolved').length || admin.resolvedGrievances || 0;
      const pending = Math.max(0, assigned - resolved);
      const overdue = assignedGrievances.filter(g => g.status !== 'Resolved' && getSLAStatus(g) === 'Overdue').length || admin.overdueGrievances || 0;
      
      const slaCompliance = assigned > 0 
        ? Math.max(0, Math.min(100, ((assigned - overdue) / assigned) * 100))
        : (admin.slaCompliance || 100);

      const resolutionRate = assigned > 0 
        ? Math.max(0, Math.min(100, (resolved / assigned) * 100))
        : 100;

      return {
        ...admin,
        assignedGrievances: assigned,
        resolvedGrievances: resolved,
        pendingGrievances: pending,
        overdueGrievances: overdue,
        slaCompliance: Number(slaCompliance.toFixed(1)),
        resolutionRate: Number(resolutionRate.toFixed(1))
      };
    }).sort((a, b) => b.resolvedGrievances - a.resolvedGrievances).slice(0, 5);
  }, [admins, grievances]);

  // Average SLA calculation for header figure
  const avgSla = useMemo(() => {
    if (computedAdmins.length === 0) return 100;
    const sum = computedAdmins.reduce((acc, curr) => acc + curr.slaCompliance, 0);
    return (sum / computedAdmins.length).toFixed(1);
  }, [computedAdmins]);

  return (
    <Card className="border-gray-100 dark:border-gray-800 shadow-sm h-full flex flex-col bg-white dark:bg-[#0F1620]">
      <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <Users size={20} className="text-blue-600 dark:text-blue-400" />
          Admin Performance
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Avg SLA:</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 flex items-center gap-1">
            <TrendingUp size={12} /> {avgSla}%
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50/80 dark:bg-gray-800/40 uppercase">
            <tr>
              <th className="px-4 py-3.5 font-semibold">Admin</th>
              <th className="px-4 py-3.5 font-semibold">Department</th>
              <th className="px-3 py-3.5 font-semibold text-center">Assigned</th>
              <th className="px-3 py-3.5 font-semibold text-center">Pending</th>
              <th className="px-3 py-3.5 font-semibold text-center">Overdue</th>
              <th className="px-3 py-3.5 font-semibold text-center">Resolution %</th>
              <th className="px-4 py-3.5 font-semibold text-right">SLA Compliance %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {computedAdmins.map((admin, index) => {
              const isTop = index === 0;

              return (
                <tr 
                  key={admin.id} 
                  onClick={() => onSelectAdmin && onSelectAdmin(admin)}
                  className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors ${onSelectAdmin ? 'cursor-pointer' : ''}`}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {isTop && (
                        <Award size={14} className="text-amber-500 shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                          {admin.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {admin.district}, {admin.state}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300 font-medium">
                    {admin.department}
                  </td>
                  <td className="px-3 py-3.5 text-center font-semibold text-gray-800 dark:text-gray-200">
                    {admin.assignedGrievances}
                  </td>
                  <td className="px-3 py-3.5 text-center font-medium text-purple-600 dark:text-purple-400">
                    {admin.pendingGrievances}
                  </td>
                  <td className="px-3 py-3.5 text-center font-bold">
                    {admin.overdueGrievances > 0 ? (
                      <span className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded text-xs">
                        {admin.overdueGrievances}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  {/* Resolution Rate Figure */}
                  <td className="px-3 py-3.5 text-center">
                    <span className="font-bold text-xs text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                      {admin.resolutionRate}%
                    </span>
                  </td>
                  {/* SLA Compliance Percentage Figure & Bar */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <div className="w-14 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shrink-0">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            admin.slaCompliance >= 90 ? 'bg-green-500' :
                            admin.slaCompliance >= 75 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${admin.slaCompliance}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        admin.slaCompliance >= 90 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' 
                          : admin.slaCompliance >= 75 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      }`}>
                        {admin.slaCompliance}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
