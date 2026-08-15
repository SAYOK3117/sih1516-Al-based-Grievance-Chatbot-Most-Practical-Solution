import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import type { Grievance } from '../../lib/store';
import { Clock } from 'lucide-react';

export function RecentGrievances({ grievances }: { grievances: Grievance[] }) {
  const recent = [...grievances].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  }).slice(0, 5);

  return (
    <Card className="border-gray-100 dark:border-gray-800 shadow-sm h-full">
      <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <Clock size={20} className="text-purple-600 dark:text-purple-400" />
          Recent Grievances
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 uppercase">
            <tr>
              <th className="px-4 py-4 font-medium">ID</th>
              <th className="px-4 py-4 font-medium">Issue</th>
              <th className="px-4 py-4 font-medium">Location</th>
              <th className="px-4 py-4 font-medium">Department</th>
              <th className="px-4 py-4 font-medium">Assigned Admin</th>
              <th className="px-4 py-4 font-medium">Priority</th>
              <th className="px-4 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {recent.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                <td className="px-4 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">{item.id}</td>
                <td className="px-4 py-4 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{item.title}</td>
                <td className="px-4 py-4 text-gray-600 dark:text-gray-300">{item.city || item.district || item.location}</td>
                <td className="px-4 py-4 text-gray-600 dark:text-gray-300">{item.dept}</td>
                <td className="px-4 py-4 text-gray-600 dark:text-gray-300">{item.assignedAdminName || '-'}</td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.priority === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    item.priority === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                    item.priority === 'Medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {item.priority}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.status === 'Resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    item.status === 'In Progress' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No grievances found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
