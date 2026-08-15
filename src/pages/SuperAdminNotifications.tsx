import { useState, useMemo } from 'react';
import { useStore } from '../lib/store';
import { deriveNotifications } from '../lib/superAdminAlerts';
import { SuperAdminSidebar } from '../components/superadmin/SuperAdminSidebar';
import { SuperAdminHeader } from '../components/superadmin/SuperAdminHeader';
import { SuperAdminGrievanceDetails } from '../components/superadmin/SuperAdminGrievanceDetails';
import { AdminDetailDrawer } from '../components/superadmin/AdminDetailDrawer';
import type { AdminDerivedStats } from '../components/superadmin/AdminDetailDrawer';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, Info, Check, Filter } from 'lucide-react';
import type { Grievance } from '../lib/store';

export function SuperAdminNotifications() {
  const navigate = useNavigate();
  const { grievances, admins, escalations, readNotificationIds, markNotificationAsRead, markAllNotificationsAsRead } = useStore();
  
  const [filter, setFilter] = useState<'All' | 'Unread' | 'Critical' | 'Warning' | 'Info'>('All');
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [selectedAdminStats, setSelectedAdminStats] = useState<AdminDerivedStats | null>(null);

  const notifications = deriveNotifications(grievances, admins, escalations, readNotificationIds);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filter === 'Unread') return !n.read;
      if (filter === 'Critical') return n.severity === 'CRITICAL';
      if (filter === 'Warning') return n.severity === 'WARNING';
      if (filter === 'Info') return n.severity === 'INFO';
      return true;
    });
  }, [notifications, filter]);

  const handleLogout = () => {
    localStorage.removeItem('suvas_user_role');
    navigate('/login');
  };

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    markNotificationAsRead(notif.id);
    
    if (notif.relatedGrievanceId) {
      const g = grievances.find(x => x.id === notif.relatedGrievanceId);
      if (g) setSelectedGrievance(g);
    } else if (notif.relatedAdminId) {
      const a = admins.find(x => x.id === notif.relatedAdminId);
      if (a) {
        // Derive stats to pass into drawer
        const adminGrievances = grievances.filter(g => g.assignedAdminId === a.id && g.status !== 'Resolved');
        const resolved = grievances.filter(g => g.assignedAdminId === a.id && g.status === 'Resolved').length;
        const pending = adminGrievances.length;
        const overdue = adminGrievances.filter(g => g.dueAt ? new Date(g.dueAt) < new Date() : g.sla.toLowerCase().includes('overdue')).length;
        
        let workload: 'LOW' | 'MEDIUM' | 'HIGH' | 'OVERLOADED' = 'LOW';
        if (pending >= 30) workload = 'OVERLOADED';
        else if (pending >= 15) workload = 'HIGH';
        else if (pending >= 5) workload = 'MEDIUM';
        
        const totalAssigned = resolved + pending;
        const slaCompliance = totalAssigned > 0 ? ((totalAssigned - overdue) / totalAssigned) * 100 : 100;
        
        let performance: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical' = 'Excellent';
        if (slaCompliance < 70 || overdue > 3) performance = 'Critical';
        else if (slaCompliance < 85 || overdue > 0) performance = 'Needs Attention';
        else if (slaCompliance < 95) performance = 'Good';

        setSelectedAdminStats({
          admin: a,
          assigned: totalAssigned,
          pending: pending,
          resolved: resolved,
          overdue: overdue,
          escalated: adminGrievances.filter(g => g.escalated).length,
          slaCompliance,
          workload,
          performance,
          activeGrievances: adminGrievances
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050B14] flex">
      <SuperAdminSidebar onLogout={handleLogout} />
      
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <SuperAdminHeader />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Notification Center</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Operational alerts and system attention events.</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => markAllNotificationsAsRead(notifications.map(n => n.id))}
                  className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <Check size={16} /> Mark all read
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
              
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 flex items-center gap-4 overflow-x-auto">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mr-2 shrink-0">
                  <Filter size={16} /> Filter:
                </div>
                {['All', 'Unread', 'Critical', 'Warning', 'Info'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      filter === f 
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' 
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-500 dark:text-gray-400">
                    <ShieldAlert size={48} className="text-gray-300 dark:text-gray-700 mb-4 opacity-50" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white">You're all caught up.</p>
                    <p className="mt-2 text-sm">No operational issues require your attention.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredNotifications.map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-5 cursor-pointer transition-colors group flex gap-4 ${
                          !notif.read 
                            ? 'bg-blue-50/30 dark:bg-blue-900/10 hover:bg-blue-50/50 dark:hover:bg-blue-900/20' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <div className={`mt-1 shrink-0 ${
                          notif.severity === 'CRITICAL' ? 'text-red-500' :
                          notif.severity === 'WARNING' ? 'text-orange-500' :
                          'text-blue-500'
                        }`}>
                          {notif.severity === 'CRITICAL' ? <ShieldAlert size={24} /> :
                           notif.severity === 'WARNING' ? <AlertTriangle size={24} /> :
                           <Info size={24} />}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-4 mb-1">
                            <h3 className={`font-semibold ${!notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                              {notif.title}
                            </h3>
                            <span className="text-xs font-medium text-gray-400 shrink-0">
                              {new Date(notif.timestamp).toLocaleString()}
                            </span>
                          </div>
                          
                          <p className={`text-sm mb-3 ${!notif.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                            {notif.message}
                          </p>

                          <div className="flex flex-wrap gap-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                               notif.severity === 'CRITICAL' ? 'bg-red-50 text-red-700 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 dark:text-red-400' :
                               notif.severity === 'WARNING' ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30 dark:text-orange-400' :
                               'bg-blue-50 text-blue-700 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30 dark:text-blue-400'
                            }`}>
                              {notif.type.replace(/_/g, ' ')}
                            </span>
                            
                            {notif.relatedGrievanceId && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700 uppercase tracking-wider">
                                GRV: {notif.relatedGrievanceId}
                              </span>
                            )}
                            
                            {notif.relatedAdminId && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700 uppercase tracking-wider">
                                ADMIN: {notif.relatedAdminId}
                              </span>
                            )}
                          </div>
                        </div>

                        {!notif.read && (
                          <div className="flex items-center justify-center shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Reused existing Modals */}
            {selectedGrievance && (
              <SuperAdminGrievanceDetails 
                grievance={selectedGrievance} 
                onClose={() => setSelectedGrievance(null)} 
              />
            )}

            {selectedAdminStats && (
              <AdminDetailDrawer 
                stats={selectedAdminStats}
                grievances={selectedAdminStats.activeGrievances || []}
                onSelectGrievance={(g) => setSelectedGrievance(g)}
                onClose={() => setSelectedAdminStats(null)} 
              />
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
