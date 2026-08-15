import type { Grievance } from './store';

export type SLAStatus = 'Resolved' | 'Overdue' | 'At Risk' | 'On Time';

/**
 * Centralized SLA calculation.
 * Returns the SLA status for a given grievance.
 */
export function getSLAStatus(grievance: Grievance): SLAStatus {
  if (grievance.status === 'Resolved') {
    return 'Resolved';
  }

  if (!grievance.dueAt) {
    // Fallback for mock data that might lack dueAt but has a string sla
    if (grievance.sla.toLowerCase().includes('overdue')) return 'Overdue';
    return 'On Time';
  }

  const due = new Date(grievance.dueAt).getTime();
  const now = new Date().getTime();
  const hoursRemaining = (due - now) / (1000 * 60 * 60);

  if (hoursRemaining < 0) return 'Overdue';
  if (hoursRemaining < 24) return 'At Risk';
  return 'On Time';
}

/**
 * Returns hours remaining (negative if overdue)
 */
export function getSLAHoursRemaining(grievance: Grievance): number {
  if (!grievance.dueAt) return 999;
  return (new Date(grievance.dueAt).getTime() - new Date().getTime()) / (1000 * 60 * 60);
}

/**
 * Returns human-readable SLA text based on the calculation
 */
export function getSLAText(grievance: Grievance): string {
  if (grievance.status === 'Resolved') return 'Resolved';
  if (!grievance.dueAt) return grievance.sla;

  const hoursRemaining = getSLAHoursRemaining(grievance);
  
  if (hoursRemaining < 0) {
    const hrs = Math.abs(Math.floor(hoursRemaining));
    return `Overdue by ${hrs > 24 ? Math.floor(hrs/24) + 'd' : hrs + 'h'}`;
  }
  
  if (hoursRemaining < 24) return `${Math.floor(hoursRemaining)}h remaining`;
  return `${Math.floor(hoursRemaining/24)}d remaining`;
}
