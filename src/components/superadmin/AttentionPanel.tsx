import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { AlertCircle, Bell, UserPlus, AlertTriangle } from 'lucide-react';
import type { Grievance } from '../../lib/store';
import { useStore } from '../../lib/store';
import { deriveNotifications } from '../../lib/superAdminAlerts';
import { ReminderModal, ReassignModal, EscalateModal, ReopenModal } from './InterventionModals';

export function AttentionPanel({ grievances }: { grievances: Grievance[] }) {
  const { admins, escalations, readNotificationIds } = useStore();
  const [activeModal, setActiveModal] = useState<{
    type: 'reminder' | 'reassign' | 'escalate' | 'reopen';
    grievance: Grievance;
  } | null>(null);

  // We reuse the new notification logic to build the Attention Panel
  const notifications = deriveNotifications(grievances, admins, escalations, readNotificationIds);
  
  // The attention panel historically only showed grievance-related alerts (not admin workload specifically)
  // But we can show all relevant unresolved critical/warning items here
  const alerts = notifications.filter(n => n.relatedGrievanceId && (n.severity === 'CRITICAL' || n.severity === 'WARNING'));

  return (
    <>
      <Card className="border-red-100 dark:border-red-900/30 shadow-sm h-full flex flex-col bg-white dark:bg-[#0F1620]">
        <CardHeader className="bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/20 pb-4">
          <CardTitle className="text-lg font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertCircle size={20} />
            Attention Required
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
              No urgent interventions required.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {alerts.map(alert => {
                // Find the associated grievance
                const item = grievances.find(g => g.id === alert.relatedGrievanceId);
                if (!item) return null;

                const typeColor = alert.severity === 'CRITICAL' 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900/50'
                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-900/50';

                return (
                  <div key={alert.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1.5 border uppercase tracking-wider ${typeColor}`}>
                        {alert.severity === 'CRITICAL' && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                        {alert.title}
                      </span>
                      <span className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400">{item.id}</span>
                    </div>
                    
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h4>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3 text-gray-600 dark:text-gray-300">
                      <div>
                        <span className="block text-gray-400 dark:text-gray-500 mb-0.5">Location</span>
                        <span className="font-medium">{item.city || item.district || item.location}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 dark:text-gray-500 mb-0.5">Assigned</span>
                        <span className="font-medium">{item.assignedAdminName || 'Unassigned'}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 dark:text-gray-500 mb-0.5">Status</span>
                        <span className="font-medium">{item.status}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 dark:text-gray-500 mb-0.5">SLA</span>
                        <span className={`font-medium ${item.slaColor}`}>{item.sla}</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-[#141C27] rounded p-3 mb-4 border border-gray-100 dark:border-gray-800">
                      <p className="text-xs text-gray-600 dark:text-gray-400 italic">" {alert.message} "</p>
                    </div>

                    <div className="flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.assignedAdminId && (
                        <button 
                          onClick={() => setActiveModal({ type: 'reminder', grievance: item })}
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 flex items-center gap-1 transition-colors"
                        >
                          <Bell size={12} /> Reminder
                        </button>
                      )}
                      <button 
                        onClick={() => setActiveModal({ type: 'reassign', grievance: item })}
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/40 flex items-center gap-1 transition-colors"
                      >
                        <UserPlus size={12} /> Reassign
                      </button>
                      <button 
                        onClick={() => setActiveModal({ type: 'escalate', grievance: item })}
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/40 flex items-center gap-1 transition-colors"
                      >
                        <AlertTriangle size={12} /> Escalate
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {activeModal?.type === 'reminder' && <ReminderModal grievance={activeModal.grievance} onClose={() => setActiveModal(null)} />}
      {activeModal?.type === 'reassign' && <ReassignModal grievance={activeModal.grievance} onClose={() => setActiveModal(null)} />}
      {activeModal?.type === 'escalate' && <EscalateModal grievance={activeModal.grievance} onClose={() => setActiveModal(null)} />}
      {activeModal?.type === 'reopen' && <ReopenModal grievance={activeModal.grievance} onClose={() => setActiveModal(null)} />}
    </>
  );
}
