import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { getSLAStatus } from './slaUtils';

export interface Message {
  id: string;
  sender: 'Admin' | 'Citizen';
  text: string;
  timestamp: string;
}

export interface GrievanceActivity {
  id: string;
  type: 'submitted' | 'assigned' | 'reassigned' | 'reminder' | 'escalated' | 'reopened' | 'status_change';
  actor: 'Citizen' | 'Admin' | 'Super Admin' | 'System';
  actorName: string;
  description: string;
  timestamp: string;
}

export interface GrievanceEscalation {
  id: string;
  grievanceId: string;
  reason: string;
  escalatedBy: string;
  escalatedAt: string;
  escalatedTo?: string;
  status: 'Pending' | 'Under Review' | 'Action Taken' | 'Resolved';
  priority: 'High' | 'Critical';
  notes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface Grievance {
  id: string;
  title: string;
  citizen: string;
  dept: string;
  date: string;
  status: string;
  priority: string;
  sla: string;
  slaColor: string;
  aiSummary: string;
  location: string;
  messages: Message[];
  activities?: GrievanceActivity[];

  assignedAdminId?: string;
  assignedAdminName?: string;
  departmentId?: string;
  state?: string;
  district?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
  dueAt?: string;
  escalated?: boolean;
  escalatedAt?: string;
  escalatedBy?: string;
  escalationReason?: string;
  reopened?: boolean;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenReason?: string;
}

export interface Admin {
  id: string;
  name: string;
  department: string;
  departmentId: string;
  state: string;
  district: string;
  phone?: string;
  email?: string;
  status: 'Active' | 'Inactive';
  assignedGrievances: number;
  resolvedGrievances: number;
  pendingGrievances: number;
  overdueGrievances: number;
  averageResolutionHours: number;
  slaCompliance: number;
}

interface StoreContextType {
  grievances: Grievance[];
  admins: Admin[];
  escalations: GrievanceEscalation[];
  readNotificationIds: string[];
  addGrievance: (g: Grievance) => void;
  updateGrievanceStatus: (id: string, status: string) => void;
  addMessage: (grievanceId: string, message: Message) => void;
  assignGrievance: (grievanceId: string, adminId: string) => void;
  reassignGrievance: (grievanceId: string, adminId: string) => void;
  escalateGrievance: (grievanceId: string, reason?: string) => void;
  updateEscalationStatus: (escalationId: string, status: 'Under Review' | 'Action Taken' | 'Resolved', notes?: string) => void;
  reopenGrievance: (grievanceId: string, reason?: string) => void;
  remindAdmin: (grievanceId: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: (ids: string[]) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

import { initialAdmins, initialGrievances, DEMO_VERSION } from './demoData';


const generateId = () => Math.random().toString(36).substr(2, 9);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [grievances, setGrievances] = useState<Grievance[]>(() => {
    const version = localStorage.getItem('suvas_demo_version');
    if (version !== DEMO_VERSION) {
      localStorage.setItem('suvas_demo_version', DEMO_VERSION);
      localStorage.setItem('suvas_grievances', JSON.stringify(initialGrievances));
      localStorage.setItem('suvas_admins', JSON.stringify(initialAdmins));
      localStorage.removeItem('suvas_escalations'); // reset escalations to auto-derive
      return initialGrievances;
    }
    const saved = localStorage.getItem('suvas_grievances');
    if (saved) return JSON.parse(saved);
    return initialGrievances;
  });

  const [admins, setAdmins] = useState<Admin[]>(() => {
    const saved = localStorage.getItem('suvas_admins');
    if (saved) return JSON.parse(saved);
    return initialAdmins;
  });

  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  
  const [escalations, setEscalations] = useState<GrievanceEscalation[]>(() => {
    const saved = localStorage.getItem('suvas_escalations');
    if (saved) return JSON.parse(saved);
    
    // Backward compatibility: Derive from existing escalated grievances
    const savedGrievancesStr = localStorage.getItem('suvas_grievances');
    const existingGrievances: Grievance[] = savedGrievancesStr ? JSON.parse(savedGrievancesStr) : initialGrievances;
    
    return existingGrievances.filter(g => g.escalated).map(g => ({
      id: `ESC-${g.id.replace('G-', '').replace('-', '')}`,
      grievanceId: g.id,
      reason: (g as any).escalationReason || 'System identified escalation',
      escalatedBy: g.escalatedBy || 'System',
      escalatedAt: g.escalatedAt || new Date().toISOString(),
      escalatedTo: 'Senior Department Authority',
      status: 'Pending',
      priority: g.priority === 'Critical' ? 'Critical' : 'High'
    }));
  });

  useEffect(() => {
    localStorage.setItem('suvas_grievances', JSON.stringify(grievances));

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'suvas_grievances' && e.newValue) {
        setGrievances(JSON.parse(e.newValue));
      }
      if (e.key === 'suvas_admins' && e.newValue) {
        setAdmins(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [grievances, admins]);

  useEffect(() => {
    localStorage.setItem('suvas_admins', JSON.stringify(admins));
  }, [admins]);

  useEffect(() => {
    localStorage.setItem('suvas_escalations', JSON.stringify(escalations));
  }, [escalations]);

  const addGrievance = (g: Grievance) => setGrievances(prev => [g, ...prev]);

  const updateGrievanceStatus = (id: string, status: string) => {
    setGrievances(prev => prev.map(g => {
      if (g.id === id) {
        const activity: GrievanceActivity = {
          id: generateId(),
          type: 'status_change',
          actor: 'Super Admin',
          actorName: 'Super Admin',
          description: `Grievance status updated to ${status}.`,
          timestamp: new Date().toISOString()
        };
        const isResolved = status === 'Resolved';
        return { 
          ...g, 
          status, 
          updatedAt: new Date().toISOString(),
          sla: isResolved ? 'Resolved' : g.sla,
          slaColor: isResolved ? 'green' : g.slaColor,
          activities: [...(g.activities || []), activity]
        };
      }
      return g;
    }));
  };

  const addMessage = (id: string, message: Message) => {
    setGrievances(prev => prev.map(g => {
      if (g.id === id) {
        return { ...g, messages: [...g.messages, message], updatedAt: new Date().toISOString() };
      }
      return g;
    }));
  };

  const assignGrievance = (grievanceId: string, adminId: string) => {
    setGrievances(prev => {
      const gToUpdate = prev.find(g => g.id === grievanceId);
      if (!gToUpdate) return prev;

      const admin = admins.find(a => a.id === adminId);
      if (!admin) return prev;
      
      const activity: GrievanceActivity = {
        id: generateId(),
        type: 'assigned',
        actor: 'System',
        actorName: 'System',
        description: `Grievance assigned to ${admin.name}`,
        timestamp: new Date().toISOString()
      };

      return prev.map(g => {
        if (g.id === grievanceId) {
          return {
            ...g,
            assignedAdminId: admin.id,
            assignedAdminName: admin.name,
            departmentId: admin.departmentId,
            dept: admin.department,
            updatedAt: new Date().toISOString(),
            activities: [...(g.activities || []), activity]
          };
        }
        return g;
      });
    });
  };

  const reassignGrievance = (grievanceId: string, adminId: string) => {
    setGrievances(prev => {
      const gToUpdate = prev.find(g => g.id === grievanceId);
      if (!gToUpdate) return prev;

      const newAdmin = admins.find(a => a.id === adminId);
      if (!newAdmin) return prev;
      
      const oldAdminName = gToUpdate.assignedAdminName || 'Unassigned';
      
      const activity: GrievanceActivity = {
        id: generateId(),
        type: 'reassigned',
        actor: 'Super Admin',
        actorName: 'Super Admin',
        description: `Grievance reassigned from ${oldAdminName} to ${newAdmin.name} by Super Admin.`,
        timestamp: new Date().toISOString()
      };

      return prev.map(g => {
        if (g.id === grievanceId) {
          return {
            ...g,
            assignedAdminId: newAdmin.id,
            assignedAdminName: newAdmin.name,
            departmentId: newAdmin.departmentId,
            dept: newAdmin.department,
            updatedAt: new Date().toISOString(),
            activities: [...(g.activities || []), activity]
          };
        }
        return g;
      });
    });
  };
  const escalateGrievance = (grievanceId: string, reason?: string) => {
    setGrievances(prev => prev.map(g => {
      if (g.id === grievanceId) {
        // Only escalate if not already escalated to prevent duplicate escalation records
        if (g.escalated) return g;

        const activity: GrievanceActivity = {
          id: generateId(),
          type: 'escalated',
          actor: 'Super Admin',
          actorName: 'Super Admin',
          description: `Grievance escalated by Super Admin. Reason: ${reason || 'Not specified'}`,
          timestamp: new Date().toISOString()
        };
        
        // Push to escalations array
        setEscalations(prevEsc => [{
          id: `ESC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          grievanceId: g.id,
          reason: reason || 'Not specified',
          escalatedBy: 'Super Admin',
          escalatedAt: new Date().toISOString(),
          escalatedTo: 'Senior Department Authority',
          status: 'Pending',
          priority: g.priority === 'Critical' ? 'Critical' : 'High'
        }, ...prevEsc]);

        return {
          ...g,
          escalated: true,
          escalatedAt: new Date().toISOString(),
          escalatedBy: 'Super Admin',
          updatedAt: new Date().toISOString(),
          activities: [...(g.activities || []), activity]
        };
      }
      return g;
    }));
  };

  const reopenGrievance = (grievanceId: string, reason?: string) => {
    setGrievances(prev => prev.map(g => {
      if (g.id === grievanceId) {
        const activity: GrievanceActivity = {
          id: generateId(),
          type: 'reopened',
          actor: 'Super Admin',
          actorName: 'Super Admin',
          description: `Grievance reopened by Super Admin. Reason: ${reason || 'Not specified'}`,
          timestamp: new Date().toISOString()
        };
        return {
          ...g,
          reopened: true,
          reopenedAt: new Date().toISOString(),
          reopenReason: reason,
          reopenedBy: 'Super Admin',
          status: 'In Progress',
          updatedAt: new Date().toISOString(),
          activities: [...(g.activities || []), activity]
        };
      }
      return g;
    }));
  };

  const remindAdmin = (grievanceId: string) => {
    setGrievances(prev => prev.map(g => {
      if (g.id === grievanceId && g.assignedAdminName) {
        const activity: GrievanceActivity = {
          id: generateId(),
          type: 'reminder',
          actor: 'Super Admin',
          actorName: 'Super Admin',
          description: `Super Admin sent a reminder to ${g.assignedAdminName}.`,
          timestamp: new Date().toISOString()
        };
        return {
          ...g,
          updatedAt: new Date().toISOString(),
          activities: [...(g.activities || []), activity]
        };
      }
      return g;
    }));
  };

  const markNotificationAsRead = (id: string) => {
    setReadNotificationIds(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const markAllNotificationsAsRead = (ids: string[]) => {
    setReadNotificationIds(prev => {
      const newIds = ids.filter(id => !prev.includes(id));
      return [...prev, ...newIds];
    });
  };

  const updateEscalationStatus = (escalationId: string, status: 'Under Review' | 'Action Taken' | 'Resolved', notes?: string) => {
    setEscalations(prev => prev.map(esc => {
      if (esc.id === escalationId) {
        const timestamp = new Date().toISOString();
        const updated = { ...esc, status };
        
        if (notes) updated.notes = (updated.notes ? updated.notes + '\n\n' : '') + `[${new Date().toLocaleDateString()}] ${notes}`;
        
        if (status === 'Resolved') {
          updated.resolvedAt = timestamp;
          updated.resolvedBy = 'Super Admin';
        }
        
        // Also add an activity to the underlying grievance
        setGrievances(prevG => prevG.map(g => {
          if (g.id === esc.grievanceId) {
            const activity: GrievanceActivity = {
              id: generateId(),
              type: status === 'Resolved' ? 'status_change' : 'escalated',
              actor: 'Super Admin',
              actorName: 'Super Admin',
              description: status === 'Resolved' 
                ? `Escalation resolved by Super Admin${notes ? ': ' + notes : '.'}` 
                : (status === 'Action Taken' ? `Action taken on escalation: ${notes}` : `Super Admin started review of escalation.`),
              timestamp
            };
            return {
              ...g,
              updatedAt: timestamp,
              activities: [...(g.activities || []), activity]
            };
          }
          return g;
        }));
        
        return updated;
      }
      return esc;
    }));
  };

  const derivedAdmins = useMemo(() => {
    return admins.map(admin => {
      let assigned = 0;
      let resolved = 0;
      let pending = 0;
      let overdue = 0;

      grievances.forEach(g => {
        if (g.assignedAdminId === admin.id) {
          assigned++;
          if (g.status === 'Resolved') {
            resolved++;
          } else {
            pending++;
            if (getSLAStatus(g) === 'Overdue') {
              overdue++;
            }
          }
        }
      });

      return {
        ...admin,
        assignedGrievances: assigned,
        resolvedGrievances: resolved,
        pendingGrievances: pending,
        overdueGrievances: overdue
      };
    });
  }, [admins, grievances]);

  return (
    <StoreContext.Provider value={{
      grievances, admins: derivedAdmins, escalations, addGrievance, updateGrievanceStatus, addMessage,
      assignGrievance, reassignGrievance, escalateGrievance, updateEscalationStatus, reopenGrievance, remindAdmin,
      readNotificationIds, markNotificationAsRead, markAllNotificationsAsRead
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
