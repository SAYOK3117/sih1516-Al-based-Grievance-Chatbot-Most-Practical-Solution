import type { Grievance, Admin, GrievanceEscalation } from './store';
import { getSLAStatus, getSLAHoursRemaining } from './slaUtils';
export type NotificationType = 
  | 'CRITICAL_SLA_BREACH'
  | 'HIGH_PRIORITY_INACTIVITY'
  | 'SLA_AT_RISK'
  | 'ADMIN_WORKLOAD'
  | 'ESCALATED_GRIEVANCE'
  | 'REOPENED_GRIEVANCE'
  | 'IMPORTANT_UNRESOLVED';

export type NotificationSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  timestamp: string; // ISO date string
  relatedGrievanceId?: string;
  relatedAdminId?: string;
  read: boolean;
}

/**
 * Derives operational notifications based on the current state of grievances and admins.
 * This ensures no backend double-counting.
 * 
 * @param grievances Current grievances from store
 * @param admins Current admins from store
 * @param readNotificationIds Array of IDs that the user has marked as read
 * @returns Array of sorted AppNotifications (Critical first, then newer timestamp)
 */
export function deriveNotifications(grievances: Grievance[], admins: Admin[], escalations: GrievanceEscalation[], readNotificationIds: string[]): AppNotification[] {
  const notifications: AppNotification[] = [];

  const now = new Date();

  // Helper to add notification
  const addNotif = (notif: Omit<AppNotification, 'read'>) => {
    notifications.push({
      ...notif,
      read: readNotificationIds.includes(notif.id)
    });
  };

  // Analyze Grievances
  grievances.forEach(g => {
    if (g.status === 'Resolved') {
      // For resolved grievances, we might only care if it was recently reopened then resolved again, 
      // but for now, active issues are the focus of notifications.
      return;
    }

    const isCritical = g.priority === 'Critical';
    const isHigh = g.priority === 'High';
    const slaStatus = getSLAStatus(g);
    const isOverdue = slaStatus === 'Overdue';
    const hoursToSLA = getSLAHoursRemaining(g);

    // 1. CRITICAL_SLA_BREACH
    if (isOverdue && isCritical) {
      addNotif({
        id: `${g.id}-critical-sla`,
        type: 'CRITICAL_SLA_BREACH',
        title: 'Critical SLA Breach',
        message: `${g.id} has exceeded its SLA. Immediate action required.`,
        severity: 'CRITICAL',
        timestamp: g.updatedAt || g.createdAt || new Date().toISOString(),
        relatedGrievanceId: g.id,
        relatedAdminId: g.assignedAdminId
      });
    }
    // 2. SLA_AT_RISK
    else if (!isOverdue && hoursToSLA > 0 && hoursToSLA < 12) {
      addNotif({
        id: `${g.id}-sla-risk`,
        type: 'SLA_AT_RISK',
        title: 'SLA At Risk',
        message: `${g.id} is approaching its SLA deadline (< 12 hours).`,
        severity: 'WARNING',
        timestamp: g.updatedAt || g.createdAt || new Date().toISOString(),
        relatedGrievanceId: g.id,
        relatedAdminId: g.assignedAdminId
      });
    }
    
    // 3. ESCALATED_GRIEVANCE
    if (g.escalated) {
      // Check if it's currently unresolved in escalations
      const activeEscalations = escalations.filter(e => e.grievanceId === g.id && e.status !== 'Resolved');
      
      if (activeEscalations.length > 0) {
        addNotif({
          id: `${g.id}-escalated`,
        type: 'ESCALATED_GRIEVANCE',
        title: 'Grievance Escalated',
        message: `${g.id} has been escalated and requires attention.`,
        severity: 'WARNING',
        timestamp: g.updatedAt || g.createdAt || new Date().toISOString(),
        relatedGrievanceId: g.id,
        relatedAdminId: g.assignedAdminId
      });
      }
    }

    // 4. REOPENED_GRIEVANCE
    if (g.reopened) {
      addNotif({
        id: `${g.id}-reopened`,
        type: 'REOPENED_GRIEVANCE',
        title: 'Grievance Reopened',
        message: `${g.id} was reopened by the citizen.`,
        severity: 'INFO',
        timestamp: g.updatedAt || g.createdAt || new Date().toISOString(),
        relatedGrievanceId: g.id,
        relatedAdminId: g.assignedAdminId
      });
    }

    // 5. HIGH_PRIORITY_INACTIVITY
    if ((isCritical || isHigh) && !isOverdue && g.status === 'Pending' && !g.assignedAdminId) {
      // It's critical/high and nobody has taken it
      addNotif({
        id: `${g.id}-hp-inactivity`,
        type: 'HIGH_PRIORITY_INACTIVITY',
        title: 'High Priority Unassigned',
        message: `${g.priority} grievance ${g.id} is currently unassigned.`,
        severity: 'WARNING',
        timestamp: g.updatedAt || g.createdAt || new Date().toISOString(),
        relatedGrievanceId: g.id
      });
    }
  });

  // Analyze Admins (Workload)
  const adminWorkload: Record<string, { total: number, overdue: number }> = {};
  grievances.forEach(g => {
    if (g.status !== 'Resolved' && g.assignedAdminId) {
      if (!adminWorkload[g.assignedAdminId]) adminWorkload[g.assignedAdminId] = { total: 0, overdue: 0 };
      adminWorkload[g.assignedAdminId].total++;
      
      const isOverdue = g.dueAt ? new Date(g.dueAt) < now : g.sla.toLowerCase().includes('overdue');
      if (isOverdue) adminWorkload[g.assignedAdminId].overdue++;
    }
  });

  Object.entries(adminWorkload).forEach(([adminId, stats]) => {
    if (stats.overdue >= 3) {
      const admin = admins.find(a => a.id === adminId);
      addNotif({
        id: `admin-${adminId}-overdue-workload`,
        type: 'ADMIN_WORKLOAD',
        title: 'Admin Workload Concern',
        message: `${admin?.name || adminId} currently has ${stats.overdue} overdue grievances.`,
        severity: 'WARNING',
        timestamp: new Date().toISOString(), // This is dynamic, so it might always show as "now" unless we persist generating times. For prototype, it's fine.
        relatedAdminId: adminId
      });
    }
  });

  // Sort: CRITICAL first, then by timestamp (newest first)
  const severityScore = { CRITICAL: 3, WARNING: 2, INFO: 1 };
  notifications.sort((a, b) => {
    if (severityScore[a.severity] !== severityScore[b.severity]) {
      return severityScore[b.severity] - severityScore[a.severity];
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return notifications;
}
