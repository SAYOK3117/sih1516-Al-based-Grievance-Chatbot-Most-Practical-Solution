import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { getSLAStatus } from '../lib/slaUtils';
import { SuperAdminSidebar } from '../components/superadmin/SuperAdminSidebar';
import { SuperAdminHeader } from '../components/superadmin/SuperAdminHeader';
import { IndiaGrievanceMap } from '../components/superadmin/IndiaGrievanceMap';
import { FileText, Clock, CheckCircle2, Activity } from 'lucide-react';
import { KpiCard } from '../components/superadmin/KpiCard';

export function SuperAdminIndiaMap() {
  const navigate = useNavigate();
  const { grievances } = useStore();

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F1620] flex">
      <SuperAdminSidebar onLogout={handleLogout} />
      
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <SuperAdminHeader />
        
        <main className="flex-1 p-8 pt-24 max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">INDIA MAP</h1>
            <p className="text-gray-500 dark:text-gray-400">National Grievance Distribution</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <KpiCard 
              title="Total" 
              value={totalGrievances} 
              icon={FileText} 
              colorClass="text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30"
            />
            <KpiCard 
              title="Active" 
              value={activeGrievances} 
              icon={Activity} 
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
              icon={Clock} 
              colorClass="text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30"
            />
          </div>

          <IndiaGrievanceMap />
        </main>
      </div>
    </div>
  );
}
