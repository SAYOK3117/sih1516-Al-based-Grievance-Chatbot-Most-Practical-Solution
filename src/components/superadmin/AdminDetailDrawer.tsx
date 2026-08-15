import { X, ShieldAlert, CheckCircle2, AlertTriangle, Clock, Briefcase, ChevronRight } from 'lucide-react';
import type { Grievance, Admin } from '../../lib/store';
import { Button } from '../ui/Button';

export interface AdminDerivedStats {
  admin: Admin;
  assigned: number;
  pending: number;
  resolved: number;
  overdue: number;
  escalated: number;
  slaCompliance: number;
  workload: 'LOW' | 'MEDIUM' | 'HIGH' | 'OVERLOADED';
  performance: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical';
  activeGrievances?: Grievance[];
}

interface AdminDetailDrawerProps {
  stats: AdminDerivedStats;
  grievances: Grievance[];
  onClose: () => void;
  onSelectGrievance: (g: Grievance) => void;
}

export function AdminDetailDrawer({ stats, grievances, onClose, onSelectGrievance }: AdminDetailDrawerProps) {
  const { admin } = stats;

  const requiresAttention = stats.performance === 'Needs Attention' || stats.performance === 'Critical';
  
  let attentionReason = '';
  if (stats.performance === 'Critical') {
    attentionReason = `Critical performance: ${stats.overdue} overdue grievances, SLA at ${stats.slaCompliance.toFixed(1)}%`;
  } else if (stats.performance === 'Needs Attention') {
    attentionReason = `Needs attention: ${stats.overdue > 0 ? `${stats.overdue} overdue grievances` : `SLA at ${stats.slaCompliance.toFixed(1)}%`}`;
  }

  // Workload Visualization Calculation
  const total = stats.assigned || 1; // avoid div 0
  const pendingPct = (stats.pending / total) * 100;
  const overduePct = (stats.overdue / total) * 100;
  const resolvedPct = (stats.resolved / total) * 100;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-gray-900/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0F1620] h-full shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300 border-l border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-sm font-semibold text-purple-600 dark:text-purple-400">{admin.id}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                admin.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {admin.status}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              {admin.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {admin.department} • {admin.district}, {admin.state}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Attention Alert */}
          {requiresAttention && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-4 flex gap-3 items-start">
              <ShieldAlert className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-sm font-bold text-red-900 dark:text-red-400 uppercase tracking-wider mb-1">Admin requires attention</h4>
                <p className="text-sm text-red-700 dark:text-red-300">{attentionReason}</p>
              </div>
            </div>
          )}

          {/* Performance Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#141C27] border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm text-center">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.assigned}</span>
              <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Assigned</span>
            </div>
            <div className="bg-white dark:bg-[#141C27] border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm text-center">
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.pending}</span>
              <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Pending</span>
            </div>
            <div className="bg-white dark:bg-[#141C27] border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm text-center">
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.resolved}</span>
              <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Resolved</span>
            </div>
            <div className="bg-white dark:bg-[#141C27] border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm text-center">
              <span className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{stats.overdue}</span>
              <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Overdue</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#141C27] border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm flex justify-between items-center">
              <div>
                <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Escalated</span>
                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{stats.escalated}</span>
              </div>
              <AlertTriangle className="text-orange-200 dark:text-orange-900/50" size={32} />
            </div>
            <div className="bg-white dark:bg-[#141C27] border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm flex justify-between items-center">
              <div>
                <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">SLA Compliance</span>
                <span className={`text-lg font-bold ${stats.slaCompliance >= 90 ? 'text-green-600 dark:text-green-400' : stats.slaCompliance >= 70 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>{stats.slaCompliance.toFixed(1)}%</span>
              </div>
              <CheckCircle2 className="text-green-100 dark:text-green-900/30" size={32} />
            </div>
          </div>

          {/* Workload Visualization */}
          <div className="bg-white dark:bg-[#141C27] border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Workload Breakdown</h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                stats.workload === 'LOW' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                stats.workload === 'MEDIUM' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                stats.workload === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>{stats.workload} Workload</span>
            </div>
            
            {stats.assigned > 0 ? (
              <div className="w-full h-4 rounded-full flex overflow-hidden bg-gray-100 dark:bg-gray-800">
                <div style={{ width: `${resolvedPct}%` }} className="bg-green-500 h-full" title={`Resolved: ${stats.resolved}`}></div>
                <div style={{ width: `${pendingPct - overduePct}%` }} className="bg-purple-500 h-full" title={`Pending (On-time): ${stats.pending - stats.overdue}`}></div>
                <div style={{ width: `${overduePct}%` }} className="bg-red-500 h-full" title={`Overdue: ${stats.overdue}`}></div>
              </div>
            ) : (
              <div className="w-full h-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <span className="text-[10px] text-gray-400 font-bold uppercase">No Grievances</span>
              </div>
            )}
            
            <div className="flex gap-4 mt-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Resolved ({stats.resolved})</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Pending ({stats.pending - stats.overdue})</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Overdue ({stats.overdue})</div>
            </div>
          </div>

          {/* Current Assigned Grievances */}
          <div>
            <h4 className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              <Briefcase size={16} /> Current Assigned Grievances
            </h4>
            
            {grievances.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                No grievances currently assigned.
              </p>
            ) : (
              <div className="space-y-3">
                {grievances.map(g => (
                  <div 
                    key={g.id} 
                    onClick={() => onSelectGrievance(g)}
                    className="bg-white dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 p-4 rounded-xl shadow-sm hover:border-purple-300 dark:hover:border-purple-700 cursor-pointer transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2 items-center">
                        <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400">{g.id}</span>
                        {g.priority === 'Critical' && <span className="w-2 h-2 rounded-full bg-red-500" title="Critical Priority"></span>}
                        {g.priority === 'High' && <span className="w-2 h-2 rounded-full bg-orange-500" title="High Priority"></span>}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        g.status === 'Resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                        g.status === 'In Progress' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'
                      }`}>
                        {g.status}
                      </span>
                    </div>
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{g.title}</h5>
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                      <span className="truncate pr-2 flex items-center gap-1">📍 {g.location || g.city}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {g.escalated && <span className="text-orange-500 font-bold" title="Escalated">⚠️</span>}
                        <Clock size={12} className={g.dueAt && new Date(g.dueAt) < new Date() ? 'text-red-500' : ''} /> 
                        <span className={g.dueAt && new Date(g.dueAt) < new Date() ? 'text-red-500 font-bold' : ''}>{g.sla}</span>
                        <ChevronRight size={14} className="text-gray-400 group-hover:text-purple-500 ml-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0F1620] flex justify-end">
          <Button variant="outline" onClick={onClose} className="border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
            Close View
          </Button>
        </div>
      </div>
    </div>
  );
}
