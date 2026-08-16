import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, type Grievance, type Admin } from '../lib/store';
import { FileText, Clock, CheckCircle2, AlertTriangle, Users, ShieldAlert } from 'lucide-react';

import { SuperAdminSidebar } from '../components/superadmin/SuperAdminSidebar';
import { SuperAdminHeader } from '../components/superadmin/SuperAdminHeader';
import { KpiCard } from '../components/superadmin/KpiCard';
import { AttentionPanel } from '../components/superadmin/AttentionPanel';
import { RecentGrievances } from '../components/superadmin/RecentGrievances';
import { AdminPerformance } from '../components/superadmin/AdminPerformance';
import { IndiaGrievanceMap } from '../components/superadmin/IndiaGrievanceMap';
import { KpiGrievanceDrawer, type KpiFilterType } from '../components/superadmin/KpiGrievanceDrawer';
import { SuperAdminGrievanceDetails } from '../components/superadmin/SuperAdminGrievanceDetails';
import { AdminDetailDrawer, type AdminDerivedStats } from '../components/superadmin/AdminDetailDrawer';
import { getSLAStatus } from '../lib/slaUtils';

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { grievances, admins } = useStore();

  const [selectedKpi, setSelectedKpi] = useState<KpiFilterType | null>(null);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

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
  const pendingGrievances = activeGrievances;

  // Selected Admin Stats calculation for AdminDetailDrawer
  const selectedAdminStats: AdminDerivedStats | null = useMemo(() => {
    if (!selectedAdmin) return null;

    const assignedGrievances = grievances.filter(g => g.assignedAdminId === selectedAdmin.id);
    const assigned = assignedGrievances.length;
    const resolved = assignedGrievances.filter(g => g.status === 'Resolved').length;
    const pending = assigned - resolved;
    const overdue = assignedGrievances.filter(g => g.status !== 'Resolved' && getSLAStatus(g) === 'Overdue').length;
    const escalated = assignedGrievances.filter(g => g.escalated && g.status !== 'Resolved').length;
    const slaCompliance = assigned > 0 ? ((assigned - overdue) / assigned) * 100 : 100;

    let workload: 'LOW' | 'MEDIUM' | 'HIGH' | 'OVERLOADED' = 'LOW';
    if (pending > 15) workload = 'OVERLOADED';
    else if (pending > 10) workload = 'HIGH';
    else if (pending > 5) workload = 'MEDIUM';

    let performance: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical' = 'Excellent';
    if (overdue > 3 || slaCompliance < 60) performance = 'Critical';
    else if (overdue > 0 || slaCompliance < 80) performance = 'Needs Attention';
    else if (slaCompliance < 95) performance = 'Good';

    return {
      admin: selectedAdmin,
      assigned,
      pending,
      resolved,
      overdue,
      escalated,
      slaCompliance,
      workload,
      performance,
      activeGrievances: assignedGrievances.filter(g => g.status !== 'Resolved')
    };
  }, [selectedAdmin, grievances]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050B14] flex">
      <SuperAdminSidebar onLogout={handleLogout} />
      
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <SuperAdminHeader />
        
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Main KPIs - Clickable with side panel drawer */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KpiCard 
              title="Total Grievances" 
              value={totalGrievances} 
              icon={FileText} 
              colorClass="text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30"
              onClick={() => setSelectedKpi('all')}
            />
            <KpiCard 
              title="Active / In Progress" 
              value={activeGrievances} 
              icon={Clock} 
              colorClass="text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30"
              onClick={() => setSelectedKpi('active')}
            />
            <KpiCard 
              title="Resolved" 
              value={resolvedGrievances} 
              icon={CheckCircle2} 
              colorClass="text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
              onClick={() => setSelectedKpi('resolved')}
            />
            <KpiCard 
              title="Overdue" 
              value={overdueGrievances} 
              icon={AlertTriangle} 
              colorClass="text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30"
              onClick={() => setSelectedKpi('overdue')}
            />
          </div>

          {/* Secondary KPIs - Also clickable */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <button 
              onClick={() => setSelectedKpi('total_admins')}
              className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center hover:border-purple-300 dark:hover:border-purple-700/60 hover:shadow-md transition-all group"
            >
              <span className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{totalAdmins}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 flex items-center gap-1">
                <Users size={12} className="text-gray-400" /> Total Admins
              </span>
            </button>

            <button 
              onClick={() => setSelectedKpi('active_admins')}
              className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center hover:border-green-300 dark:hover:border-green-700/60 hover:shadow-md transition-all group"
            >
              <span className="text-2xl font-bold text-green-600 dark:text-green-400 group-hover:scale-105 transition-transform">{activeAdmins}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Active Admins</span>
            </button>

            <button 
              onClick={() => setSelectedKpi('active')}
              className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center hover:border-purple-300 dark:hover:border-purple-700/60 hover:shadow-md transition-all group"
            >
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">{pendingGrievances}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Pending Grievances</span>
            </button>

            <button 
              onClick={() => setSelectedKpi('escalated')}
              className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center hover:border-orange-300 dark:hover:border-orange-700/60 hover:shadow-md transition-all group"
            >
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-400 group-hover:scale-105 transition-transform">{escalatedGrievances}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 flex items-center gap-1">
                <ShieldAlert size={12} className="text-orange-500" /> Escalated Grievances
              </span>
            </button>
          </div>

          {/* Map & Attention Required */}
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
              <AdminPerformance 
                admins={admins} 
                onSelectAdmin={(a) => setSelectedAdmin(a)} 
              />
            </div>
          </div>
        </main>
      </div>

      {/* KPI Grievance / Admin Side Drawer */}
      {selectedKpi && (
        <KpiGrievanceDrawer
          type={selectedKpi}
          onClose={() => setSelectedKpi(null)}
          onSelectGrievance={(g) => setSelectedGrievance(g)}
          onSelectAdmin={(a) => setSelectedAdmin(a)}
          grievances={grievances}
          admins={admins}
        />
      )}

      {/* Full Grievance Detail Drawer */}
      {selectedGrievance && (
        <SuperAdminGrievanceDetails
          grievance={selectedGrievance}
          onClose={() => setSelectedGrievance(null)}
        />
      )}

      {/* Full Admin Detail Drawer */}
      {selectedAdminStats && (
        <AdminDetailDrawer
          stats={selectedAdminStats}
          grievances={grievances}
          onClose={() => setSelectedAdmin(null)}
          onSelectGrievance={(g) => setSelectedGrievance(g)}
        />
      )}
    </div>
  );
}
