import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Moon, Sun, Globe, User } from 'lucide-react';
import { Button } from '../ui/Button';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simple toggle for dark mode (adds class to html tag)
  const toggleDark = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      setIsDark(true);
    }
  };

  const role = localStorage.getItem('suvas_user_role');

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'File Complaint', path: '/file-grievance' },
    ...(role === 'citizen' ? [{ name: 'My Dashboard', path: '/dashboard' }] : []),
    { name: 'Track Status', path: '/track' },
    { name: 'Transparency', path: '/transparency' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 dark:bg-[#0F1620]/80 backdrop-blur-md shadow-sm py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center group-hover:scale-105 transition-transform">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-tight text-gray-900 dark:text-white">
              Nagrik Setu
            </h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
              Govt. of India
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === link.path
                  ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" title="Toggle Language">
            <Globe size={20} />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleDark} title="Toggle Theme">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
          <div className="hidden md:block">
            {role ? (
              <Link to="/login">
                <Button variant="outline" size="sm" className="ml-2" onClick={() => {
                  localStorage.removeItem('suvas_user_role');
                  localStorage.removeItem('loggedInAdmin');
                }}>
                  <User size={16} className="mr-2" />
                  Logout
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="ml-2">
                  <User size={16} className="mr-2" />
                  Login / Admin
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
