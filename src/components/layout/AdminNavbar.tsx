import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Moon, Sun, Globe, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import type { AdminAccount } from '../../lib/adminConfig';

export function AdminNavbar() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark') || 
           localStorage.getItem('theme') === 'dark';
  });

  const [loggedInAdmin] = useState<AdminAccount | null>(() => {
    const saved = localStorage.getItem('loggedInAdmin');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  const handleLogout = () => {
    localStorage.removeItem('loggedInAdmin');
    localStorage.removeItem('suvas_user_role');
    navigate('/login');
  };

  const isDM = loggedInAdmin?.id === '55555';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 dark:bg-[#0F1620]/90 backdrop-blur-md shadow-sm py-3'
          : 'bg-white/70 dark:bg-[#0F1620]/70 backdrop-blur-md py-4 border-b border-gray-200/80 dark:border-gray-800'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center shadow-md">
            <Shield size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-xl leading-tight text-gray-900 dark:text-white">
                Nagrik Setu
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                {isDM ? 'District Magistrate' : 'Admin Portal'}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
              {loggedInAdmin ? `${loggedInAdmin.department} • Govt. of India` : 'Department Grievance Redressal'}
            </p>
          </div>
        </div>

        {/* Right Actions (Theme, Language, Admin Profile, Logout) */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" title="Toggle Language" className="text-gray-500 dark:text-gray-400">
            <Globe size={18} />
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleDark} title="Toggle Theme" className="text-gray-500 dark:text-gray-400">
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </Button>

          {loggedInAdmin && (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-800">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                {isDM ? 'DM' : 'AD'}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                  {loggedInAdmin.department}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {loggedInAdmin.role} (ID: {loggedInAdmin.id})
                </p>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30 text-xs ml-1"
          >
            <LogOut size={14} className="mr-1.5" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
