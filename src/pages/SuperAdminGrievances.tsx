import { useState, useMemo } from 'react';
import { SuperAdminSidebar } from '../components/superadmin/SuperAdminSidebar';
import { SuperAdminHeader } from '../components/superadmin/SuperAdminHeader';
import { useStore } from '../lib/store';
import type { Grievance } from '../lib/store';
import { deriveNotifications } from '../lib/superAdminAlerts';
import { SuperAdminGrievanceDetails } from '../components/superadmin/SuperAdminGrievanceDetails';
import { AlertTriangle, ChevronLeft, ChevronRight, Search, FileText, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSLAStatus, getSLAText } from '../lib/slaUtils';

type SortOption = 'operational' | 'created_desc' | 'created_asc' | 'updated_desc' | 'updated_asc';

export function SuperAdminGrievances() {
  const navigate = useNavigate();
  const { grievances, admins, escalations, readNotificationIds } = useStore();
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);

  // Derive notifications once for attention indicators
  const notifications = useMemo(() => deriveNotifications(grievances, admins, escalations, readNotificationIds), [grievances, admins, escalations, readNotificationIds]);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [slaFilter, setSlaFilter] = useState('All');
  const [assignmentFilter, setAssignmentFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [adminFilter, setAdminFilter] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('operational');
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Filter options derived from data
  const states = useMemo(() => Array.from(new Set(grievances.map(g => g.state).filter(Boolean))), [grievances]);
  const districts = useMemo(() => {
    let list = grievances;
    if (stateFilter !== 'All') list = list.filter(g => g.state === stateFilter);
    return Array.from(new Set(list.map(g => g.district).filter(Boolean)));
  }, [grievances, stateFilter]);
  const departments = useMemo(() => Array.from(new Set(grievances.map(g => g.dept).filter(Boolean))), [grievances]);
  const adminNames = useMemo(() => Array.from(new Set(grievances.map(g => g.assignedAdminName).filter(Boolean))), [grievances]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setSlaFilter('All');
    setAssignmentFilter('All');
    setStateFilter('All');
    setDistrictFilter('All');
    setDeptFilter('All');
    setAdminFilter('All');
    setPage(1);
  };

  const filteredAndSorted = useMemo(() => {
    let result = grievances.filter(g => {
      // Status
      if (statusFilter !== 'All' && g.status !== statusFilter) return false;
      // Priority
      if (priorityFilter !== 'All' && g.priority !== priorityFilter) return false;
      // Assignment
      if (assignmentFilter === 'Assigned' && !g.assignedAdminId) return false;
      if (assignmentFilter === 'Unassigned' && g.assignedAdminId) return false;
      // State/District/Dept/Admin
      if (stateFilter !== 'All' && g.state !== stateFilter) return false;
      if (districtFilter !== 'All' && g.district !== districtFilter) return false;
      if (deptFilter !== 'All' && g.dept !== deptFilter) return false;
      if (adminFilter !== 'All' && g.assignedAdminName !== adminFilter) return false;
      
      // SLA
      if (slaFilter !== 'All') {
        const slaStat = getSLAStatus(g);
        if (slaStat !== slaFilter) return false;
      }

      // Search
      if (search.trim()) {
        const s = search.toLowerCase();
        if (
          !g.id.toLowerCase().includes(s) &&
          !g.title.toLowerCase().includes(s) &&
          !(g.citizen && g.citizen.toLowerCase().includes(s)) &&
          !(g.location && g.location.toLowerCase().includes(s)) &&
          !(g.city && g.city.toLowerCase().includes(s)) &&
          !(g.district && g.district.toLowerCase().includes(s)) &&
          !(g.dept && g.dept.toLowerCase().includes(s)) &&
          !(g.assignedAdminName && g.assignedAdminName.toLowerCase().includes(s))
        ) {
          return false;
        }
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'operational') {
        // Operational order: 
        // 1. Critical/High && Unresolved && Overdue
        // 2. Critical/High && Unresolved
        // 3. Overdue
        // 4. At Risk
        // 5. Default unresolved
        // 6. Resolved
        
        const scoreA = getOpScore(a);
        const scoreB = getOpScore(b);
        if (scoreA !== scoreB) return scoreB - scoreA;
        
        // Fallback to updated desc
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      }
      
      if (sortBy === 'created_desc') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      if (sortBy === 'created_asc') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      if (sortBy === 'updated_desc') return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
      if (sortBy === 'updated_asc') return new Date(a.updatedAt || a.createdAt || 0).getTime() - new Date(b.updatedAt || b.createdAt || 0).getTime();
      
      return 0;
    });

    return result;
  }, [grievances, statusFilter, priorityFilter, slaFilter, assignmentFilter, stateFilter, districtFilter, deptFilter, adminFilter, search, sortBy]);

  function getOpScore(g: Grievance) {
    if (g.status === 'Resolved') return 0;
    let score = 10;
    const sla = getSLAStatus(g);
    const isHighOrCrit = g.priority === 'Critical' || g.priority === 'High';
    
    if (sla === 'At Risk') score += 20;
    if (sla === 'Overdue') score += 40;
    if (isHighOrCrit) score += 30;
    if (!g.assignedAdminId) score += 15;
    if (g.reopened) score += 50;
    
    return score;
  }

  // Summary Metrics
  const summary = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let resolved = 0;
    let overdue = 0;
    let critical = 0;
    let unassigned = 0;
    let reopened = 0;

    grievances.forEach(g => {
      if (g.status === 'Pending' || g.status === 'Filed') pending++;
      else if (g.status === 'In Progress') inProgress++;
      else if (g.status === 'Resolved') resolved++;

      if (getSLAStatus(g) === 'Overdue' && g.status !== 'Resolved') overdue++;
      if (g.priority === 'Critical' && g.status !== 'Resolved') critical++;
      if (!g.assignedAdminId && g.status !== 'Resolved') unassigned++;
      if (g.reopened && g.status !== 'Resolved') reopened++;
    });

    return { total: grievances.length, pending, inProgress, resolved, overdue, critical, unassigned, reopened };
  }, [grievances]);

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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Grievance Management</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Centralized monitoring, filtering and intervention across all grievances.</p>
            </div>

            {/* Summary KPI Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
              {[
                { label: 'Total', value: summary.total, color: 'text-gray-900 dark:text-white' },
                { label: 'Pending', value: summary.pending, color: 'text-purple-600 dark:text-purple-400' },
                { label: 'In Progress', value: summary.inProgress, color: 'text-blue-600 dark:text-blue-400' },
                { label: 'Resolved', value: summary.resolved, color: 'text-green-600 dark:text-green-400' },
                { label: 'Overdue', value: summary.overdue, color: 'text-red-600 dark:text-red-400', isAlert: true },
                { label: 'Critical', value: summary.critical, color: 'text-orange-600 dark:text-orange-400', isAlert: true },
                { label: 'Unassigned', value: summary.unassigned, color: 'text-yellow-600 dark:text-yellow-400', isAlert: true },
                { label: 'Reopened', value: summary.reopened, color: 'text-rose-600 dark:text-rose-400', isAlert: true }
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
                    placeholder="Search ID, title, citizen, location, or admin..."
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
                      <option value="updated_desc">Recently Updated</option>
                      <option value="updated_asc">Least Recently Updated</option>
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

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                <FilterSelect label="Status" value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={['All', 'Pending', 'In Progress', 'Resolved']} />
                <FilterSelect label="Priority" value={priorityFilter} onChange={(v) => { setPriorityFilter(v); setPage(1); }} options={['All', 'Critical', 'High', 'Medium', 'Low']} />
                <FilterSelect label="SLA" value={slaFilter} onChange={(v) => { setSlaFilter(v); setPage(1); }} options={['All', 'On Time', 'At Risk', 'Overdue']} />
                <FilterSelect label="Assignment" value={assignmentFilter} onChange={(v) => { setAssignmentFilter(v); setPage(1); }} options={['All', 'Assigned', 'Unassigned']} />
                <FilterSelect label="State" value={stateFilter} onChange={(v) => { setStateFilter(v); setDistrictFilter('All'); setPage(1); }} options={['All', ...states as string[]]} />
                <FilterSelect label="District" value={districtFilter} onChange={(v) => { setDistrictFilter(v); setPage(1); }} options={['All', ...districts as string[]]} />
                <FilterSelect label="Department" value={deptFilter} onChange={(v) => { setDeptFilter(v); setPage(1); }} options={['All', ...departments as string[]]} />
                <FilterSelect label="Admin" value={adminFilter} onChange={(v) => { setAdminFilter(v); setPage(1); }} options={['All', ...adminNames as string[]]} />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#141C27] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap w-24">ID</th>
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Issue & Location</th>
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status & SLA</th>
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assignment</th>
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reopen Status</th>
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-gray-500 dark:text-gray-400">
                          <FileText size={48} className="mx-auto mb-4 opacity-20" />
                          <p className="text-lg font-medium text-gray-900 dark:text-white">
                            {search || statusFilter !== 'All' ? 'No grievances match the selected filters.' : 'No grievances available.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map(g => {
                        const slaStatus = getSLAStatus(g);
                        const slaText = getSLAText(g);
                        
                        // Check if it exists in the active notifications array
                        const needsAttention = notifications.some(n => n.relatedGrievanceId === g.id && !n.read);

                        return (
                          <tr key={g.id} onClick={() => setSelectedGrievance(g)} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group">
                            <td className="p-4 align-top">
                              <span className="text-xs font-mono font-bold text-gray-900 dark:text-white">{g.id}</span>
                              {needsAttention && (
                                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">
                                  <AlertTriangle size={12} /> Alert
                                </div>
                              )}
                            </td>
                            <td className="p-4 align-top">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {g.title}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-sm">
                                📍 {g.location || g.city} {g.district ? `, ${g.district}` : ''}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                🏢 {g.dept}
                              </div>
                            </td>
                            <td className="p-4 align-top">
                              <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                g.priority === 'Critical' ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400' :
                                g.priority === 'High' ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-900/50 dark:text-orange-400' :
                                g.priority === 'Medium' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-400' :
                                'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                              }`}>
                                {g.priority}
                              </span>
                            </td>
                            <td className="p-4 align-top">
                              <div className="mb-2">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                  {g.status}
                                </span>
                              </div>
                              <div className={`flex items-center gap-1.5 text-[11px] font-medium ${
                                slaStatus === 'Overdue' ? 'text-red-600 dark:text-red-400' :
                                slaStatus === 'At Risk' ? 'text-orange-600 dark:text-orange-400' :
                                'text-green-600 dark:text-green-400'
                              }`}>
                                <Clock size={12} /> {slaText}
                              </div>
                            </td>
                            <td className="p-4 align-top">
                              {g.assignedAdminId ? (
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {g.assignedAdminName}
                                </div>
                              ) : (
                                <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  g.priority === 'Critical' || g.priority === 'High'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-900/50'
                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50'
                                }`}>
                                  Unassigned
                                </span>
                              )}
                            </td>
                            <td className="p-4 align-top">
                              {g.reopened ? (
                                <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                  <AlertTriangle size={12} /> Reopened
                                </span>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-600 text-xs font-medium">-</span>
                              )}
                            </td>
                            <td className="p-4 align-top text-right">
                              <button className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline">
                                View Details
                              </button>
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
            {selectedGrievance && (
              <SuperAdminGrievanceDetails 
                grievance={selectedGrievance} 
                onClose={() => setSelectedGrievance(null)} 
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
