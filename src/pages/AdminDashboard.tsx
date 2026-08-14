import { useState } from 'react';
import { Filter, Search, Clock, CheckCircle2, AlertCircle, TrendingUp, Users, X, Bot, MapPin, Send } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { useStore } from '../lib/store';

export function AdminDashboard() {
  const { grievances, updateGrievanceStatus, addMessage } = useStore();
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');

  const selectedComplaint = grievances.find(g => g.id === selectedComplaintId);

  const kpis = [
    { label: 'Open Complaints', value: grievances.filter(g => g.status !== 'Resolved').length.toString(), icon: AlertCircle, color: 'text-blue-500' },
    { label: 'Overdue SLA', value: '12', icon: Clock, color: 'text-alert' },
    { label: 'Resolved Today', value: grievances.filter(g => g.status === 'Resolved').length.toString(), icon: CheckCircle2, color: 'text-accent' },
    { label: 'Avg Resolution Time', value: '3.2 days', icon: TrendingUp, color: 'text-primary' },
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High': return <Badge variant="alert">High Priority</Badge>;
      case 'Medium': return <Badge variant="warning">Medium</Badge>;
      default: return <Badge variant="default">Low</Badge>;
    }
  };

  return (
    <div className="pt-24 pb-12 container mx-auto px-4 max-w-7xl flex flex-col md:flex-row h-screen">
      
      {/* Sidebar Filters (Hidden on Mobile) */}
      <div className="hidden md:block w-64 pr-6 border-r border-gray-200 dark:border-gray-800 space-y-6 overflow-y-auto h-full">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Officer Portal</h2>
          <div className="space-y-1">
            <button className="w-full text-left px-3 py-2 bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-400 rounded-lg font-medium text-sm transition-colors">
              <Users size={16} className="inline mr-2 mb-0.5" /> All Complaints
            </button>
            <button className="w-full text-left px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium text-sm transition-colors">
              <Clock size={16} className="inline mr-2 mb-0.5" /> Overdue SLAs
            </button>
            <button className="w-full text-left px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium text-sm transition-colors">
              <CheckCircle2 size={16} className="inline mr-2 mb-0.5" /> Resolved
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Priority</h3>
          <div className="space-y-2">
            {['High', 'Medium', 'Low'].map((p) => (
              <label key={p} className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" className="rounded text-primary focus:ring-primary border-gray-300 dark:border-gray-700 bg-transparent" />
                <span>{p}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${selectedComplaint ? 'hidden md:flex md:w-1/2 lg:w-2/3 md:pl-6' : 'md:pl-6'} h-full overflow-hidden`}>
        
        {/* Top KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
          {kpis.map((kpi, i) => (
            <Card key={i} className="bg-white dark:bg-surface-dark border-none shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{kpi.label}</div>
                </div>
                <div className={`w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon size={16} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search & List */}
        <div className="flex space-x-2 mb-4 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input type="text" placeholder="Search ID, keyword, or citizen..." className="pl-10" />
          </div>
          <Button variant="outline" size="icon" className="md:hidden">
            <Filter size={18} />
          </Button>
        </div>

        {/* Table/List */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-20 md:pb-0">
          {grievances.map((c) => (
            <Card 
              key={c.id} 
              className={`cursor-pointer transition-colors ${selectedComplaint?.id === c.id ? 'border-primary shadow-md dark:border-blue-500' : 'hover:border-gray-300 dark:hover:border-gray-700'}`}
              onClick={() => setSelectedComplaintId(c.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-primary dark:text-blue-400">{c.id}</span>
                    {getPriorityBadge(c.priority)}
                  </div>
                  <span className={`text-xs font-semibold ${c.slaColor}`}>{c.sla}</span>
                </div>
                
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-1">{c.title}</h3>
                
                <div className="flex items-start gap-2 bg-gray-50 dark:bg-[#1A2332] p-2 rounded text-xs text-gray-600 dark:text-gray-400 mb-3 border border-gray-100 dark:border-gray-800">
                  <Bot size={14} className="text-primary mt-0.5 shrink-0" />
                  <p className="line-clamp-1">{c.aiSummary}</p>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-500">
                  <span>{c.citizen}</span>
                  <span>{c.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Slide-in Details Panel */}
      {selectedComplaint && (
        <div className="fixed md:static inset-0 z-50 md:z-auto bg-white dark:bg-[#0F1620] md:bg-transparent flex flex-col md:w-1/2 lg:w-1/3 md:ml-6 md:border-l border-gray-200 dark:border-gray-800 md:pl-6 h-full overflow-hidden animate-slide-in">
          
          <div className="flex items-center justify-between p-4 md:p-0 mb-4 shrink-0 border-b border-gray-100 dark:border-gray-800 md:border-none">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Complaint Details</h3>
            <button onClick={() => setSelectedComplaintId(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              <X size={18} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 px-4 md:px-0 pb-20 md:pb-0">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-sm font-semibold text-primary dark:text-blue-400">{selectedComplaint.id}</span>
                <Badge variant={selectedComplaint.status === 'In Progress' ? 'warning' : 'primary'}>{selectedComplaint.status}</Badge>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{selectedComplaint.title}</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Citizen</p>
                  <p className="font-medium text-gray-900 dark:text-gray-200">{selectedComplaint.citizen}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Filed On</p>
                  <p className="font-medium text-gray-900 dark:text-gray-200">Oct 24, 2023, 10:30 AM</p>
                </div>
                <div className="col-span-2 flex items-start">
                  <MapPin size={16} className="text-gray-400 mt-0.5 mr-2 shrink-0" />
                  <p className="text-gray-900 dark:text-gray-200">{selectedComplaint.location}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2 mb-2">
                <Bot size={18} className="text-primary" />
                <h4 className="font-semibold text-sm text-primary dark:text-blue-300">AI Intelligence Summary</h4>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                {selectedComplaint.aiSummary} Based on historical data, similar issues require Jetting Machine dispatch.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="alert">Priority: {selectedComplaint.priority}</Badge>
                <Badge variant="outline">Health Hazard</Badge>
                <Badge variant="outline">Traffic Disruption</Badge>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Attached Evidence</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-500">Photo.jpg</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center">
                <Bot size={16} className="mr-2 text-primary" /> AI Drafted Response / Send Message
              </h4>
              <Textarea 
                className="mb-3 text-sm h-24"
                placeholder="Type a message to the citizen..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  size="sm"
                  onClick={() => {
                    if (messageText.trim()) {
                      addMessage(selectedComplaint.id, {
                        id: Math.random().toString(),
                        sender: 'Admin',
                        text: messageText,
                        timestamp: new Date().toLocaleTimeString()
                      });
                      updateGrievanceStatus(selectedComplaint.id, 'In Progress');
                      setMessageText('');
                    }
                  }}
                >
                  Send Update <Send size={14} className="ml-2" />
                </Button>
                <Button variant="outline" size="sm" className="text-alert border-alert hover:bg-alert hover:text-white dark:border-red-500/50 dark:text-red-400 dark:hover:bg-red-500/20">
                  Escalate
                </Button>
              </div>
            </div>
            
            <div className="pb-8"></div>
          </div>
        </div>
      )}
    </div>
  );
}
