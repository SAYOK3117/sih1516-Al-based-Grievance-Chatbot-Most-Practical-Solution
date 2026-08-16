import { useState, useMemo } from 'react';
import { 
  X, Search, Clock, CheckCircle2, AlertTriangle, FileText, 
  ShieldAlert, Users, Building2, MapPin, ChevronRight, User
} from 'lucide-react';
import type { Grievance, Admin } from '../../lib/store';
import { getSLAStatus } from '../../lib/slaUtils';
import { Input } from '../ui/Input';

export type KpiFilterType = 'all' | 'active' | 'resolved' | 'overdue' | 'escalated' | 'total_admins' | 'active_admins';

interface KpiGrievanceDrawerProps {
  type: KpiFilterType | null;
  onClose: () => void;
  onSelectGrievance: (g: Grievance) => void;
  onSelectAdmin?: (a: Admin) => void;
  grievances: Grievance[];
  admins: Admin[];
}

export function KpiGrievanceDrawer({
  type,
  onClose,
  onSelectGrievance,
  onSelectAdmin,
  grievances,
  admins
}: KpiGrievanceDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const isAdminsType = type === 'total_admins' || type === 'active_admins';

  // Compute title & header metadata
  const meta = useMemo(() => {
    switch (type) {
      case 'active':
        return {
          title: 'Active & In-Progress Grievances',
          description: 'Grievances currently under investigation and resolution across all departments.',
          icon: Clock,
          colorClass: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
          badgeText: 'Active',
          badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
        };
      case 'resolved':
        return {
          title: 'Resolved Grievances',
          description: 'Successfully addressed grievances with full resolution receipts.',
          icon: CheckCircle2,
          colorClass: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
          badgeText: 'Resolved',
          badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
        };
      case 'overdue':
        return {
          title: 'Overdue & SLA Breached Grievances',
          description: 'Grievances exceeding standard turnaround deadlines requiring immediate intervention.',
          icon: AlertTriangle,
          colorClass: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
          badgeText: 'SLA Overdue',
          badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
        };
      case 'escalated':
        return {
          title: 'Escalated Grievances',
          description: 'Grievances escalated to higher administrative authorities or DM.',
          icon: ShieldAlert,
          colorClass: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
          badgeText: 'Escalated',
          badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
        };
      case 'total_admins':
        return {
          title: 'National Administrator Registry',
          description: 'All registered departmental and district administrators in the system.',
          icon: Users,
          colorClass: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
          badgeText: 'All Admins',
          badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
        };
      case 'active_admins':
        return {
          title: 'Active Administrators',
          description: 'Administrators currently handling active grievance workloads.',
          icon: Users,
          colorClass: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
          badgeText: 'Active Admins',
          badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
        };
      case 'all':
      default:
        return {
          title: 'All National Grievances',
          description: 'Complete centralized registry of all filed complaints across India.',
          icon: FileText,
          colorClass: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
          badgeText: 'Total Registry',
          badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
        };
    }
  }, [type]);

  // Filtered Grievances
  const filteredGrievances = useMemo(() => {
    if (isAdminsType) return [];

    let list = grievances;

    if (type === 'active') {
      list = list.filter(g => g.status !== 'Resolved');
    } else if (type === 'resolved') {
      list = list.filter(g => g.status === 'Resolved');
    } else if (type === 'overdue') {
      list = list.filter(g => g.status !== 'Resolved' && getSLAStatus(g) === 'Overdue');
    } else if (type === 'escalated') {
      list = list.filter(g => g.escalated && g.status !== 'Resolved');
    }

    if (priorityFilter !== 'All') {
      list = list.filter(g => g.priority === priorityFilter);
    }

    if (statusFilter !== 'All') {
      list = list.filter(g => g.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(g => 
        g.id.toLowerCase().includes(q) ||
        g.title.toLowerCase().includes(q) ||
        (g.citizen && g.citizen.toLowerCase().includes(q)) ||
        (g.dept && g.dept.toLowerCase().includes(q)) ||
        (g.location && g.location.toLowerCase().includes(q)) ||
        (g.state && g.state.toLowerCase().includes(q)) ||
        (g.district && g.district.toLowerCase().includes(q)) ||
        (g.assignedAdminName && g.assignedAdminName.toLowerCase().includes(q))
      );
    }

    return list;
  }, [grievances, type, isAdminsType, priorityFilter, statusFilter, searchQuery]);

  // Filtered Admins
  const filteredAdmins = useMemo(() => {
    if (!isAdminsType) return [];

    let list = admins;
    if (type === 'active_admins') {
      list = list.filter(a => a.status === 'Active');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        a.id.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.department.toLowerCase().includes(q) ||
        (a.district && a.district.toLowerCase().includes(q)) ||
        (a.state && a.state.toLowerCase().includes(q))
      );
    }

    return list;
  }, [admins, isAdminsType, type, searchQuery]);

  if (!type) return null;

  const Icon = meta.icon;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/60 backdrop-blur-sm transition-opacity">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#0F1620] h-full shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300 border-l border-gray-200 dark:border-gray-800"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/30 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${meta.colorClass} shadow-sm shrink-0 mt-0.5`}>
              <Icon size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${meta.badgeClass}`}>
                  {meta.badgeText}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {isAdminsType ? `${filteredAdmins.length} administrators` : `${filteredGrievances.length} grievances`}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                {meta.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md">
                {meta.description}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            aria-label="Close panel"
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Sub-filters */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0F1620] space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              type="text"
              placeholder={isAdminsType ? "Search by name, ID, department, district..." : "Search by ID, title, citizen, department, location..."}
              className="pl-9 text-sm h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                Clear
              </button>
            )}
          </div>

          {!isAdminsType && (
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-gray-400 font-medium mr-1">Priority:</span>
                {['All', 'Critical', 'High', 'Medium', 'Low'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      priorityFilter === p
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {type === 'all' && (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-gray-400 font-medium mr-1">Status:</span>
                  {['All', 'Pending', 'In Progress', 'Resolved'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                        statusFilter === s
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-[#0A1017]">
          {isAdminsType ? (
            filteredAdmins.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                <Users size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="font-semibold text-base">No administrators found</p>
                <p className="text-xs mt-1">Try adjusting your search query.</p>
              </div>
            ) : (
              filteredAdmins.map((admin) => (
                <div
                  key={admin.id}
                  onClick={() => onSelectAdmin && onSelectAdmin(admin)}
                  className="p-4 bg-white dark:bg-[#141C27] border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm">
                        {admin.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {admin.name}
                          </h4>
                          <span className="font-mono text-xs text-gray-400">{admin.id}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {admin.department} • {admin.district}, {admin.state}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        admin.status === 'Active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {admin.status}
                      </span>
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>
              ))
            )
          ) : filteredGrievances.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <FileText size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="font-semibold text-base">No grievances found</p>
              <p className="text-xs mt-1">Try clearing filters or search query.</p>
            </div>
          ) : (
            filteredGrievances.map((grievance) => {
              const slaStatus = getSLAStatus(grievance);

              return (
                <div
                  key={grievance.id}
                  onClick={() => onSelectGrievance(grievance)}
                  className="p-4 bg-white dark:bg-[#141C27] border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer group space-y-3"
                >
                  {/* Top Row: ID, Badges, SLA */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                        {grievance.id}
                      </span>
                      
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        grievance.priority === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        grievance.priority === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        grievance.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {grievance.priority}
                      </span>

                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        grievance.status === 'Resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        grievance.status === 'In Progress' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {grievance.status}
                      </span>

                      {grievance.escalated && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 flex items-center gap-1">
                          <ShieldAlert size={11} /> ESCALATED
                        </span>
                      )}
                    </div>

                    {/* SLA Indicator */}
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        slaStatus === 'Overdue' ? 'bg-red-500 animate-pulse' :
                        slaStatus === 'At Risk' ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`} />
                      <span className={`font-semibold ${
                        slaStatus === 'Overdue' ? 'text-red-600 dark:text-red-400' :
                        slaStatus === 'At Risk' ? 'text-amber-600 dark:text-amber-400' :
                        'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {slaStatus}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                      {grievance.title}
                    </h4>
                    {grievance.aiSummary && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                        {grievance.aiSummary}
                      </p>
                    )}
                  </div>

                  {/* Footer Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800/60 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300 font-medium">
                        <Building2 size={13} className="text-gray-400" />
                        {grievance.dept}
                      </span>
                      {(grievance.district || grievance.location) && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-gray-400" />
                          {grievance.district || grievance.location}, {grievance.state}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {grievance.assignedAdminName ? (
                        <span className="flex items-center gap-1 font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded text-[11px]">
                          <User size={11} /> {grievance.assignedAdminName}
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                          Unassigned
                        </span>
                      )}
                      <span className="text-purple-600 dark:text-purple-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Details <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0F1620] flex justify-between items-center text-xs text-gray-500">
          <span>Click any item to view complete details & perform interventions</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
}
