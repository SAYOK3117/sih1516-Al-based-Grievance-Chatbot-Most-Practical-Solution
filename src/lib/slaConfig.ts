export interface SLARule {
  department: string;
  hours: number;
}

// Department SLA configuration (in hours)
export const SLA_RULES: Record<string, number> = {
  "Water Works / Jal Sansthan": 24,
  "UPPCL / Electricity Department": 24,
  "Cyber Cell": 24,
  "PWD": 72,
  "District Magistrate (DM)": 48,
  "Default": 48
};

/**
  * Calculate SLA deadline timestamp for a given department and submission date.
  */
export function calculateSlaDeadline(dept: string, submissionTimeMs: number = Date.now()): number {
  const hours = SLA_RULES[dept] || SLA_RULES["Default"];
  return submissionTimeMs + (hours * 60 * 60 * 1000);
}

/**
  * Format human readable deadline string (e.g. "14 Aug 2026, 8:00 PM")
  */
export function formatSlaDeadline(deadlineMs?: number): string { if (!deadlineMs) return "N/A";
  const date = new Date(deadlineMs);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export interface SLAStatusInfo {
  isBreached: boolean;
  displayText: string;
  badgeColor: string;
  breachDurationText?: string;
  remainingMs: number;
}

/**
  * Compute live status of an SLA countdown given deadline timestamp and current status.
  */
export function getSlaStatus(deadlineMs: number | undefined, status: string): SLAStatusInfo {
  if (!deadlineMs) {
    return {
      isBreached: false,
      displayText: 'N/A',
      badgeColor: 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400',
      remainingMs: 0
    };
  }

  if (status === 'Resolved') {
    return {
      isBreached: false,
      displayText: 'Resolved within SLA',
      badgeColor: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      remainingMs: 0
    };
  }

  const now = Date.now();
  const diffMs = deadlineMs - now;

  if (diffMs <= 0) {
    const overdueMs = Math.abs(diffMs);
    const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
    const overdueMins = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
    
    const breachStr = overdueHours > 0 
      ? `${overdueHours}h ${overdueMins}m` 
      : `${overdueMins}m`;

    return {
      isBreached: true,
      displayText: `⚠️ SLA BREACHED (${breachStr} overdue)`,
      breachDurationText: breachStr,
      badgeColor: 'text-red-600 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 animate-pulse',
      remainingMs: diffMs
    };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const remainingStr = hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;

  const isUrgent = hours < 6;

  return {
    isBreached: false,
    displayText: remainingStr,
    badgeColor: isUrgent 
      ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' 
      : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    remainingMs: diffMs
  };
}
