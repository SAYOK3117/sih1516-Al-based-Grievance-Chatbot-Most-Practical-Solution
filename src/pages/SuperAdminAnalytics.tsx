import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { SuperAdminSidebar } from '../components/superadmin/SuperAdminSidebar';
import { SuperAdminHeader } from '../components/superadmin/SuperAdminHeader';
import { NationalAnalyticsKpi } from '../components/superadmin/analytics/NationalAnalyticsKpi';
import { StateAnalytics } from '../components/superadmin/analytics/StateAnalytics';
import { DepartmentAnalytics } from '../components/superadmin/analytics/DepartmentAnalytics';
import { GrievanceTrend } from '../components/superadmin/analytics/GrievanceTrend';
import { PriorityStatusDistribution } from '../components/superadmin/analytics/PriorityStatusDistribution';
import { NationalInsights } from '../components/superadmin/analytics/NationalInsights';

export function SuperAdminAnalytics() {
  const navigate = useNavigate();
  const { grievances, admins } = useStore();

  const handleLogout = () => {
    localStorage.removeItem('suvas_user_role');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050B14] flex">
      <SuperAdminSidebar onLogout={handleLogout} />
      
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <SuperAdminHeader />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">National Analytics</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Comprehensive operational intelligence and grievance reporting.</p>
              </div>
            </div>

            {/* TOP: National KPIs */}
            <NationalAnalyticsKpi grievances={grievances} />

            {/* MIDDLE: State & Dept Tables */}
            <StateAnalytics grievances={grievances} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DepartmentAnalytics grievances={grievances} />
              <PriorityStatusDistribution grievances={grievances} />
            </div>

            {/* LOWER: Trend */}
            <div className="grid grid-cols-1 gap-6">
              <GrievanceTrend grievances={grievances} />
            </div>

            {/* BOTTOM: Insights */}
            <NationalInsights grievances={grievances} admins={admins} />

          </div>
        </main>
      </div>
    </div>
  );
}
