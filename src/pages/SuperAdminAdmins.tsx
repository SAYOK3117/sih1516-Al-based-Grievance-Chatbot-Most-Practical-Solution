import { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { useStore } from '../lib/store';
import { getSLAStatus } from '../lib/slaUtils';
import type { Grievance } from '../lib/store';
import { AdminDetailDrawer } from '../components/superadmin/AdminDetailDrawer';
import type { AdminDerivedStats } from '../components/superadmin/AdminDetailDrawer';
import { SuperAdminGrievanceDetails } from '../components/superadmin/SuperAdminGrievanceDetails';
import { SuperAdminSidebar } from '../components/superadmin/SuperAdminSidebar';
import { SuperAdminHeader } from '../components/superadmin/SuperAdminHeader';
import { useNavigate } from 'react-router-dom';

export function SuperAdminAdmins() {
  const navigate = useNavigate();
  const { admins, grievances } = useStore();

  const handleLogout = () => {
    localStorage.removeItem('suvas_user_role');
    navigate('/login');
  };
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [workloadFilter, setWorkloadFilter] = useState('All');
  const [performanceFilter, setPerformanceFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  
  const [sortCol, setSortCol] = useState<keyof AdminDerivedStats>('pending');
  const [sortDesc, setSortDesc] = useState(true);

  const [selectedAdminStats, setSelectedAdminStats] = useState<AdminDerivedStats | null>(null);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);

  // 1. Compute AdminDerivedStats
  const adminStatsMap = useMemo(() => {
    const stats: Record<string, AdminDerivedStats> = {};
    
    // Initialize stats
    admins.forEach(admin => {
      stats[admin.id] = {
        admin,
        assigned: 0,
        pending: 0,
        resolved: 0,
        overdue: 0,
        escalated: 0,
        slaCompliance: 100,
        workload: 'LOW',
        performance: 'Excellent'
      };
    });

    // Compute from grievances
    grievances.forEach(g => {
      if (!g.assignedAdminId || !stats[g.assignedAdminId]) return;
      const s = stats[g.assignedAdminId];
      
      s.assigned += 1;
      if (g.status === 'Resolved') {
        s.resolved += 1;
      } else {
        s.pending += 1;
        if (getSLAStatus(g) === 'Overdue') s.overdue += 1;
      }
      if (g.escalated) s.escalated += 1;
    });

    // Derive Workload and Performance
    Object.values(stats).forEach(s => {
      s.slaCompliance = s.assigned > 0 ? ((s.assigned - s.overdue) / s.assigned) * 100 : 100;
      
      if (s.pending >= 30) s.workload = 'OVERLOADED';
      else if (s.pending >= 15) s.workload = 'HIGH';
      else if (s.pending >= 5) s.workload = 'MEDIUM';
      else s.workload = 'LOW';

      if (s.slaCompliance < 70 || s.overdue > 3) s.performance = 'Critical';
      else if (s.slaCompliance < 85 || s.overdue > 0) s.performance = 'Needs Attention';
      else if (s.slaCompliance < 95) s.performance = 'Good';
      else s.performance = 'Excellent';
    });

    return stats;
  }, [admins, grievances]);

  const allStats = useMemo(() => Object.values(adminStatsMap), [adminStatsMap]);

  // KPIs
  const kpis = useMemo(() => {
    return {
      totalAdmins: admins.length,
      activeAdmins: admins.filter(a => a.status === 'Active').length,
      inactiveAdmins: admins.filter(a => a.status !== 'Active').length,
      totalAssigned: allStats.reduce((sum, s) => sum + s.assigned, 0),
      totalPending: allStats.reduce((sum, s) => sum + s.pending, 0),
      totalOverdue: allStats.reduce((sum, s) => sum + s.overdue, 0)
    };
  }, [admins, allStats]);

  // Departments for filter
  const departments = useMemo(() => {
    const depts = new Set(admins.map(a => a.department));
    return ['All', ...Array.from(depts)].filter(Boolean);
  }, [admins]);

  // 2. Filter & Sort
  const filteredAndSortedStats = useMemo(() => {
    let result = allStats;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.admin.name.toLowerCase().includes(q) ||
        s.admin.id.toLowerCase().includes(q) ||
        s.admin.department.toLowerCase().includes(q) ||
        s.admin.district?.toLowerCase().includes(q) ||
        s.admin.state?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(s => s.admin.status === statusFilter);
    }
    if (workloadFilter !== 'All') {
      result = result.filter(s => s.workload === workloadFilter);
    }
    if (performanceFilter !== 'All') {
      result = result.filter(s => s.performance === performanceFilter);
    }
    if (deptFilter !== 'All') {
      result = result.filter(s => s.admin.department === deptFilter);
    }

    result.sort((a, b) => {
      let valA: any = a[sortCol];
      let valB: any = b[sortCol];
      
      // If we are sorting by admin properties
      if (sortCol === 'admin') {
         valA = a.admin.name;
         valB = b.admin.name;
      }
      
      if (valA < valB) return sortDesc ? 1 : -1;
      if (valA > valB) return sortDesc ? -1 : 1;
      return 0;
    });

    return result;
  }, [allStats, searchQuery, statusFilter, workloadFilter, performanceFilter, deptFilter, sortCol, sortDesc]);

  const handleSort = (col: keyof AdminDerivedStats) => {
    if (sortCol === col) setSortDesc(!sortDesc);
    else {
      setSortCol(col);
      setSortDesc(true);
    }
  };

  const getAdminGrievances = (adminId: string) => {
    return grievances.filter(g => g.assignedAdminId === adminId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050B14] flex">
      <SuperAdminSidebar onLogout={handleLogout} />
      
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <SuperAdminHeader />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Admin Management</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Monitor workload, performance and grievance resolution across administrators.</p>
              </div>
            </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{kpis.totalAdmins}</div>
          <div className="text-[10px] uppercase font-bold text-gray-500 mt-1 tracking-wider">Total Admins</div>
        </div>
        <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{kpis.activeAdmins}</div>
          <div className="text-[10px] uppercase font-bold text-gray-500 mt-1 tracking-wider">Active Admins</div>
        </div>
        <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-gray-400 dark:text-gray-600">{kpis.inactiveAdmins}</div>
          <div className="text-[10px] uppercase font-bold text-gray-500 mt-1 tracking-wider">Inactive Admins</div>
        </div>
        <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{kpis.totalAssigned}</div>
          <div className="text-[10px] uppercase font-bold text-gray-500 mt-1 tracking-wider">Total Assigned</div>
        </div>
        <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{kpis.totalPending}</div>
          <div className="text-[10px] uppercase font-bold text-gray-500 mt-1 tracking-wider">Total Pending</div>
        </div>
        <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{kpis.totalOverdue}</div>
          <div className="text-[10px] uppercase font-bold text-gray-500 mt-1 tracking-wider">Total Overdue</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Admin name, ID, Dept, Location..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm px-3 py-2 outline-none">
                <option value="All">Status: All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <select value={workloadFilter} onChange={e => setWorkloadFilter(e.target.value)} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm px-3 py-2 outline-none">
              <option value="All">Workload: All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="OVERLOADED">Overloaded</option>
            </select>
            <select value={performanceFilter} onChange={e => setPerformanceFilter(e.target.value)} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm px-3 py-2 outline-none">
              <option value="All">Performance: All</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Needs Attention">Needs Attention</option>
              <option value="Critical">Critical</option>
            </select>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm px-3 py-2 outline-none max-w-[150px] truncate">
              {departments.map(d => <option key={d} value={d}>{d === 'All' ? 'Dept: All' : d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Admin Table */}
      <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors" onClick={() => handleSort('admin')}>
                  <div className="flex items-center gap-2">Admin <ArrowUpDown size={14} /></div>
                </th>
                <th className="px-6 py-4">Status & Dept</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors" onClick={() => handleSort('assigned')}>
                  <div className="flex items-center gap-2">Assigned <ArrowUpDown size={14} /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors" onClick={() => handleSort('pending')}>
                  <div className="flex items-center gap-2">Pending <ArrowUpDown size={14} /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors" onClick={() => handleSort('resolved')}>
                  <div className="flex items-center gap-2">Resolved <ArrowUpDown size={14} /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors" onClick={() => handleSort('overdue')}>
                  <div className="flex items-center gap-2">Overdue <ArrowUpDown size={14} /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors" onClick={() => handleSort('slaCompliance')}>
                  <div className="flex items-center gap-2">SLA <ArrowUpDown size={14} /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors" onClick={() => handleSort('performance')}>
                  <div className="flex items-center gap-2">Performance <ArrowUpDown size={14} /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredAndSortedStats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No administrators match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredAndSortedStats.map((stat) => (
                  <tr 
                    key={stat.admin.id} 
                    onClick={() => setSelectedAdminStats(stat)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/30 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{stat.admin.name}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{stat.admin.id}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{stat.admin.district}, {stat.admin.state}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        stat.admin.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {stat.admin.status}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{stat.admin.department}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{stat.assigned}</td>
                    <td className="px-6 py-4 font-semibold text-purple-600 dark:text-purple-400">{stat.pending}</td>
                    <td className="px-6 py-4 font-semibold text-green-600 dark:text-green-400">{stat.resolved}</td>
                    <td className="px-6 py-4 font-semibold">
                      <span className={stat.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}>{stat.overdue}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-semibold ${stat.slaCompliance >= 90 ? 'text-green-600 dark:text-green-400' : stat.slaCompliance >= 70 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stat.slaCompliance.toFixed(0)}%
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          stat.performance === 'Excellent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          stat.performance === 'Good' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          stat.performance === 'Needs Attention' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {stat.performance}
                        </span>
                        {stat.workload === 'OVERLOADED' && (
                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Overloaded</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAdminStats && (
        <AdminDetailDrawer 
          stats={selectedAdminStats} 
          grievances={getAdminGrievances(selectedAdminStats.admin.id)}
          onClose={() => setSelectedAdminStats(null)}
          onSelectGrievance={(g) => setSelectedGrievance(g)}
        />
      )}

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
