import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Search, User } from 'lucide-react';

export function MobileTabNav() {
  const location = useLocation();

  const tabs = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'File', path: '/file-grievance', icon: PlusCircle },
    { name: 'Track', path: '/track', icon: Search },
    { name: 'Profile', path: '/login', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1A2332] border-t border-gray-200 dark:border-gray-800 z-50 px-2 pb-safe">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;

          return (
            <Link
              key={tab.name}
              to={tab.path}
              className={`flex flex-col items-center justify-center w-16 h-full space-y-1 ${
                isActive
                  ? 'text-primary dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
