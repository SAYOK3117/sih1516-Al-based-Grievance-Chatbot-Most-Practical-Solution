import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Search, Clock, Building2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { useStore } from '../lib/store';

export function CitizenDashboard() {
  const { grievances } = useStore();
  const [activeTab, setActiveTab] = useState('All');

  const filteredGrievances = grievances.filter(g => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Filed') return g.status === 'Filed';
    if (activeTab === 'In Progress') return g.status === 'In Progress';
    if (activeTab === 'Resolved') return g.status === 'Resolved';
    return true;
  });

  const stats = [
    { label: 'Total Filed', value: grievances.length.toString() },
    { label: 'In Progress', value: grievances.filter(g => g.status === 'In Progress').length.toString() },
    { label: 'Resolved', value: grievances.filter(g => g.status === 'Resolved').length.toString() },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved': return <Badge variant="success">Resolved</Badge>;
      case 'In Progress': return <Badge variant="warning">In Progress</Badge>;
      default: return <Badge variant="primary">{status}</Badge>;
    }
  };

  return (
    <div className="pt-24 pb-24 md:pb-12 container mx-auto px-4 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Grievances</h1>
          <p className="text-gray-500 dark:text-gray-400">Track and manage all your filed complaints.</p>
        </div>
        <Link to="/file-grievance">
          <Button>File New Grievance</Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-white dark:bg-surface-dark border-none shadow-sm">
            <CardContent className="p-4 md:p-6 flex flex-col items-center justify-center text-center h-full">
              <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
              <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          {['All', 'Filed', 'In Progress', 'Resolved'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-surface-dark dark:text-gray-400 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="flex space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input type="text" placeholder="Search by ID or title..." className="pl-10" />
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter size={18} />
          </Button>
        </div>
      </div>

      {/* Grievance List */}
      <div className="space-y-4">
        {filteredGrievances.map((g) => (
          <Link key={g.id} to={`/track?id=${g.id}`} className="block group">
            <Card className="hover:border-primary/30 dark:hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between md:justify-start gap-3">
                      <span className="font-mono text-sm font-semibold text-primary dark:text-blue-400">{g.id}</span>
                      {getStatusBadge(g.status)}
                    </div>
                    
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                      {g.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Building2 size={14} className="mr-1.5" /> {g.dept}
                      </div>
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1.5" /> {g.date}
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:flex flex-col items-end space-y-3">
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                  
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
