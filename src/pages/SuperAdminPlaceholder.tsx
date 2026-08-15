import { SuperAdminSidebar } from '../components/superadmin/SuperAdminSidebar';
import { SuperAdminHeader } from '../components/superadmin/SuperAdminHeader';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Hammer } from 'lucide-react';

export function SuperAdminPlaceholder() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    localStorage.removeItem('suvas_user_role');
    navigate('/login');
  };

  const pageName = location.pathname.split('/').pop()?.replace('-', ' ') || 'Module';
  const formattedTitle = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050B14] flex">
      <SuperAdminSidebar onLogout={handleLogout} />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <SuperAdminHeader />
        <main className="flex-1 p-8">
          <Card className="border-dashed border-2 border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-900/10">
            <CardContent className="flex flex-col items-center justify-center p-20 text-center">
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Hammer size={40} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{formattedTitle} Module</h2>
              <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md">
                Module coming in next implementation phase. This section is reserved for future expansion.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
