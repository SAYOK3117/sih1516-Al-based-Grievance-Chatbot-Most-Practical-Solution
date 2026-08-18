import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, CheckCircle2, AlertCircle, Users, X, Bot, MapPin, Send, LogOut, Building2, ShieldCheck, Map as MapIcon, Flame, Layers, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { useStore } from '../lib/store';
import { LeafletMap } from '../components/ui/LeafletMap';
import { EscalationBadge } from '../components/ui/EscalationBadge';
import { MasterIssueCard } from '../components/ui/MasterIssueCard';
import { formatSlaDeadline } from '../lib/slaConfig';
import { AdminKpiDrawer, type AdminKpiType } from '../components/admin/AdminKpiDrawer';
import type { AdminAccount } from '../lib/adminConfig';

export function AdminDashboard() {
  const { grievances, masterIssues, updateGrievanceStatus, addMessage, updateMasterIssueStatus } = useStore();
  const navigate = useNavigate();

  // Authentication state
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
    if (!loggedInAdmin || !loggedInAdmin.id) {
      navigate('/login');
    }
  }, [loggedInAdmin, navigate]);

  // View state: 'list' | 'map' | 'heatmap' | 'master_issues'
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'heatmap' | 'master_issues'>('list');

  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [selectedAdminKpi, setSelectedAdminKpi] = useState<AdminKpiType | null>(null);
  const [messageText, setMessageText] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'overdue' | 'escalated' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Advanced Filters
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(['Critical', 'High', 'Medium', 'Low']);

  if (!loggedInAdmin) {
    return null;
  }

  const isDM = loggedInAdmin.id === '55555'; // District Magistrate

  // MULTI-ADMIN ROUTING FILTER LOGIC:
  // - DM (55555) sees all escalated complaints across all departments + all district grievances
  // - Department Officers (11111, 22222, 33333, 44444) see all complaints assigned to their Admin ID or Department
  const baseGrievances = isDM
    ? grievances
    : grievances.filter(g =>
        g.assignedAdminId === loggedInAdmin.id ||
        g.dept === loggedInAdmin.department ||
        g.originalAdminId === loggedInAdmin.id ||
        g.originalDepartment === loggedInAdmin.department
      );

  // Apply sub-filters
  const filteredGrievances = baseGrievances.filter(g => {
    // Status tab shortcut
    if (filterTab === 'resolved' && g.status !== 'Resolved') return false;
    if (filterTab === 'overdue' && !g.escalatedToDM && g.status !== 'SLA Breached' && (!g.slaDeadline || Date.now() <= g.slaDeadline)) return false;
    if (filterTab === 'escalated' && !g.escalatedToDM) return false;

    // Dept Filter (DM only)
    if (isDM && selectedDeptFilter !== 'All' && g.dept !== selectedDeptFilter && g.originalDepartment !== selectedDeptFilter) return false;

    // Priority filter
    if (selectedPriorities.length > 0 && !selectedPriorities.includes(g.priority)) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = g.id.toLowerCase().includes(q) ||
                    g.title.toLowerCase().includes(q) ||
                    (g.citizen && g.citizen.toLowerCase().includes(q)) ||
                    (g.aiSummary && g.aiSummary.toLowerCase().includes(q)) ||
                    (g.location && g.location.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  }).sort((a, b) => {
    if (a.status === 'Resolved' && b.status !== 'Resolved') return 1;
    if (a.status !== 'Resolved' && b.status === 'Resolved') return -1;
    return 0;
  });

  const selectedComplaint = baseGrievances.find(g => g.id === selectedComplaintId);

  // Filter Master Issues
  const filteredMasterIssues = isDM
    ? masterIssues
    : masterIssues.filter(mi => mi.assignedAdminId === loggedInAdmin.id || mi.dept === loggedInAdmin.department);

  // Metrics
  const totalCount = baseGrievances.length;
  const escalatedCount = baseGrievances.filter(g => g.escalatedToDM).length;
  const overdueCount = baseGrievances.filter(g => g.status === 'SLA Breached' || (g.slaDeadline && Date.now() > g.slaDeadline && g.status !== 'Resolved')).length;
  const resolvedCount = baseGrievances.filter(g => g.status === 'Resolved').length;

  const kpis: {
    type: AdminKpiType;
    label: string;
    value: string;
    icon: typeof ShieldAlert;
    color: string;
    colorBg: string;
  }[] = [
    { 
      type: isDM ? 'escalated' : 'total',
      label: isDM ? 'Escalated to DM' : 'Total Department Complaints', 
      value: isDM ? escalatedCount.toString() : totalCount.toString(), 
      icon: isDM ? ShieldAlert : AlertCircle, 
      color: isDM ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400',
      colorBg: isDM ? 'bg-red-50 dark:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700' : 'bg-blue-50 dark:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700'
    },
    { 
      type: 'overdue',
      label: 'SLA Breached', 
      value: overdueCount.toString(), 
      icon: Clock, 
      color: 'text-amber-600 dark:text-amber-400',
      colorBg: 'bg-amber-50 dark:bg-amber-900/20 hover:border-amber-300 dark:hover:border-amber-700'
    },
    { 
      type: 'master_issues',
      label: 'Active Master Issues', 
      value: filteredMasterIssues.length.toString(), 
      icon: Layers, 
      color: 'text-purple-600 dark:text-purple-400',
      colorBg: 'bg-purple-50 dark:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700'
    },
    { 
      type: 'resolved',
      label: 'Resolved Today', 
      value: resolvedCount.toString(), 
      icon: CheckCircle2, 
      color: 'text-emerald-600 dark:text-emerald-400',
      colorBg: 'bg-emerald-50 dark:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700'
    },
  ];

  const handlePriorityToggle = (p: string) => {
    setSelectedPriorities(prev =>
      prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedInAdmin');
    localStorage.removeItem('suvas_user_role');
    navigate('/login');
  };

  // Convert grievances to Leaflet Map Markers
  const mapMarkers = filteredGrievances.map(g => ({
    id: g.id,
    lat: g.lat,
    lng: g.lng,
    title: g.title,
    category: g.dept,
    dept: g.dept,
    priority: g.priority,
    status: g.status,
    location: g.location,
    assignedAdminId: g.assignedAdminId,
    slaDeadlineStr: formatSlaDeadline(g.slaDeadline),
    isSlaBreached: g.status === 'SLA Breached' || (g.slaDeadline ? Date.now() > g.slaDeadline : false),
    escalatedToDM: g.escalatedToDM,
    duplicateCount: g.masterIssueId ? masterIssues.find(m => m.id === g.masterIssueId)?.linkedComplaintIds.length : undefined
  }));

  return (
    <div className="pt-20 pb-12 container mx-auto px-4 max-w-7xl flex flex-col h-screen">

      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        {/* Sidebar Filters & Admin Profile */}
        <div className="hidden md:flex w-72 pr-6 border-r border-gray-200 dark:border-gray-800 flex-col justify-between overflow-y-auto h-full pb-6 shrink-0">
          <div className="space-y-6">

            {/* Admin Header Box */}
            <div className={`p-4 rounded-xl border ${isDM ? 'bg-gradient-to-br from-red-600/15 to-amber-600/10 dark:from-red-950/40 dark:to-orange-950/30 border-red-400 dark:border-red-800' : 'bg-gradient-to-br from-primary/10 to-blue-600/5 dark:from-primary/20 dark:to-blue-900/20 border-primary/20'}`}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2">
                {isDM ? (
                  <span className="flex items-center text-red-600 dark:text-red-400 font-extrabold">
                    <ShieldAlert size={16} className="mr-1 animate-bounce" /> DM Escalation Authority
                  </span>
                ) : (
                  <span className="flex items-center text-primary dark:text-blue-400">
                    <ShieldCheck size={16} className="mr-1" /> Department Officer Portal
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight mb-1">
                {loggedInAdmin.department}
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">{loggedInAdmin.role}</p>
            </div>

            {/* Status Quick Filters */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Status Quick Filter
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-between ${
                    filterTab === 'all'
                      ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-400 font-bold'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span><Users size={16} className="inline mr-2 mb-0.5" /> All Complaints</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 font-semibold">{baseGrievances.length}</span>
                </button>

                <button
                  onClick={() => setFilterTab('escalated')}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-between ${
                    filterTab === 'escalated'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-bold'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span><ShieldAlert size={16} className="inline mr-2 mb-0.5 text-red-500" /> Escalated to DM</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-600 text-white font-bold">{escalatedCount}</span>
                </button>

                <button
                  onClick={() => setFilterTab('overdue')}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-between ${
                    filterTab === 'overdue'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-bold'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span><Clock size={16} className="inline mr-2 mb-0.5 text-amber-500" /> SLA Breached</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-semibold">{overdueCount}</span>
                </button>

                <button
                  onClick={() => setFilterTab('resolved')}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-between ${
                    filterTab === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span><CheckCircle2 size={16} className="inline mr-2 mb-0.5 text-emerald-500" /> Resolved</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold">{resolvedCount}</span>
                </button>
              </div>
            </div>

            {/* Department Filter - District Magistrate Only */}
            {isDM && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Filter Department
                </h3>
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="w-full bg-white dark:bg-[#1A2332] border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-xs font-medium dark:text-white"
                >
                  <option value="All">All Filtered Departments</option>
                  <option value="UPPCL / Electricity Department">UPPCL / Electricity</option>
                  <option value="PWD">PWD (Roads & Infra)</option>
                  <option value="Water Works / Jal Sansthan">Water Works / Jal Sansthan</option>
                  <option value="Cyber Cell">Cyber Cell</option>
                  <option value="District Magistrate (DM)">District Magistrate (DM)</option>
                </select>
              </div>
            )}

            {/* Priority Checkbox Filter */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Priority Filter
              </h3>
              <div className="space-y-2">
                {['Critical', 'High', 'Medium', 'Low'].map((p) => (
                  <label key={p} className="flex items-center space-x-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPriorities.includes(p)}
                      onChange={() => handlePriorityToggle(p)}
                      className="rounded text-primary focus:ring-primary border-gray-300 dark:border-gray-700 bg-transparent"
                    />
                    <span>{p} Priority</span>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Logout Option */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50"
            >
              <LogOut size={16} className="mr-2" />
              Logout Account
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 flex flex-col ${selectedComplaint ? 'hidden md:flex md:w-1/2 lg:w-2/3 md:pl-6' : 'md:pl-6'} h-full overflow-hidden`}>

          {/* Mobile Header Banner */}
          <div className="md:hidden mb-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between border border-primary/20">
            <div>
              <p className="text-xs text-primary font-bold">{loggedInAdmin.department}</p>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">{loggedInAdmin.role}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500">
              <LogOut size={16} />
            </Button>
          </div>

          {/* Top KPIs Header - Interactive Clickable Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 shrink-0">
            {kpis.map((kpi, i) => (
              <Card 
                key={i} 
                onClick={() => setSelectedAdminKpi(kpi.type)}
                className={`border border-gray-100 dark:border-gray-800 shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${kpi.colorBg} group`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform">{kpi.value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{kpi.label}</div>
                    <span className="text-[10px] text-primary dark:text-blue-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 mt-1">
                      View panel →
                    </span>
                  </div>
                  <div className={`w-9 h-9 rounded-xl bg-white dark:bg-gray-800 shadow-xs flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                    <kpi.icon size={18} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* View Mode Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between bg-white dark:bg-surface-dark p-2 rounded-xl border border-gray-200 dark:border-gray-800 mb-4 gap-2 shrink-0">
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-white dark:bg-surface-dark text-primary shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
              >
                <Users size={14} /> List View ({filteredGrievances.length})
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${viewMode === 'map' ? 'bg-white dark:bg-surface-dark text-primary shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
              >
                <MapIcon size={14} /> Complaint Map
              </button>
              <button
                onClick={() => setViewMode('heatmap')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${viewMode === 'heatmap' ? 'bg-white dark:bg-surface-dark text-primary shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
              >
                <Flame size={14} className="text-red-500" /> Heatmap Density
              </button>
              <button
                onClick={() => setViewMode('master_issues')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${viewMode === 'master_issues' ? 'bg-white dark:bg-surface-dark text-primary shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
              >
                <Layers size={14} className="text-amber-500" /> Master Issues ({filteredMasterIssues.length})
              </button>
            </div>

            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <Input
                type="text"
                placeholder="Filter by ID, keywords..."
                className="pl-8 text-xs h-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* View Mode 1: Traditional List View */}
          {viewMode === 'list' && (
            <div className="flex-1 overflow-y-auto space-y-3 pb-20 md:pb-0">
              {filteredGrievances.length === 0 ? (
                <div className="text-center py-16 px-4 bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800">
                  <Building2 size={40} className="mx-auto text-gray-400 mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base">No Matching Complaints</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                    No grievances match the current filter selection for {loggedInAdmin.department}.
                  </p>
                </div>
              ) : (
                filteredGrievances.map((c) => (
                  <Card
                    key={c.id}
                    className={`cursor-pointer transition-colors ${selectedComplaint?.id === c.id ? 'border-primary shadow-md dark:border-blue-500' : 'hover:border-gray-300 dark:hover:border-gray-700'}`}
                    onClick={() => setSelectedComplaintId(c.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-primary dark:text-blue-400">{c.id}</span>
                          <Badge variant={c.priority === 'Critical' || c.priority === 'High' ? 'alert' : c.priority === 'Medium' ? 'warning' : 'primary'}>
                            {c.priority} Priority
                          </Badge>
                          {c.status === 'Resolved' && (
                            <Badge variant="success" className="text-[10px]">
                              Resolved
                            </Badge>
                          )}
                          {c.escalatedToDM && <EscalationBadge showDetails={false} />}
                          {c.masterIssueId && (
                            <Badge variant="warning" className="text-[10px]">
                              Linked {c.masterIssueId}
                            </Badge>
                          )}
                        </div>
                        {!c.escalatedToDM && <span className={`text-xs font-semibold ${c.slaColor}`}>{c.sla}</span>}
                      </div>

                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-1">{c.title}</h3>

                      <div className="flex items-start gap-2 bg-gray-50 dark:bg-[#1A2332] p-2 rounded text-xs text-gray-600 dark:text-gray-400 mb-3 border border-gray-100 dark:border-gray-800">
                        <Bot size={14} className="text-primary mt-0.5 shrink-0" />
                        <p className="line-clamp-1">{c.priorityReason || c.aiSummary}</p>
                      </div>

                      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-500">
                        <span>{c.citizen} • <span className="font-semibold text-gray-700 dark:text-gray-300">{c.dept}</span></span>
                        <span>{c.date}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* View Mode 2: Real Interactive Leaflet Complaint Map */}
          {viewMode === 'map' && (
            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex justify-between items-center mb-3 text-xs">
                <span className="font-bold text-gray-900 dark:text-white flex items-center">
                  <MapIcon size={16} className="mr-1.5 text-primary" />
                  Geographic Complaint Interactive Map ({mapMarkers.length} Locations)
                </span>
                <div className="flex gap-3 text-[11px] font-semibold">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Critical / Escalated</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Medium</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Low / Resolved</span>
                </div>
              </div>
              <div className="flex-1">
                <LeafletMap
                  mode="viewer"
                  center={[26.8467, 80.9462]}
                  zoom={13}
                  markers={mapMarkers}
                  selectedMarkerId={selectedComplaintId}
                  height="100%"
                />
              </div>
            </div>
          )}

          {/* View Mode 3: Dynamic Spatial Complaint Heatmap */}
          {viewMode === 'heatmap' && (
            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="p-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-lg border border-red-300 dark:border-red-900/50 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <Flame size={18} className="text-red-500 animate-pulse" />
                  <div>
                    <span className="font-bold text-red-700 dark:text-red-400">Dynamic Problem Density Heatmap</span>
                    <p className="text-gray-600 dark:text-gray-300 text-[11px]">
                      Identifies high-density complaint clusters generated from actual database coordinates.
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs font-bold text-red-600 dark:text-red-400">
                  Hotspot Detection: Active
                </div>
              </div>

              <div className="flex-1">
                <LeafletMap
                  mode="heatmap"
                  center={[26.8467, 80.9462]}
                  zoom={13}
                  markers={mapMarkers}
                  height="100%"
                />
              </div>
            </div>
          )}

          {/* View Mode 4: Master Issue Management */}
          {viewMode === 'master_issues' && (
            <div className="flex-1 overflow-y-auto space-y-4 pb-20 md:pb-0">
              {filteredMasterIssues.length === 0 ? (
                <div className="text-center py-16 px-4 bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800">
                  <Layers size={40} className="mx-auto text-amber-500 mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base">No Master Issues Created</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                    No active grouped master issue tickets recorded yet for {loggedInAdmin.department}.
                  </p>
                </div>
              ) : (
                filteredMasterIssues.map(mi => (
                  <MasterIssueCard
                    key={mi.id}
                    masterIssue={mi}
                    onUpdateStatus={(id, status) => updateMasterIssueStatus(id, status)}
                  />
                ))
              )}
            </div>
          )}

        </div>
      </div>

      {/* KPI Grievance / Master Issue Side Drawer */}
      {selectedAdminKpi && (
        <AdminKpiDrawer
          type={selectedAdminKpi}
          onClose={() => setSelectedAdminKpi(null)}
          onSelectGrievance={(g) => {
            setSelectedComplaintId(g.id);
          }}
          onUpdateMasterIssueStatus={(id, status) => updateMasterIssueStatus(id, status)}
          grievances={baseGrievances}
          masterIssues={filteredMasterIssues}
          departmentName={loggedInAdmin.department}
          isDM={isDM}
        />
      )}

      {/* Slide-in Complaint Details Panel */}
      {selectedComplaint && (
        <div className="fixed md:static inset-0 z-50 md:z-auto bg-white dark:bg-[#0F1620] md:bg-transparent flex flex-col md:w-1/2 lg:w-1/3 md:ml-6 md:border-l border-gray-200 dark:border-gray-800 md:pl-6 h-full overflow-hidden animate-slide-in">

          <div className="flex items-center justify-between p-4 md:p-0 mb-4 shrink-0 border-b border-gray-100 dark:border-gray-800 md:border-none">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Complaint Management</h3>
            <button onClick={() => setSelectedComplaintId(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              <X size={18} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 px-4 md:px-0 pb-20 md:pb-0">
            {selectedComplaint.escalatedToDM && (
              <EscalationBadge
                reason={selectedComplaint.escalationReason}
                originalDepartment={selectedComplaint.originalDepartment || selectedComplaint.dept}
                originalOfficer={selectedComplaint.originalDepartment ? `${selectedComplaint.originalDepartment} Officer` : 'Department Officer'}
                escalationTime={selectedComplaint.escalationTime}
                showDetails={true}
              />
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono text-sm font-semibold text-primary dark:text-blue-400">{selectedComplaint.id}</span>
                <Badge variant={selectedComplaint.status === 'In Progress' ? 'warning' : selectedComplaint.status === 'Resolved' ? 'success' : 'primary'}>
                  {selectedComplaint.status}
                </Badge>
                {selectedComplaint.masterIssueId && (
                  <Badge variant="warning">Linked {selectedComplaint.masterIssueId}</Badge>
                )}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{selectedComplaint.title}</h2>

              <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">Citizen Name</p>
                  <p className="font-medium text-gray-900 dark:text-gray-200">{selectedComplaint.citizen}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">Department</p>
                  <p className="font-medium text-primary dark:text-blue-400">{selectedComplaint.dept}</p>
                </div>
                <div className="col-span-2 flex items-start">
                  <MapPin size={16} className="text-gray-400 mt-0.5 mr-2 shrink-0" />
                  <div>
                    <p className="text-gray-900 dark:text-gray-200">{selectedComplaint.location}</p>
                    <p className="text-[10px] text-gray-400 font-mono">Lat: {selectedComplaint.lat.toFixed(5)}, Lng: {selectedComplaint.lng.toFixed(5)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Priority & Rationale */}
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2 mb-2">
                <Bot size={18} className="text-primary" />
                <h4 className="font-semibold text-sm text-primary dark:text-blue-300">AI Priority & Intelligence</h4>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-3">
                {selectedComplaint.priorityReason || selectedComplaint.aiSummary}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant={selectedComplaint.priority === 'Critical' || selectedComplaint.priority === 'High' ? 'alert' : 'warning'}>
                  Priority: {selectedComplaint.priority}
                </Badge>
                <Badge variant="outline">{selectedComplaint.dept}</Badge>
              </div>
            </div>

            {/* Interactive Single Location Map */}
            <div>
              <h4 className="font-semibold text-xs text-gray-900 dark:text-white mb-2">Location Map</h4>
              <LeafletMap
                mode="viewer"
                center={[selectedComplaint.lat, selectedComplaint.lng]}
                zoom={15}
                markers={[
                  {
                    id: selectedComplaint.id,
                    lat: selectedComplaint.lat,
                    lng: selectedComplaint.lng,
                    title: selectedComplaint.title,
                    category: selectedComplaint.dept,
                    dept: selectedComplaint.dept,
                    priority: selectedComplaint.priority,
                    status: selectedComplaint.status,
                    location: selectedComplaint.location,
                    escalatedToDM: selectedComplaint.escalatedToDM
                  }
                ]}
                height="180px"
              />
            </div>

            {/* Communication Log */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <h4 className="font-semibold text-xs text-gray-900 dark:text-white mb-3 flex items-center">
                <Bot size={16} className="mr-2 text-primary" /> Communication Log
              </h4>
              {selectedComplaint.messages.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">No messages yet.</p>
              ) : (
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {selectedComplaint.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg border text-xs ${
                        msg.sender === 'Citizen'
                          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30'
                          : 'bg-gray-50 dark:bg-[#1A2332] border-gray-100 dark:border-gray-800'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-semibold ${
                          msg.sender === 'Citizen' ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'
                        }`}>{msg.sender}</span>
                        <span className="text-gray-400">{msg.timestamp}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{msg.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Officer Action & Message */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <h4 className="font-semibold text-xs text-gray-900 dark:text-white mb-2 flex items-center">
                <Bot size={16} className="mr-2 text-primary" /> Send Official Update / Take Action
              </h4>
              <Textarea
                className="mb-3 text-xs h-20"
                placeholder="Type response or status update..."
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
                        sender: isDM ? 'District Magistrate' : 'Admin',
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateGrievanceStatus(selectedComplaint.id, 'Resolved')}
                  className="text-emerald-600 border-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500/50 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                >
                  Mark Resolved
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
