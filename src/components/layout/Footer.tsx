import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white dark:bg-[#0b1018] border-t border-gray-200 dark:border-gray-800 pt-12 pb-24 md:pb-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 group mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
                <Shield size={18} />
              </div>
              <div>
                <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                  Nagrik Setu
                </h2>
              </div>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-6">
              A unified AI-powered Citizen Grievance Redressal Platform ensuring fast, transparent, and effective resolution of civic issues.
            </p>
            <div className="flex items-center space-x-4 text-sm font-medium">
              <span className="text-gray-900 dark:text-gray-200">Helpline: <span className="text-primary dark:text-blue-400">1800-11-2233</span></span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link to="/file-grievance" className="text-gray-500 hover:text-primary dark:text-gray-400 text-sm transition-colors">File a Complaint</Link></li>
              <li><Link to="/track" className="text-gray-500 hover:text-primary dark:text-gray-400 text-sm transition-colors">Track Status</Link></li>
              <li><Link to="/transparency" className="text-gray-500 hover:text-primary dark:text-gray-400 text-sm transition-colors">Transparency Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-500 hover:text-primary dark:text-gray-400 text-sm transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-500 hover:text-primary dark:text-gray-400 text-sm transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-gray-500 hover:text-primary dark:text-gray-400 text-sm transition-colors">Accessibility Statement</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 text-center md:text-left flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            © {new Date().getFullYear()} Nagrik Setu, Government of India. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
