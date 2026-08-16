import { ShieldAlert, AlertTriangle, Clock, Building2, UserCheck } from 'lucide-react';

export interface EscalationInfoProps {
  reason?: string;
  originalDepartment?: string;
  originalOfficer?: string;
  escalationTime?: string;
  breachDuration?: string;
  showDetails?: boolean;
}

export function EscalationBadge({
  reason = 'SLA deadline exceeded without resolution',
  originalDepartment = 'PWD',
  originalOfficer = 'Officer In-Charge',
  escalationTime = 'Recently',
  breachDuration = 'Overdue by 12 hours',
  showDetails = false
}: EscalationInfoProps) {
  if (!showDetails) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-300 dark:border-red-800 shadow-sm animate-pulse-subtle">
        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
        <ShieldAlert size={14} className="text-red-600 dark:text-red-400" />
        <span>ESCALATED TO DM</span>
      </span>
    );
  }

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/20 border-2 border-red-500/50 rounded-xl p-4 shadow-sm animate-slide-in">
      <div className="flex items-center justify-between mb-3 border-b border-red-200 dark:border-red-900/50 pb-2">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-extrabold text-sm uppercase tracking-wide">
          <ShieldAlert size={18} className="text-red-600 animate-bounce" />
          <span>🔴 ESCALATED TO DISTRICT MAGISTRATE (DM)</span>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-600 text-white shadow-sm">
          HIGHER AUTHORITY ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700 dark:text-gray-300">
        <div className="flex items-start gap-2">
          <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-gray-500 dark:text-gray-400 block text-[10px] uppercase">Escalation Reason</span>
            <span className="font-medium text-red-700 dark:text-red-300">{reason}</span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Clock size={15} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-gray-500 dark:text-gray-400 block text-[10px] uppercase">Breach Duration & Date</span>
            <span className="font-semibold text-amber-700 dark:text-amber-300">{breachDuration} ({escalationTime})</span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Building2 size={15} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-gray-500 dark:text-gray-400 block text-[10px] uppercase">Original Department & Officer</span>
            <span className="font-medium text-gray-900 dark:text-white">{originalDepartment} ({originalOfficer})</span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <UserCheck size={15} className="text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-gray-500 dark:text-gray-400 block text-[10px] uppercase">Escalation Authority</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">District Magistrate (DM)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
