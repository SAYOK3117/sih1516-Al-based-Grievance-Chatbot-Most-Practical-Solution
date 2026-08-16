import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, FileText, Users, AlertTriangle, TrendingUp, LogOut, Shield } from 'lucide-react';
import { Button } from '../ui/Button';

export function SuperAdminSidebar({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/super-admin' },
    { icon: Map, label: 'India Map', path: '/super-admin/map' },
    { icon: FileText, label: 'Grievances', path: '/super-admin/grievances' },
    { icon: Users, label: 'Admins', path: '/super-admin/admins' },
    { icon: AlertTriangle, label: 'Escalations', path: '/super-admin/escalations' },
    { icon: TrendingUp, label: 'Analytics', path: '/super-admin/analytics' },
  ];

  return (
    <div className="w-64 h-screen bg-white dark:bg-[#0F1620] border-r border-gray-200 dark:border-gray-800 flex flex-col fixed left-0 top-0 z-10">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-lg shrink-0">
          <Shield size={24} />
        </div>
        <span className="font-bold text-xl text-gray-900 dark:text-white truncate">Nagrik Setu</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                isActive
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-white'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-400 font-bold text-sm shrink-0">
            SA
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">Super Admin</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Command Center</p>
          </div>
        </div>

        <Button variant="outline" onClick={onLogout} className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20">
          <LogOut size={18} className="mr-2" /> Logout
        </Button>
      </div>
    </div>
  );
}
