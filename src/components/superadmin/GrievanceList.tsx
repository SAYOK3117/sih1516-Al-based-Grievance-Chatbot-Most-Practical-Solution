import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import type { Grievance } from '../../lib/store';
import { MapPin } from 'lucide-react';

const normalizeStateName = (name: string) => {
  if (!name) return '';
  let clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean === 'up') return 'uttarpradesh';
  if (clean === 'mp') return 'madhyapradesh';
  if (clean === 'andamanandnicobar') return 'andamanandnicobarislands';
  if (clean === 'delhi') return 'nctofdelhi';
  return clean;
};

export function GrievanceList({ 
  districtName, 
  stateName,
  grievances,
  onSelectGrievance
}: { 
  districtName: string, 
  stateName: string,
  grievances: Grievance[],
  onSelectGrievance: (id: string) => void
}) {
  const districtGrievances = grievances.filter(g => {
    const s = g.state || '';
    const stateMatch = normalizeStateName(s) === normalizeStateName(stateName);
    const d = g.district || g.city || 'Unknown District';
    const districtMatch = d === districtName;
    return stateMatch && districtMatch;
  });

  if (districtGrievances.length === 0) {
    return (
      <Card className="border-gray-100 dark:border-gray-800 shadow-sm h-full">
        <CardHeader className="bg-gray-50/50 dark:bg-gray-900/20 border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white uppercase">
            <MapPin size={20} className="text-purple-600 dark:text-purple-400" />
            {districtName}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <MapPin size={32} className="text-gray-400 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Grievances Found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No grievances recorded in this district.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-100 dark:border-gray-800 shadow-sm h-full flex flex-col">
      <CardHeader className="bg-purple-50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-900/20 py-4">
        <CardTitle className="text-lg font-bold flex flex-col gap-1 text-gray-900 dark:text-white uppercase">
          <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold tracking-wider">District Grievances</span>
          {districtName}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {districtGrievances.map(g => {
            const isResolved = g.status === 'Resolved';
            const isOverdue = !isResolved && (g.dueAt ? new Date(g.dueAt) < new Date() : g.sla.toLowerCase().includes('overdue'));
            
            let slaText = g.sla;
            if (g.dueAt) {
              const diffHours = (new Date(g.dueAt).getTime() - new Date().getTime()) / (1000 * 60 * 60);
              if (diffHours < 0) {
                slaText = `${Math.abs(Math.round(diffHours))}h overdue`;
              } else {
                slaText = `${Math.round(diffHours)}h remaining`;
              }
            }

            return (
              <button
                key={g.id}
                onClick={() => onSelectGrievance(g.id)}
                className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex flex-col gap-2"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400">{g.id}</span>
                  <div className="flex gap-2">
                    {isOverdue && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Overdue
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      g.priority === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      g.priority === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {g.priority}
                    </span>
                  </div>
                </div>
                
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                  {g.title}
                </h4>
                
                <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <div className="flex justify-between">
                    <span>Status: <strong className={isResolved ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}>{g.status}</strong></span>
                    <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>SLA: {slaText}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assigned: <strong className="text-gray-700 dark:text-gray-300">{g.assignedAdminName || 'Unassigned'}</strong></span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
