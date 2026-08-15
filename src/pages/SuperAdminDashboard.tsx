import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { FileText, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

import { SuperAdminSidebar } from '../components/superadmin/SuperAdminSidebar';
import { SuperAdminHeader } from '../components/superadmin/SuperAdminHeader';
import { KpiCard } from '../components/superadmin/KpiCard';
import { AttentionPanel } from '../components/superadmin/AttentionPanel';
import { RecentGrievances } from '../components/superadmin/RecentGrievances';
import { AdminPerformance } from '../components/superadmin/AdminPerformance';
import { IndiaGrievanceMap } from '../components/superadmin/IndiaGrievanceMap';
import { getSLAStatus } from '../lib/slaUtils';

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { grievances, admins } = useStore();

  const handleLogout = () => {
    localStorage.removeItem('suvas_user_role');
    navigate('/login');
  };

  // KPI Calculations
  const totalGrievances = grievances.length;
  const resolvedGrievances = grievances.filter(g => g.status === 'Resolved').length;
  const activeGrievances = totalGrievances - resolvedGrievances;
  
  const overdueGrievances = grievances.filter(g => {
    if (g.status === 'Resolved') return false;
    return getSLAStatus(g) === 'Overdue';
  }).length;

  const totalAdmins = admins.length;
  const activeAdmins = admins.filter(a => a.status === 'Active').length;
  const escalatedGrievances = grievances.filter(g => g.escalated && g.status !== 'Resolved').length;
  const pendingGrievances = activeGrievances; // Same as active

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050B14] flex">
      <SuperAdminSidebar onLogout={handleLogout} />
      
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <SuperAdminHeader />
        
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Main KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KpiCard 
              title="Total Grievances" 
              value={totalGrievances} 
              icon={FileText} 
              colorClass="text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30"
            />
            <KpiCard 
              title="Active / In Progress" 
              value={activeGrievances} 
              icon={Clock} 
              colorClass="text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30"
            />
            <KpiCard 
              title="Resolved" 
              value={resolvedGrievances} 
              icon={CheckCircle2} 
              colorClass="text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
            />
            <KpiCard 
              title="Overdue" 
              value={overdueGrievances} 
              icon={AlertTriangle} 
              colorClass="text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30"
            />
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalAdmins}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Total Admins</span>
            </div>
            <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">{activeAdmins}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Active Admins</span>
            </div>
            <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{pendingGrievances}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Pending Grievances</span>
            </div>
            <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">{escalatedGrievances}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Escalated Grievances</span>
            </div>
          </div>

          {/* Map Placeholder & Attention Required */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <IndiaGrievanceMap />
            </div>
            <div className="lg:col-span-1 h-[400px] lg:h-auto">
              <AttentionPanel grievances={grievances} />
            </div>
          </div>

          {/* Bottom Section: Recent & Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <RecentGrievances grievances={grievances} />
            </div>
            <div>
              <AdminPerformance admins={admins} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
