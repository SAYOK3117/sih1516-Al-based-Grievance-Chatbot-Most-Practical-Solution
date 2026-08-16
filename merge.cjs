const fs = require('fs');

const storePath = 'src/lib/store.tsx';
let storeContent = fs.readFileSync(storePath, 'utf8');

const interfacesToAdd = `
export interface GrievanceActivity {
  id: string;
  type: 'reassigned' | 'escalated' | 'status_change' | 'note' | 'reminder' | 'reopened';
  actor: string;
  actorName?: string;
  description: string;
  timestamp: string;
}

export interface Admin {
  id: string;
  name: string;
  role: 'super_admin' | 'admin';
  department: string;
  departmentId: string;
  district: string;
  status: 'Active' | 'Inactive';
  lastActive: string;
  assignedGrievances?: number;
  resolvedGrievances?: number;
  pendingGrievances?: number;
  overdueGrievances?: number;
}

export interface Escalation {
  id: string;
  grievanceId: string;
  reason: string;
  escalatedBy: string;
  escalatedAt: string;
  escalatedTo: string;
  status: 'Pending' | 'Under Review' | 'Action Taken' | 'Resolved';
  priority: 'High' | 'Critical';
  notes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}
`;

storeContent = storeContent.replace('export interface MasterIssue {', interfacesToAdd + '\nexport interface MasterIssue {');

const grievancePropsToAdd = `  assignedAdminName?: string;
  departmentId?: string;
  escalated?: boolean;
  reopened?: boolean;
  reopenedAt?: string;
  reopenReason?: string;
  reopenedBy?: string;
  activities?: GrievanceActivity[];
  voiceAudioUrl?: string;`;

storeContent = storeContent.replace('  messages: Message[];\n}', '  messages: Message[];\n' + grievancePropsToAdd + '\n}');

const contextPropsToAdd = `  admins: Admin[];
  escalations: Escalation[];
  assignGrievance: (grievanceId: string, adminId: string) => void;
  reassignGrievance: (grievanceId: string, adminId: string) => void;
  escalateGrievance: (grievanceId: string, reason?: string) => void;
  updateEscalationStatus: (escalationId: string, status: 'Under Review' | 'Action Taken' | 'Resolved', notes?: string) => void;
  reopenGrievance: (grievanceId: string, reason?: string) => void;
  remindAdmin: (grievanceId: string) => void;
  readNotificationIds: string[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: (ids: string[]) => void;`;

storeContent = storeContent.replace('  triggerSlaBreachCheck: () => void;\n}', '  triggerSlaBreachCheck: () => void;\n' + contextPropsToAdd + '\n}');

const stateInitToAdd = `
  const [admins] = useState<Admin[]>([
      { id: '11111', name: 'Admin 1', role: 'admin', department: 'UPPCL / Electricity Department', departmentId: 'dept-1', district: 'Lucknow', status: 'Active', lastActive: new Date().toISOString() },
      { id: '22222', name: 'Admin 2', role: 'admin', department: 'PWD', departmentId: 'dept-2', district: 'Lucknow', status: 'Active', lastActive: new Date().toISOString() },
      { id: '33333', name: 'Admin 3', role: 'admin', department: 'Water Works / Jal Sansthan', departmentId: 'dept-3', district: 'Lucknow', status: 'Active', lastActive: new Date().toISOString() },
      { id: '44444', name: 'Admin 4', role: 'admin', department: 'Cyber Cell', departmentId: 'dept-4', district: 'Lucknow', status: 'Active', lastActive: new Date().toISOString() },
      { id: '55555', name: 'District Magistrate', role: 'admin', department: 'District Magistrate (DM)', departmentId: 'dept-5', district: 'Lucknow', status: 'Active', lastActive: new Date().toISOString() }
  ]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  
  const generateId = () => Math.random().toString(36).substr(2, 9);
  
  const derivedAdmins = admins.map(admin => {
      let assigned = 0; let resolved = 0; let pending = 0; let overdue = 0;
      grievances.forEach(g => {
        if (g.assignedAdminId === admin.id) {
          assigned++;
          if (g.status === 'Resolved') resolved++;
          else {
            pending++;
            if (g.slaDeadline && Date.now() > g.slaDeadline) overdue++;
          }
        }
      });
      return { ...admin, assignedGrievances: assigned, resolvedGrievances: resolved, pendingGrievances: pending, overdueGrievances: overdue };
  });
`;

storeContent = storeContent.replace('  // Sync to localStorage\n', stateInitToAdd + '\n  // Sync to localStorage\n');

const methodsToAdd = `
  const assignGrievance = (grievanceId: string, adminId: string) => {
    setGrievances(prev => {
      const admin = admins.find(a => a.id === adminId);
      if (!admin) return prev;
      return prev.map(g => {
        if (g.id === grievanceId) {
          return {
            ...g,
            assignedAdminId: admin.id,
            assignedAdminName: admin.name,
            departmentId: admin.departmentId,
            dept: admin.department,
            activities: [...(g.activities || []), { id: generateId(), type: 'reassigned', actor: 'Super Admin', description: 'Assigned', timestamp: new Date().toISOString() }]
          };
        }
        return g;
      });
    });
  };
  
  const reassignGrievance = assignGrievance;
  
  const escalateGrievance = (grievanceId: string, reason?: string) => {
    setGrievances(prev => prev.map(g => {
      if (g.id === grievanceId) {
        if (g.escalated) return g;
        setEscalations(prevEsc => [{
          id: 'ESC-' + generateId().toUpperCase(), grievanceId: g.id, reason: reason || '', escalatedBy: 'Super Admin', escalatedAt: new Date().toISOString(), escalatedTo: 'Senior Dept', status: 'Pending', priority: g.priority === 'Critical' ? 'Critical' : 'High'
        }, ...prevEsc]);
        return {
          ...g, escalated: true, escalatedAt: new Date().toISOString(), escalatedBy: 'Super Admin',
          activities: [...(g.activities || []), { id: generateId(), type: 'escalated', actor: 'Super Admin', description: 'Escalated', timestamp: new Date().toISOString() }]
        };
      }
      return g;
    }));
  };
  
  const reopenGrievance = (grievanceId: string, reason?: string) => {
    setGrievances(prev => prev.map(g => {
      if (g.id === grievanceId) {
        return {
          ...g, reopened: true, reopenedAt: new Date().toISOString(), reopenReason: reason, reopenedBy: 'Super Admin', status: 'In Progress',
          activities: [...(g.activities || []), { id: generateId(), type: 'reopened', actor: 'Super Admin', description: 'Reopened', timestamp: new Date().toISOString() }]
        };
      }
      return g;
    }));
  };
  
  const remindAdmin = (grievanceId: string) => {
    // dummy function
  };
  
  const markNotificationAsRead = (id: string) => setReadNotificationIds(prev => [...prev, id]);
  const markAllNotificationsAsRead = (ids: string[]) => setReadNotificationIds(prev => [...prev, ...ids]);
  const updateEscalationStatus = (id: string, status: any, notes?: string) => {
      setEscalations(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };
`;

storeContent = storeContent.replace('  return (\n    <StoreContext.Provider', methodsToAdd + '\n  return (\n    <StoreContext.Provider');

const finalProviderVals = `
        admins: derivedAdmins,
        escalations,
        assignGrievance,
        reassignGrievance,
        escalateGrievance,
        updateEscalationStatus,
        reopenGrievance,
        remindAdmin,
        readNotificationIds,
        markNotificationAsRead,
        markAllNotificationsAsRead,
`;

storeContent = storeContent.replace('        triggerSlaBreachCheck\n      }}', '        triggerSlaBreachCheck,\n' + finalProviderVals + '      }}');

fs.writeFileSync(storePath, storeContent, 'utf8');
