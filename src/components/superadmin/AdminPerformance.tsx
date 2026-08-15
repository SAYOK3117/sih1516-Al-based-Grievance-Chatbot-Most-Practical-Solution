import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import type { Admin } from '../../lib/store';
import { Users } from 'lucide-react';

export function AdminPerformance({ admins }: { admins: Admin[] }) {
  const topAdmins = [...admins].sort((a, b) => b.resolvedGrievances - a.resolvedGrievances).slice(0, 5);

  return (
    <Card className="border-gray-100 dark:border-gray-800 shadow-sm h-full">
      <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <Users size={20} className="text-blue-600 dark:text-blue-400" />
          Admin Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 uppercase">
            <tr>
              <th className="px-4 py-4 font-medium">Admin</th>
              <th className="px-4 py-4 font-medium">Department</th>
              <th className="px-4 py-4 font-medium text-center">Assigned</th>
              <th className="px-4 py-4 font-medium text-center">Pending</th>
              <th className="px-4 py-4 font-medium text-center">Overdue</th>
              <th className="px-4 py-4 font-medium text-right">SLA Compliance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {topAdmins.map(admin => (
              <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                <td className="px-4 py-4">
                  <div className="font-medium text-gray-900 dark:text-white">{admin.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{admin.district}, {admin.state}</div>
                </td>
                <td className="px-4 py-4 text-gray-600 dark:text-gray-300">{admin.department}</td>
                <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-300">{admin.assignedGrievances}</td>
                <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-300">{admin.pendingGrievances}</td>
                <td className="px-4 py-4 text-center font-medium text-red-600 dark:text-red-400">
                  {admin.overdueGrievances > 0 ? admin.overdueGrievances : '-'}
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${admin.slaCompliance >= 90 ? 'bg-green-500' : admin.slaCompliance >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${admin.slaCompliance}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-8">{admin.slaCompliance}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
