import { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, ShieldAlert, Info, Check, ExternalLink } from 'lucide-react';
import { useStore } from '../../lib/store';
import { deriveNotifications } from '../../lib/superAdminAlerts';
import { Link, useNavigate } from 'react-router-dom';

export function SuperAdminHeader() {
  const navigate = useNavigate();
  const { grievances, admins, escalations, readNotificationIds, markNotificationAsRead, markAllNotificationsAsRead } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    
    // Simple routing logic.
    // If it's grievance-related, the full notifications page handles opening the modal.
    // For now, redirecting to the notifications page is simplest, or if the user is already there, it could open.
    // Let's route to the full notifications page which will handle deep-linking if implemented, 
    // or just let them manage it there.
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
      
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
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
                            <h4 className={`text-sm font-semibold mb-0.5 ${!notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                              {notif.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-gray-400 mt-2 block font-medium">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0F1620]">
                <Link 
                  to="/super-admin/notifications"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-1.5 text-xs font-bold text-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center gap-1 transition-colors"
                >
                  View all notifications <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
