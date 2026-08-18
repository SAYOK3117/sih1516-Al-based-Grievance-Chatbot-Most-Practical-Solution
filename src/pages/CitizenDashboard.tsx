import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, Building2, Layers, MapPin, Download, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { useStore } from '../lib/store';
import { EscalationBadge } from '../components/ui/EscalationBadge';
import { AcknowledgementReceipt } from '../components/ui/AcknowledgementReceipt';
import { generateGrievancePdf } from '../lib/pdfUtils';

export function CitizenDashboard() {
  const { grievances } = useStore();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const hiddenReceiptRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async (grievanceId: string) => {
    setDownloadingId(grievanceId);
    // Give React a moment to render the specific receipt before capturing
    setTimeout(async () => {
      if (!hiddenReceiptRef.current) {
        setDownloadingId(null);
        return;
      }
      try {
        await generateGrievancePdf(hiddenReceiptRef.current, grievanceId);
      } catch (err) {
        console.error('PDF generation error:', err);
        alert("Couldn't generate PDF, please try again.");
      } finally {
        setDownloadingId(null);
      }
    }, 100);
  };

  const filteredGrievances = grievances.filter(g => {
    if (activeTab === 'Filed' && g.status !== 'Filed') return false;
    if (activeTab === 'In Progress' && g.status !== 'In Progress') return false;
    if (activeTab === 'Resolved' && g.status !== 'Resolved') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = g.id.toLowerCase().includes(q) ||
                    g.title.toLowerCase().includes(q) ||
                    g.dept.toLowerCase().includes(q) ||
                    g.location.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const stats = [
    { label: 'Total Filed', value: grievances.length.toString(), tab: 'All' },
    { label: 'In Progress', value: grievances.filter(g => g.status === 'In Progress').length.toString(), tab: 'In Progress' },
    { label: 'Resolved', value: grievances.filter(g => g.status === 'Resolved').length.toString(), tab: 'Resolved' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved': return <Badge variant="success">Resolved</Badge>;
      case 'In Progress': return <Badge variant="warning">In Progress</Badge>;
      case 'SLA Breached': return <Badge variant="alert">SLA Breached</Badge>;
      default: return <Badge variant="primary">{status}</Badge>;
    }
  };

  return (
    <div className="pt-24 pb-24 md:pb-12 container mx-auto px-4 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Grievances</h1>
          <p className="text-gray-500 dark:text-gray-400">Track and manage all your filed complaints with real-time AI status updates.</p>
        </div>
        <Link to="/file-grievance">
          <Button>File New Grievance</Button>
        </Link>
      </div>

      {/* Stats row - Interactive */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((stat, i) => (
          <Card 
            key={i} 
            onClick={() => setActiveTab(stat.tab)}
            className={`bg-white dark:bg-surface-dark border shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
              activeTab === stat.tab 
                ? 'border-primary dark:border-blue-500 ring-2 ring-primary/20 dark:ring-blue-500/30' 
                : 'border-transparent'
            }`}
          >
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
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 shadow-sm'
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
            <Input
              type="text"
              placeholder="Search by ID or title..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grievance list */}
      <div className="space-y-4">
        {filteredGrievances.length === 0 ? (
          <Card className="p-8 text-center bg-white dark:bg-surface-dark border-dashed">
            <p className="text-gray-500 dark:text-gray-400">No grievances found matching the current filter.</p>
          </Card>
        ) : (
          filteredGrievances.map((grievance) => (
            <Card key={grievance.id} className="bg-white dark:bg-surface-dark hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-sm font-bold text-primary">{grievance.id}</span>
                      {getStatusBadge(grievance.status)}
                      <Badge variant="outline" className="border-gray-300 dark:border-gray-700">
                        {grievance.priority} Priority
                      </Badge>
                      {grievance.escalatedToDM && (
                        <EscalationBadge />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {grievance.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {grievance.aiSummary}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 pt-2">
                      <div className="flex items-center space-x-1">
                        <Building2 size={14} />
                        <span>{grievance.dept}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin size={14} />
                        <span>{grievance.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>{grievance.date || grievance.createdAt || 'Recent'}</span>
                      </div>
                      {grievance.masterIssueId && (
                        <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-medium">
                          <Layers size={14} />
                          <span>Grouped Issue</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                    <Button 
                      variant="ghost" 
                      className="w-full text-sm text-gray-600 dark:text-gray-400"
                      onClick={() => handleDownloadPdf(grievance.id)}
                      disabled={downloadingId === grievance.id}
                    >
                      {downloadingId === grievance.id ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Download size={16} className="mr-2" />}
                      Receipt
                    </Button>
                    <Link to={`/track?id=${grievance.id}`}>
                      <Button variant="outline" className="w-full text-sm">
                        Track Status
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Hidden receipt for PDF capture */}
      {downloadingId && (
        <div className="absolute top-0 left-0 opacity-0 pointer-events-none z-[-50]">
          <div ref={hiddenReceiptRef} className="w-[800px] bg-white text-black p-8">
            <AcknowledgementReceipt grievance={grievances.find(g => g.id === downloadingId)!} />
          </div>
        </div>
      )}
    </div>
  );
}
