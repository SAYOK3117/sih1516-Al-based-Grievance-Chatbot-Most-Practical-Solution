import { useState, useMemo } from 'react';
import { SuperAdminSidebar } from '../components/superadmin/SuperAdminSidebar';
import { SuperAdminHeader } from '../components/superadmin/SuperAdminHeader';
import { useStore } from '../lib/store';
import type { GrievanceEscalation } from '../lib/store';
import { EscalationDetailDrawer } from '../components/superadmin/EscalationDetailDrawer';
import { Search, ShieldAlert, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSLAStatus, getSLAText } from '../lib/slaUtils';

type SortOption = 'operational' | 'created_desc' | 'created_asc';

export function SuperAdminEscalations() {
  const navigate = useNavigate();
  const { escalations, grievances } = useStore();
  const [selectedEscalation, setSelectedEscalation] = useState<GrievanceEscalation | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [slaFilter, setSlaFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [adminFilter, setAdminFilter] = useState('All');
  const [reasonFilter, setReasonFilter] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('operational');
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Enhance escalations with grievance data for filtering and display
  const enhancedEscalations = useMemo(() => {
    return escalations.map(esc => {
      const g = grievances.find(x => x.id === esc.grievanceId);
      return { ...esc, grievance: g };
    }).filter(x => x.grievance !== undefined);
  }, [escalations, grievances]);

  // Filter options derived from data
  const states = useMemo(() => Array.from(new Set(enhancedEscalations.map(e => e.grievance!.state).filter(Boolean))), [enhancedEscalations]);
  const departments = useMemo(() => Array.from(new Set(enhancedEscalations.map(e => e.grievance!.dept).filter(Boolean))), [enhancedEscalations]);
  const adminNames = useMemo(() => Array.from(new Set(enhancedEscalations.map(e => e.grievance!.assignedAdminName).filter(Boolean))), [enhancedEscalations]);
  const reasons = useMemo(() => Array.from(new Set(enhancedEscalations.map(e => e.reason).filter(Boolean))), [enhancedEscalations]);

  // We will now use getSLAStatus and getSLAText directly from slaUtils

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setSlaFilter('All');
    setStateFilter('All');
    setDeptFilter('All');
    setAdminFilter('All');
    setReasonFilter('All');
    setPage(1);
  };

  const filteredAndSorted = useMemo(() => {
    let result = enhancedEscalations.filter(esc => {
      const g = esc.grievance!;
      
      // Status
      if (statusFilter !== 'All' && esc.status !== statusFilter) return false;
      // Priority
      if (priorityFilter !== 'All' && esc.priority !== priorityFilter) return false;
      // State/Dept/Admin/Reason
      if (stateFilter !== 'All' && g.state !== stateFilter) return false;
      if (deptFilter !== 'All' && g.dept !== deptFilter) return false;
      if (adminFilter !== 'All' && g.assignedAdminName !== adminFilter) return false;
      if (reasonFilter !== 'All' && esc.reason !== reasonFilter) return false;
      
      // SLA
      if (slaFilter !== 'All') {
        const slaStat = getSLAStatus(g);
        if (slaStat !== slaFilter) return false;
      }

      // Search
      if (search.trim()) {
        const s = search.toLowerCase();
        if (
          !esc.id.toLowerCase().includes(s) &&
          !g.id.toLowerCase().includes(s) &&
          !g.title.toLowerCase().includes(s) &&
          !(g.location && g.location.toLowerCase().includes(s)) &&
          !(g.city && g.city.toLowerCase().includes(s)) &&
          !(g.district && g.district.toLowerCase().includes(s)) &&
          !(g.dept && g.dept.toLowerCase().includes(s)) &&
          !(g.assignedAdminName && g.assignedAdminName.toLowerCase().includes(s)) &&
          !esc.reason.toLowerCase().includes(s) &&
          !esc.escalatedBy.toLowerCase().includes(s) &&
          !(esc.escalatedTo && esc.escalatedTo.toLowerCase().includes(s))
        ) {
          return false;
        }
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'operational') {
        // Operational order: 
        // 1. Critical + SLA breached + Pending
        // 2. Critical + Pending
        // 3. High + SLA breached + Pending
        // 4. Pending
        // 5. Under Review
        // 6. Action Taken
        // 7. Resolved
        
        const scoreA = getOpScore(a);
        const scoreB = getOpScore(b);
        if (scoreA !== scoreB) return scoreB - scoreA;
        
        // Fallback to created desc
        return new Date(b.escalatedAt).getTime() - new Date(a.escalatedAt).getTime();
      }
      
      if (sortBy === 'created_desc') return new Date(b.escalatedAt).getTime() - new Date(a.escalatedAt).getTime();
      if (sortBy === 'created_asc') return new Date(a.escalatedAt).getTime() - new Date(b.escalatedAt).getTime();
      
      return 0;
    });

    return result;
  }, [enhancedEscalations, statusFilter, priorityFilter, slaFilter, stateFilter, deptFilter, adminFilter, reasonFilter, search, sortBy]);

  function getOpScore(esc: any) {
    if (esc.status === 'Resolved') return 0;
    if (esc.status === 'Action Taken') return 5;
    if (esc.status === 'Under Review') return 10;
    
    let score = 20; // Pending base
    const sla = getSLAStatus(esc.grievance);
    
    if (sla === 'At Risk') score += 10;
    if (sla === 'Overdue') score += 30;
    if (esc.priority === 'High') score += 15;
    if (esc.priority === 'Critical') score += 40;
    
    return score;
  }

  // Summary Metrics
  const summary = useMemo(() => {
    let pending = 0;
    let underReview = 0;
    let resolved = 0;
    let overdue = 0;
    let critical = 0;

    enhancedEscalations.forEach(esc => {
      if (esc.status === 'Pending') pending++;
      else if (esc.status === 'Under Review') underReview++;
      else if (esc.status === 'Resolved') resolved++;

      if (esc.grievance && getSLAStatus(esc.grievance) === 'Overdue' && esc.status !== 'Resolved') overdue++;
      if (esc.priority === 'Critical' && esc.status !== 'Resolved') critical++;
    });

    return { total: enhancedEscalations.length, pending, underReview, resolved, overdue, critical };
  }, [enhancedEscalations]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const paginatedData = filteredAndSorted.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('suvas_user_role');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050B14] flex">
      <SuperAdminSidebar onLogout={handleLogout} />
      
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <SuperAdminHeader />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Escalation Management</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Centralized monitoring and intervention for escalated grievances.</p>
            </div>

            {/* Summary KPI Bar */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {[
                { label: 'Total Escalations', value: summary.total, color: 'text-gray-900 dark:text-white' },
                { label: 'Pending Review', value: summary.pending, color: 'text-red-600 dark:text-red-400', isAlert: true },
                { label: 'Under Review', value: summary.underReview, color: 'text-orange-600 dark:text-orange-400' },
                { label: 'SLA Breached', value: summary.overdue, color: 'text-red-600 dark:text-red-400', isAlert: true },
                { label: 'Critical Priority', value: summary.critical, color: 'text-purple-600 dark:text-purple-400', isAlert: true },
                { label: 'Resolved', value: summary.resolved, color: 'text-green-600 dark:text-green-400' }
              ].map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-[#141C27] border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm flex flex-col justify-center items-center">
                  <span className={`text-2xl font-bold ${item.color} flex items-center gap-1.5`}>
                    {item.isAlert && item.value > 0 && <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>}
                    {item.value}
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 text-center">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Controls Section */}
            <div className="bg-white dark:bg-[#141C27] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm mb-6 p-5 space-y-5">
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#0F1620] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 sm:text-sm transition-shadow"
                    placeholder="Search escalation ID, grievance ID, title, admin, or reason..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  />
                </div>
                
                <div className="flex gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Sort:</span>
                    <select
                      className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0F1620] text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={sortBy}
                      onChange={(e) => { setSortBy(e.target.value as SortOption); setPage(1); }}
                    >
                      <option value="operational">Operational Priority</option>
                      <option value="created_desc">Newest First</option>
                      <option value="created_asc">Oldest First</option>
                    </select>
                  </div>
                  <button 
                    onClick={clearFilters}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0F1620] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <FilterSelect label="Status" value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={['All', 'Pending', 'Under Review', 'Action Taken', 'Resolved']} />
                <FilterSelect label="Priority" value={priorityFilter} onChange={(v) => { setPriorityFilter(v); setPage(1); }} options={['All', 'Critical', 'High']} />
                <FilterSelect label="SLA" value={slaFilter} onChange={(v) => { setSlaFilter(v); setPage(1); }} options={['All', 'On Time', 'At Risk', 'Overdue']} />
                <FilterSelect label="State" value={stateFilter} onChange={(v) => { setStateFilter(v); setPage(1); }} options={['All', ...states as string[]]} />
                <FilterSelect label="Department" value={deptFilter} onChange={(v) => { setDeptFilter(v); setPage(1); }} options={['All', ...departments as string[]]} />
                <FilterSelect label="Admin" value={adminFilter} onChange={(v) => { setAdminFilter(v); setPage(1); }} options={['All', ...adminNames as string[]]} />
                <FilterSelect label="Reason" value={reasonFilter} onChange={(v) => { setReasonFilter(v); setPage(1); }} options={['All', ...reasons as string[]]} />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#141C27] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Escalation ID</th>
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Grievance ID</th>
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Issue & Details</th>
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Escalated By/To</th>
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & SLA</th>
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-gray-500 dark:text-gray-400">
                          <ShieldAlert size={48} className="mx-auto mb-4 opacity-20" />
                          <p className="text-lg font-medium text-gray-900 dark:text-white">
                            {search || statusFilter !== 'All' ? 'No escalations match the selected filters.' : 'No active escalations.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map(esc => {
                        const g = esc.grievance!;
                        const slaStatus = getSLAStatus(g);
                        const slaText = getSLAText(g);

                        return (
                          <tr key={esc.id} onClick={() => setSelectedEscalation(esc)} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group">
                            <td className="p-4 align-top">
                              <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">{esc.id}</span>
                            </td>
                            <td className="p-4 align-top">
                              <span className="text-xs font-mono font-medium text-gray-600 dark:text-gray-400">{esc.grievanceId}</span>
                            </td>
                            <td className="p-4 align-top">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {g.title}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                📍 {g.location || g.city}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                👨‍💼 {g.assignedAdminName || 'Unassigned'}
                              </div>
                            </td>
                            <td className="p-4 align-top">
                              <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 max-w-[250px]">
                                {esc.reason}
                              </div>
                              <div className="mt-2">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                  esc.priority === 'Critical' ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400' :
                                  'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-900/50 dark:text-orange-400'
                                }`}>
                                  {esc.priority}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 align-top">
                              <div className="text-sm text-gray-900 dark:text-white font-medium">{esc.escalatedBy}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">→ {esc.escalatedTo}</div>
                            </td>
                            <td className="p-4 align-top">
                              <div className="text-sm text-gray-900 dark:text-white mb-1">
                                {new Date(esc.escalatedAt).toLocaleDateString()}
                              </div>
                              <div className={`flex items-center gap-1 text-[11px] font-medium ${
                                slaStatus === 'Overdue' ? 'text-red-600 dark:text-red-400' :
                                slaStatus === 'At Risk' ? 'text-orange-600 dark:text-orange-400' :
                                'text-green-600 dark:text-green-400'
                              }`}>
                                <Clock size={12} /> {slaText}
                              </div>
                            </td>
                            <td className="p-4 align-top text-right">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                esc.status === 'Resolved' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400' :
                                esc.status === 'Action Taken' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-400' :
                                esc.status === 'Under Review' ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-900/50 dark:text-orange-400' :
                                'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400'
                              }`}>
                                {esc.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing <span className="font-medium text-gray-900 dark:text-white">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min(page * itemsPerPage, filteredAndSorted.length)}</span> of <span className="font-medium text-gray-900 dark:text-white">{filteredAndSorted.length}</span> results
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="p-1.5 rounded bg-white dark:bg-[#0F1620] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button 
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="p-1.5 rounded bg-white dark:bg-[#0F1620] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Existing Detail Overlay */}
            {selectedEscalation && (
              <EscalationDetailDrawer 
                escalation={selectedEscalation} 
                onClose={() => setSelectedEscalation(null)} 
              />
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white dark:bg-[#0F1620] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 truncate"
      >
        {options.map((opt, i) => (
          <option key={i} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
