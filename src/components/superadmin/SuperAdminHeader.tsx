import { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, ShieldAlert, Info, Check, Sun, Moon } from 'lucide-react';
import { useStore } from '../../lib/store';
import { deriveNotifications } from '../../lib/superAdminAlerts';
import { useNavigate } from 'react-router-dom';

export function SuperAdminHeader() {
  const navigate = useNavigate();
  const { grievances, admins, escalations, readNotificationIds, markNotificationAsRead, markAllNotificationsAsRead } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dark mode state
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark') || 
           localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    setIsDark(isDarkMode);
    if (isDarkMode && !document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDark = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const notifications = deriveNotifications(grievances, admins, escalations, readNotificationIds);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    markNotificationAsRead(notif.id);
    setIsOpen(false);
    navigate('/super-admin/notifications');
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllNotificationsAsRead(notifications.map(n => n.id));
  };

  return (
    <header className="h-20 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F1620] flex items-center justify-between px-8 sticky top-0 z-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">National Grievance Command Center</h1>
        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mt-1">Super Admin • Nationwide Monitoring & Control</p>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDark}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
          className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors flex items-center justify-center"
        >
          {isDark ? (
            <Sun size={20} className="text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon size={20} className="text-gray-600 dark:text-gray-300 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Notifications"
            className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors relative"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white dark:border-[#0F1620] px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 max-h-[32rem] bg-white dark:bg-[#141C27] rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col z-50 animate-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-[#0F1620]">
                <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1"
                  >
                    <Check size={14} /> Mark all read
                  </button>
                )}
              </div>
              
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>You're all caught up.</p>
                    <p className="text-xs mt-1">No critical operational issues require your attention.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {notifications.slice(0, 5).map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                      >
                        <div className="flex gap-3">
                          <div className={`mt-0.5 ${
                            notif.severity === 'CRITICAL' ? 'text-red-500' :
                            notif.severity === 'WARNING' ? 'text-orange-500' :
                            'text-blue-500'
                          }`}>
                            {notif.severity === 'CRITICAL' ? <ShieldAlert size={16} /> :
                             notif.severity === 'WARNING' ? <AlertTriangle size={16} /> :
                             <Info size={16} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-gray-900 dark:text-white">{notif.title}</p>
                              <span className="text-[10px] text-gray-400">
                                {notif.timestamp.includes('T') ? new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : notif.timestamp}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0F1620] text-center">
                <button 
                  onClick={() => { setIsOpen(false); navigate('/super-admin/notifications'); }}
                  className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  View all operational alerts →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
