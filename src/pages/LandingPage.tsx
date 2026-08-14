import { ArrowRight, CheckCircle2, Clock, MapPin, Search, Shield, Zap, Activity, ThumbsUp, Building2, Droplets, Lightbulb, HardHat, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export function LandingPage() {
  const stats = [
    { label: 'Grievances Resolved', value: '2.4M+', icon: CheckCircle2, color: 'text-accent dark:text-emerald-400' },
    { label: 'Avg Resolution Time', value: '4.2 Days', icon: Clock, color: 'text-primary dark:text-blue-400' },
    { label: 'Active Departments', value: '45+', icon: Building2, color: 'text-warning dark:text-amber-400' },
    { label: 'Citizen Satisfaction', value: '92%', icon: ThumbsUp, color: 'text-accent dark:text-emerald-400' },
  ];

  const steps = [
    { title: 'File', desc: 'Submit your issue with photos/location.', icon: FileText },
    { title: 'AI Routes', desc: 'Smart AI sends it to the right officer.', icon: Zap },
    { title: 'Action Taken', desc: 'Officer resolves the issue within SLA.', icon: Activity },
    { title: 'Notified', desc: 'You get updates and rate the service.', icon: Shield },
  ];

  const departments = [
    { name: 'Water & Sanitation', icon: Droplets, count: '12k open' },
    { name: 'Electricity Board', icon: Lightbulb, count: '8k open' },
    { name: 'Roads & Traffic', icon: MapPin, count: '15k open' },
    { name: 'Municipal Corp', icon: Building2, count: '22k open' },
    { name: 'Police & Security', icon: Shield, count: '5k open' },
    { name: 'Public Works', icon: HardHat, count: '9k open' },
  ];

  return (
    <div className="pt-24 pb-20 md:pt-32 space-y-24">
      {/* Hero Section */}
      <section className="container mx-auto px-4 md:px-6 text-center max-w-4xl">
        <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium mb-6 animate-slide-in">
          <Zap size={16} />
          <span>AI-Powered Issue Resolution</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-6 animate-slide-in" style={{ animationDelay: '100ms' }}>
          Your Voice, <span className="text-primary dark:text-blue-400">Tracked to Resolution</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto animate-slide-in" style={{ animationDelay: '200ms' }}>
          A unified, transparent platform to report civic issues, track progress in real-time, and hold departments accountable.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 animate-slide-in" style={{ animationDelay: '300ms' }}>
          <Link to="/file-grievance" className="w-full sm:w-auto">
            <Button size="lg" className="w-full">
              File a Grievance
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
          <Link to="/track" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full bg-white dark:bg-transparent">
              <Search size={18} className="mr-2" />
              Track Existing Complaint
            </Button>
          </Link>
        </div>
      </section>

      {/* Live Stats */}
      <section className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="animate-slide-in" style={{ animationDelay: `${400 + i * 100}ms` }}>
              <CardContent className="p-6 text-center">
                <div className={`mx-auto w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4 ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white dark:bg-[#151c27] py-20 border-y border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How it Works</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Our AI ensures your complaint reaches the right desk instantly, eliminating bureaucratic delays.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0"></div>
            
            {steps.map((step, i) => (
              <div key={i} className="relative z-10 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                  <step.icon size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Departments</h2>
            <p className="text-gray-500 dark:text-gray-400">Select a category to view or file specific issues.</p>
          </div>
          <Link to="/departments" className="hidden sm:flex text-primary dark:text-blue-400 font-medium items-center hover:underline">
            View All <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {departments.map((dept, i) => (
            <Card key={i} className="hover:border-primary/50 dark:hover:border-primary/50 cursor-pointer group">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <dept.icon size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">{dept.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{dept.count}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
