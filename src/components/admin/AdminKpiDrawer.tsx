import { useState, useMemo } from 'react';
import { 
  X, Search, Clock, CheckCircle2, FileText, 
  ShieldAlert, Layers, MapPin, ChevronRight, User, AlertCircle
} from 'lucide-react';
import type { Grievance, MasterIssue } from '../../lib/store';
import { getSLAStatus } from '../../lib/slaUtils';
import { Input } from '../ui/Input';

export type AdminKpiType = 'total' | 'overdue' | 'master_issues' | 'resolved' | 'escalated';

interface AdminKpiDrawerProps {
  type: AdminKpiType | null;
  onClose: () => void;
  onSelectGrievance: (g: Grievance) => void;
  onUpdateMasterIssueStatus?: (id: string, status: 'Filed' | 'In Progress' | 'Resolved' | 'Escalated to DM') => void;
  grievances: Grievance[];
  masterIssues: MasterIssue[];
  departmentName: string;
  isDM: boolean;
}

export function AdminKpiDrawer({
  type,
  onClose,
  onSelectGrievance,
  onUpdateMasterIssueStatus,
  grievances,
  masterIssues,
  departmentName,
  isDM
}: AdminKpiDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');

  const isMasterIssues = type === 'master_issues';

  // Compute title & header metadata
  const meta = useMemo(() => {
    switch (type) {
      case 'overdue':
        return {
          title: 'SLA Breached Complaints',
          description: `Complaints in ${departmentName} exceeding resolution deadlines requiring immediate action.`,
          icon: Clock,
          colorClass: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
          badgeText: 'SLA Breached',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
        };
      case 'resolved':
        return {
          title: 'Resolved Department Complaints',
          description: `Complaints successfully resolved and closed by ${departmentName}.`,
          icon: CheckCircle2,
          colorClass: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30',
          badgeText: 'Resolved',
          badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
        };
      case 'escalated':
        return {
          title: 'Escalated to DM Authority',
          description: 'High-priority complaints escalated to the District Magistrate for expedited intervention.',
          icon: ShieldAlert,
          colorClass: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
          badgeText: 'DM Escalated',
          badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
        };
      case 'master_issues':
        return {
          title: 'Grouped Master Issues',
          description: `Aggregated problem hotspots clustering multiple duplicate complaints in ${departmentName}.`,
          icon: Layers,
          colorClass: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
          badgeText: 'Master Issues',
          badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
        };
      case 'total':
      default:
        return {
          title: isDM ? 'All District Complaints' : `${departmentName} Complaints`,
          description: `All active and filed grievance records assigned to ${departmentName}.`,
          icon: AlertCircle,
          colorClass: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
          badgeText: 'All Assigned',
          badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
        };
    }
  }, [type, departmentName, isDM]);

  // Filtered grievances
  const filteredGrievances = useMemo(() => {
    if (isMasterIssues) return [];

    let list = grievances;

    if (type === 'overdue') {
      list = list.filter(g => g.status === 'SLA Breached' || (g.slaDeadline && Date.now() > g.slaDeadline && g.status !== 'Resolved') || getSLAStatus(g) === 'Overdue');
    } else if (type === 'resolved') {
      list = list.filter(g => g.status === 'Resolved');
    } else if (type === 'escalated') {
      list = list.filter(g => g.escalatedToDM);
    }

    if (priorityFilter !== 'All') {
      list = list.filter(g => g.priority === priorityFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(g =>
        g.id.toLowerCase().includes(q) ||
        g.title.toLowerCase().includes(q) ||
        (g.citizen && g.citizen.toLowerCase().includes(q)) ||
        (g.dept && g.dept.toLowerCase().includes(q)) ||
        (g.location && g.location.toLowerCase().includes(q)) ||
        (g.aiSummary && g.aiSummary.toLowerCase().includes(q))
      );
    }

    return list;
  }, [grievances, type, isMasterIssues, priorityFilter, searchQuery]);

  // Filtered Master Issues
  const filteredMasterIssuesList = useMemo(() => {
    if (!isMasterIssues) return [];

    let list = masterIssues;

    if (priorityFilter !== 'All') {
      list = list.filter(m => m.priority === priorityFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m =>
        m.id.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.dept.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [masterIssues, isMasterIssues, priorityFilter, searchQuery]);

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
                  {isMasterIssues ? `${filteredMasterIssuesList.length} master issues` : `${filteredGrievances.length} complaints`}
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

        {/* Search & Filter bar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0F1620] space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              type="text"
              placeholder={isMasterIssues ? "Search master issues by ID, title, location..." : "Search by complaint ID, citizen, title, location..."}
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

          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            <span className="text-gray-400 font-medium mr-1">Priority:</span>
            {['All', 'Critical', 'High', 'Medium', 'Low'].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  priorityFilter === p
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-[#0A1017]">
          {isMasterIssues ? (
            filteredMasterIssuesList.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                <Layers size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="font-semibold text-base">No master issues found</p>
                <p className="text-xs mt-1">No grouped master tickets match the current search.</p>
              </div>
            ) : (
              filteredMasterIssuesList.map((mi) => (
                <div
                  key={mi.id}
                  className="p-4 bg-white dark:bg-[#141C27] border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary dark:text-blue-400">
                        {mi.id}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        mi.priority === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        mi.priority === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {mi.priority} Priority
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                        {mi.status}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded">
                      Linked: {mi.linkedComplaintIds.length} complaints
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                      {mi.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <MapPin size={13} className="text-gray-400" /> {mi.location} • {mi.dept}
                    </p>
                  </div>

                  {/* Actions for Master Issue */}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                    <div className="flex gap-1.5 flex-wrap">
                      {mi.status !== 'Resolved' && (
                        <button
                          onClick={() => onUpdateMasterIssueStatus && onUpdateMasterIssueStatus(mi.id, 'Resolved')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 dark:text-emerald-300 rounded text-xs font-semibold transition-colors"
                        >
                          Mark All Resolved
                        </button>
                      )}
                      {mi.status === 'Filed' && (
                        <button
                          onClick={() => onUpdateMasterIssueStatus && onUpdateMasterIssueStatus(mi.id, 'In Progress')}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-300 rounded text-xs font-semibold transition-colors"
                        >
                          Start Investigation
                        </button>
                      )}
                    </div>

                    <span className="text-[11px] text-gray-400 font-mono">
                      {mi.createdAt}
                    </span>
                  </div>
                </div>
              ))
            )
          ) : (
            filteredGrievances.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                <FileText size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="font-semibold text-base">No complaints found</p>
                <p className="text-xs mt-1">Try adjusting the search query or filters.</p>
              </div>
            ) : (
              filteredGrievances.map((c) => {
                const slaStatus = getSLAStatus(c);

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectGrievance(c);
                      onClose();
                    }}
                    className="p-4 bg-white dark:bg-[#141C27] border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md hover:border-primary/50 dark:hover:border-blue-500/50 transition-all cursor-pointer group space-y-3"
                  >
                    {/* Top Row: ID, Badges, SLA */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary dark:text-blue-400">
                          {c.id}
                        </span>
                        
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          c.priority === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          c.priority === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          c.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {c.priority} Priority
                        </span>

                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          c.status === 'In Progress' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                          c.status === 'SLA Breached' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {c.status}
                        </span>

                        {c.escalatedToDM && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 flex items-center gap-1">
                            <ShieldAlert size={11} /> DM ESCALATED
                          </span>
                        )}
                      </div>

                      {/* SLA Indicator */}
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          slaStatus === 'Overdue' || c.status === 'SLA Breached' ? 'bg-red-500 animate-pulse' :
                          slaStatus === 'At Risk' ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`} />
                        <span className={`font-semibold ${
                          slaStatus === 'Overdue' || c.status === 'SLA Breached' ? 'text-red-600 dark:text-red-400' :
                          slaStatus === 'At Risk' ? 'text-amber-600 dark:text-amber-400' :
                          'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {slaStatus}
                        </span>
                      </div>
                    </div>

                    {/* Title & AI Summary */}
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {c.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                        {c.priorityReason || c.aiSummary}
                      </p>
                    </div>

                    {/* Footer Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800/60 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300 font-medium">
                          <User size={13} className="text-gray-400" />
                          {c.citizen}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-gray-400" />
                          {c.location}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-primary dark:text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                        <span>Open & Manage</span>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0F1620] flex justify-between items-center text-xs text-gray-500">
          <span>Click any complaint to open management & reply panel</span>
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
