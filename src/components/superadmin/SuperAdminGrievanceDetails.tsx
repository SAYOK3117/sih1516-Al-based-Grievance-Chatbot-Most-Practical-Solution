import { useState } from 'react';
import type { Grievance } from '../../lib/store';
import { X, BrainCircuit, AlertTriangle, AlertCircle, Bell, UserPlus, History } from 'lucide-react';
import { getSLAStatus, getSLAText } from '../../lib/slaUtils';
import { Button } from '../ui/Button';
import { ReminderModal, ReassignModal, EscalateModal, ReopenModal } from './InterventionModals';

export function SuperAdminGrievanceDetails({ 
  grievance, 
  onClose 
}: { 
  grievance: Grievance,
  onClose: () => void
}) {
  const [activeModal, setActiveModal] = useState<'reminder' | 'reassign' | 'escalate' | 'reopen' | null>(null);

  const isResolved = grievance.status === 'Resolved';
  const slaStatusStr = getSLAStatus(grievance);
  const isOverdue = slaStatusStr === 'Overdue';
  
  const slaText = getSLAText(grievance);
  const slaStatus = slaStatusStr.toUpperCase();

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    if (!dateString.includes('T') && !dateString.includes('-')) return dateString; 
    
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      
      const day = d.getDate();
      const month = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      
      return `${day} ${month} ${year} • ${hours}:${minutes} ${ampm}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0F1620] h-full shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300 border-l border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-sm font-semibold text-purple-600 dark:text-purple-400">{grievance.id}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                grievance.status === 'Resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                grievance.status === 'In Progress' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {grievance.status}
              </span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                grievance.priority === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                grievance.priority === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {grievance.priority}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight pr-8">
              {grievance.title}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Indicators */}
        {(isOverdue || grievance.escalated || grievance.reopened) && (
          <div className="bg-red-50 dark:bg-red-900/20 px-6 py-3 border-b border-red-100 dark:border-red-900/30 flex gap-3">
            {isOverdue && (
              <div className="flex items-center gap-1.5 text-sm font-bold text-red-700 dark:text-red-400">
                <AlertTriangle size={16} /> ⚠️ SLA BREACHED
              </div>
            )}
            {grievance.escalated && (
              <div className="flex items-center gap-1.5 text-sm font-bold text-orange-700 dark:text-orange-400">
                <AlertCircle size={16} /> ESCALATED
              </div>
            )}
            {grievance.reopened && (
              <div className="flex items-center gap-1.5 text-sm font-bold text-yellow-700 dark:text-yellow-400">
                <AlertCircle size={16} /> REOPENED
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* AI Intelligence */}
          <div className="bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/20 p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-purple-700 dark:text-purple-400 mb-3 uppercase tracking-wider">
              <BrainCircuit size={18} /> AI Classification
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
              {grievance.aiSummary}
            </p>
            <div className="flex gap-4 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-900/30 p-3 rounded-lg">
              <div>Detected Priority: <strong className="text-gray-900 dark:text-white">{grievance.priority}</strong></div>
              <div>Suggested Dept: <strong className="text-gray-900 dark:text-white">{grievance.dept}</strong></div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F1620] space-y-5 rounded-lg border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            
            {/* LOCATION */}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                📍 {grievance.location}, {grievance.city || grievance.district}, {grievance.state}
              </p>
            </div>

            <div className="w-full h-px bg-gray-100 dark:bg-gray-800"></div>

            {/* SUBMITTED BY */}
            <div>
              <h4 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">
                Submitted By
              </h4>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {grievance.citizen}
              </p>
            </div>

            {/* SUBMITTED */}
            <div>
              <h4 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">
                Submitted
              </h4>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(grievance.createdAt || grievance.date)}
              </p>
            </div>

            {/* DEPARTMENT */}
            <div>
              <h4 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">
                Department
              </h4>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {grievance.dept}
              </p>
            </div>

            {/* ASSIGNED ADMIN */}
            <div>
              <h4 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">
                Assigned Admin
              </h4>
              {grievance.assignedAdminId ? (
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{grievance.assignedAdminName || 'Department Officer'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{grievance.dept}</p>
                </div>
              ) : (
                <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                  Unassigned
                </p>
              )}
            </div>

            <div className="w-full h-px bg-gray-100 dark:bg-gray-800"></div>

            <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
              <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center">Priority</div>
              <div className={`font-bold uppercase ${
                grievance.priority === 'Critical' ? 'text-red-600 dark:text-red-400' :
                grievance.priority === 'High' ? 'text-orange-600 dark:text-orange-400' :
                'text-blue-600 dark:text-blue-400'
              }`}>{grievance.priority}</div>
              
              <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center">Status</div>
              <div className="font-bold text-gray-900 dark:text-white uppercase">{grievance.status}</div>
              
              <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center">SLA</div>
              <div className={`font-medium ${
                slaStatus === 'OVERDUE' ? 'text-red-600 dark:text-red-400' :
                slaStatus === 'AT RISK' ? 'text-orange-600 dark:text-orange-400' :
                'text-gray-900 dark:text-white'
              }`}>{slaText}</div>
            </div>
            
          </div>

          {/* Timeline */}
          {/* Intervention & Activity History */}
          <div>
            <h4 className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              <History size={16} /> Intervention & Activity History
            </h4>
            
            {(!grievance.activities || grievance.activities.length === 0) ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">No intervention history available.</p>
            ) : (
              <div className="space-y-4">
                {[...grievance.activities].reverse().map((act) => (
                  <div key={act.id} className="bg-white dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                        {formatDate(act.timestamp)}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        act.actor === 'Super Admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        act.actor === 'Admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        act.actor === 'System' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {act.actor}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{act.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
        
        {/* Footer & Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0F1620] flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {!isResolved && grievance.assignedAdminId && (
              <Button onClick={() => setActiveModal('reminder')} className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-transparent dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 gap-1.5 h-9 px-3">
                <Bell size={16} /> Send Reminder
              </Button>
            )}
            {!isResolved && (
              <Button onClick={() => setActiveModal('reassign')} className="bg-purple-50 text-purple-600 hover:bg-purple-100 border-transparent dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/40 gap-1.5 h-9 px-3">
                <UserPlus size={16} /> Reassign
              </Button>
            )}
            {!isResolved && !grievance.escalated && (
              <Button onClick={() => setActiveModal('escalate')} className="bg-orange-50 text-orange-600 hover:bg-orange-100 border-transparent dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/40 gap-1.5 h-9 px-3">
                <AlertTriangle size={16} /> Escalate
              </Button>
            )}
            {isResolved && (
              <Button onClick={() => setActiveModal('reopen')} className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border-transparent dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/40 gap-1.5 h-9 px-3">
                <AlertCircle size={16} /> Reopen Grievance
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={onClose} className="border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
            Close Panel
          </Button>
        </div>
      </div>

      {activeModal === 'reminder' && <ReminderModal grievance={grievance} onClose={() => setActiveModal(null)} />}
      {activeModal === 'reassign' && <ReassignModal grievance={grievance} onClose={() => setActiveModal(null)} />}
      {activeModal === 'escalate' && <EscalateModal grievance={grievance} onClose={() => setActiveModal(null)} />}
      {activeModal === 'reopen' && <ReopenModal grievance={grievance} onClose={() => setActiveModal(null)} />}
    </div>
  );
}
