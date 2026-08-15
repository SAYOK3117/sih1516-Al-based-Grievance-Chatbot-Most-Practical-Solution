import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { MapPin, AlertTriangle, TrendingUp, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import type { Grievance } from '../../lib/store';

const normalizeStateName = (name: string) => {
  if (!name) return '';
  let clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean === 'up') return 'uttarpradesh';
  if (clean === 'mp') return 'madhyapradesh';
  if (clean === 'andamanandnicobar') return 'andamanandnicobarislands';
  if (clean === 'delhi') return 'nctofdelhi';
  return clean;
};

export function DistrictGrievancePanel({ 
  stateName, 
  grievances, 
  onSelectDistrict 
}: { 
  stateName: string, 
  grievances: Grievance[],
  onSelectDistrict: (district: string) => void
}) {
  const stateGrievances = grievances.filter(g => {
    const s = g.state || '';
    return normalizeStateName(s) === normalizeStateName(stateName);
  });

  if (stateGrievances.length === 0) {
    return (
      <Card className="border-gray-100 dark:border-gray-800 shadow-sm h-full">
        <CardHeader className="bg-gray-50/50 dark:bg-gray-900/20 border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white uppercase">
            <MapPin size={20} className="text-purple-600 dark:text-purple-400" />
            {stateName}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <MapPin size={32} className="text-gray-400 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Data Available</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No district-level grievance data available for this state.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate State Totals
  let total = 0, active = 0, resolved = 0, overdue = 0, escalated = 0;
  
  // Calculate District Stats
  const districtStats: Record<string, any> = {};

  stateGrievances.forEach(g => {
    total++;
    const isResolved = g.status === 'Resolved';
    const isOverdue = !isResolved && (g.dueAt ? new Date(g.dueAt) < new Date() : g.sla.toLowerCase().includes('overdue'));
    const isCritical = !isResolved && (g.priority === 'Critical' || g.priority === 'High');

    if (isResolved) resolved++;
    else active++;

    if (isOverdue) overdue++;
    if (g.escalated && !isResolved) escalated++;

    const d = g.district || g.city || 'Unknown District';
    if (!districtStats[d]) {
      districtStats[d] = { total: 0, active: 0, resolved: 0, overdue: 0, critical: 0 };
    }
    districtStats[d].total++;
    if (isResolved) districtStats[d].resolved++;
    else districtStats[d].active++;
    if (isOverdue) districtStats[d].overdue++;
    if (isCritical) districtStats[d].critical++;
  });

  const districts = Object.entries(districtStats).sort((a: any, b: any) => b[1].active - a[1].active);

  return (
    <Card className="border-gray-100 dark:border-gray-800 shadow-sm h-full flex flex-col">
      <CardHeader className="bg-purple-50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-900/20 py-4">
        <CardTitle className="text-lg font-bold flex flex-col gap-1 text-gray-900 dark:text-white uppercase">
          <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold tracking-wider">State Summary</span>
          {stateName}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto flex flex-col">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="text-center mb-5">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Grievances</p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">{total}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-2.5 rounded-xl border border-purple-100 dark:border-purple-900/30 flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 font-medium text-xs">
                <TrendingUp size={14} /> Active
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{active}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-2.5 rounded-xl border border-green-100 dark:border-green-900/30 flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400 font-medium text-xs">
                <CheckCircle2 size={14} /> Resolved
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{resolved}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-2.5 rounded-xl border border-red-100 dark:border-red-900/30 flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-medium text-xs">
                <AlertTriangle size={14} /> Overdue
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{overdue}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-2.5 rounded-xl border border-orange-100 dark:border-orange-900/30 flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-orange-700 dark:text-orange-400 font-medium text-xs">
                <AlertCircle size={14} /> Escalated
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{escalated}</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 bg-gray-50/30 dark:bg-gray-900/10">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Districts</h4>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {districts.map(([district, stats]: any) => (
              <button
                key={district}
                onClick={() => onSelectDistrict(district)}
                className="w-full text-left p-4 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors flex items-center justify-between group"
              >
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {district}
                  </h5>
                  <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Total: {stats.total}</span>
                    <span className="text-purple-600 dark:text-purple-400 font-medium">Act: {stats.active}</span>
                    {stats.overdue > 0 && <span className="text-red-600 dark:text-red-400 font-medium">Ovd: {stats.overdue}</span>}
                  </div>
                </div>
                <div className="text-gray-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  <ChevronRight size={18} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
