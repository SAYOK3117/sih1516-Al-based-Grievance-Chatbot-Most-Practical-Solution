import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { DEPARTMENT_ADMINS } from './adminConfig';
import { classifyDepartment } from './departmentClassifier';
import { calculateSlaDeadline } from './slaConfig';

export interface Message {
  id: string;
  sender: 'Admin' | 'Citizen' | 'District Magistrate';
  text: string;
  timestamp: string;
}
export interface Attachment {
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  event: string;
  actor: string;
  details?: string;
}


export interface GrievanceActivity {
  id: string;
  type: 'submitted' | 'assigned' | 'reassigned' | 'escalated' | 'status_change' | 'note' | 'reminder' | 'reopened';
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
  state?: string;
  district: string;
  status: 'Active' | 'Inactive';
  assignedGrievances: number;
  resolvedGrievances: number;
  pendingGrievances: number;
  overdueGrievances: number;
  averageResolutionHours: number;
  slaCompliance: number;
  lastActive?: string;
}

export interface GrievanceEscalation {
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

export interface MasterIssue {
  id: string;
  title: string;
  dept: string;
  category: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Filed' | 'In Progress' | 'Resolved' | 'Escalated to DM';
  lat: number;
  lng: number;
  location: string;
  linkedComplaintIds: string[];
  assignedAdminId: string;
  createdAt: string;
  slaDeadline: number;
  escalatedToDM: boolean;
  escalationReason?: string;
  auditTimeline?: AuditEvent[];
}

export interface Grievance {
  id: string;
  title: string;
  citizen: string;
  dept: string;
  assignedAdminId: string;
  date: string;
  submissionTimeMs?: number;
  status: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  priorityReason?: string;
  sla: string;
  slaDeadline?: number;
  slaColor: string;
  aiSummary: string;
  location: string;
  lat: number;
  lng: number;
  accuracy?: number;
  reverseGeocodedLocation?: string;
  masterIssueId?: string;
  duplicateConfidence?: number;
  createdAt?: string;
  updatedAt?: string;
  dueAt?: string;
  state?: string;
  district?: string;
  city?: string;
  escalatedToDM?: boolean;
  escalationReason?: string;
  escalationTime?: string;
  originalDepartment?: string;
  originalAdminId?: string;
  auditTimeline?: AuditEvent[];
  messages: Message[];
  assignedAdminName?: string;
  departmentId?: string;
  escalated?: boolean;
  reopened?: boolean;
  reopenedAt?: string;
  reopenReason?: string;
  reopenedBy?: string;
  activities?: GrievanceActivity[];
  voiceAudioUrl?: string;
  attachments?: Attachment[];
  feedback?: {
    rating: 'Satisfied' | 'Good' | 'Not Satisfied';
    comments?: string;
    submittedAt: string;
  };
}

interface StoreContextType {
  grievances: Grievance[];
  masterIssues: MasterIssue[];
  addGrievance: (grievance: Grievance) => void;
  updateGrievanceStatus: (id: string, status: string, byAdminId?: string) => void;
  addMessage: (grievanceId: string, message: Message) => void;
  createMasterIssue: (mi: MasterIssue) => void;
  linkToMasterIssue: (grievanceId: string, masterIssueId: string, confidence: number) => void;
  updateMasterIssueStatus: (masterIssueId: string, status: string) => void;
  triggerSlaBreachCheck: () => void;
  admins: Admin[];
  escalations: GrievanceEscalation[];
  assignGrievance: (grievanceId: string, adminId: string, department: string) => void;
  reassignGrievance: (grievanceId: string, adminId: string) => void;
  escalateGrievance: (grievanceId: string, reason?: string) => void;
  addEscalation: (escalation: GrievanceEscalation) => void;
  updateEscalationStatus: (escalationId: string, status: 'Under Review' | 'Action Taken' | 'Resolved', notes?: string) => void;
  reopenGrievance: (grievanceId: string, reason?: string) => void;
  remindAdmin: (grievanceId: string) => void;
  readNotificationIds: string[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: (ids: string[]) => void;
  submitFeedback: (grievanceId: string, rating: 'Satisfied' | 'Good' | 'Not Satisfied', comments?: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const nowMs = Date.now();

const initialMasterIssues: MasterIssue[] = [
  {
    id: 'MI-1024',
    title: 'Major Pothole & Road Hazard on Main Highway Link Road',
    dept: 'PWD',
    category: 'Road Repair',
    priority: 'High',
    status: 'In Progress',
    lat: 26.8524,
    lng: 80.9498,
    location: 'Main Highway Link Road, Lucknow',
    linkedComplaintIds: ['G-2023-8940'],
    assignedAdminId: '22222',
    createdAt: new Date(nowMs - 86400000).toLocaleString(),
    slaDeadline: nowMs + 172800000,
    escalatedToDM: false,
    auditTimeline: [
      { id: '1', timestamp: new Date(nowMs - 86400000).toLocaleString(), event: 'Master Issue Created by AI Duplicate Detection', actor: 'AI System' },
      { id: '2', timestamp: new Date(nowMs - 82000000).toLocaleString(), event: 'Assigned to PWD Officer', actor: 'PWD Dept' }
    ]
  }
];

const initialGrievances: any[] = [
  {
    id: 'G-2023-8942',
    title: 'Blocked open drain causing sewage overflow',
    citizen: 'Citizen Demo',
    dept: 'Water Works / Jal Sansthan',
    assignedAdminId: '33333',
    date: '2 hours ago',
    submissionTimeMs: nowMs - (2 * 3600000),
    status: 'In Progress',
    priority: 'High',
    priorityReason: 'Priority HIGH because: Public health hazard, sewage overflow near market area',
    sla: '22h remaining',
    slaDeadline: nowMs + (22 * 3600000),
    slaColor: 'text-warning',
    aiSummary: 'Blocked drain causing sewage overflow. Poses health hazard and traffic disruption.',
    location: 'Sector 4 Market Road, City Center',
    lat: 26.8467,
    lng: 80.9462,
    accuracy: 12,
    reverseGeocodedLocation: 'Sector 4 Market Road, Hazratganj, Lucknow, UP 226001',
    auditTimeline: [
      { id: '1', timestamp: new Date(nowMs - (2 * 3600000)).toLocaleString(), event: 'Complaint submitted by citizen', actor: 'Citizen Demo' },
      { id: '2', timestamp: new Date(nowMs - (2 * 3600000)).toLocaleString(), event: 'GPS captured (Lat: 26.8467, Lng: 80.9462)', actor: 'Device Geolocation' },
      { id: '3', timestamp: new Date(nowMs - (2 * 3600000)).toLocaleString(), event: 'AI classified department: Water Works / Jal Sansthan', actor: 'AI Routing Engine' },
      { id: '4', timestamp: new Date(nowMs - (1.8 * 3600000)).toLocaleString(), event: 'Assigned to Water Works / Jal Sansthan Officer', actor: 'System' }
    ],
    messages: []
  },
  {
    id: 'G-2023-8941',
    title: 'Street light not working in Sector 9',
    citizen: 'A***** S.',
    dept: 'UPPCL / Electricity Department',
    assignedAdminId: '11111',
    date: '5 hours ago',
    submissionTimeMs: nowMs - (5 * 3600000),
    status: 'Filed',
    priority: 'Low',
    priorityReason: 'Priority LOW because: Single streetlight outage, non-hazardous area',
    sla: '19h remaining',
    slaDeadline: nowMs + (19 * 3600000),
    slaColor: 'text-emerald-500',
    aiSummary: 'Single street light pole not working. No safety hazard reported.',
    location: 'Sector 9, Phase 2, Lucknow',
    lat: 26.8612,
    lng: 80.9321,
    accuracy: 15,
    reverseGeocodedLocation: 'Sector 9, Phase 2, Gomti Nagar, Lucknow, UP',
    auditTimeline: [
      { id: '1', timestamp: new Date(nowMs - (5 * 3600000)).toLocaleString(), event: 'Complaint registered', actor: 'Citizen' },
      { id: '2', timestamp: new Date(nowMs - (5 * 3600000)).toLocaleString(), event: 'AI assigned priority LOW & SLA 24h timer started', actor: 'AI Engine' }
    ],
    messages: []
  },
  {
    id: 'G-2023-8940',
    title: 'Large pothole on main road causing accidents',
    citizen: 'R***** K.',
    dept: 'PWD',
    assignedAdminId: '22222',
    date: '1 day ago',
    submissionTimeMs: nowMs - 86400000,
    status: 'In Progress',
    priority: 'High',
    priorityReason: 'Priority HIGH because: Major road damage, linked to Master Issue MI-1024',
    sla: '48h remaining',
    slaDeadline: nowMs + 172800000,
    slaColor: 'text-warning',
    aiSummary: 'Deep road damage and pothole near market square requires road repair.',
    location: 'Main Highway Link Road',
    lat: 26.8524,
    lng: 80.9498,
    accuracy: 8,
    masterIssueId: 'MI-1024',
    duplicateConfidence: 94,
    auditTimeline: [
      { id: '1', timestamp: new Date(nowMs - 86400000).toLocaleString(), event: 'Complaint registered', actor: 'R***** K.' },
      { id: '2', timestamp: new Date(nowMs - 86400000).toLocaleString(), event: 'AI Duplicate Engine matched with Master Issue MI-1024 (94% confidence)', actor: 'AI Engine' }
    ],
    messages: []
  },
  {
    id: 'G-2023-8939',
    title: 'Fraudulent transaction and online banking scam',
    citizen: 'V***** M.',
    dept: 'Cyber Cell',
    assignedAdminId: '44444',
    date: '30 hours ago',
    submissionTimeMs: nowMs - (30 * 3600000),
    status: 'SLA Breached',
    priority: 'High',
    priorityReason: 'Priority HIGH because: Financial phishing scam, SLA deadline breached without response',
    sla: '⚠️ SLA BREACHED (6h overdue)',
    slaDeadline: nowMs - (6 * 3600000),
    slaColor: 'text-alert',
    aiSummary: 'Unauthorized UPI debit and phishing scam reported by victim.',
    location: 'Online / Cyber Jurisdiction',
    lat: 26.8398,
    lng: 80.9234,
    escalatedToDM: true,
    escalationReason: 'SLA deadline (24 hours) exceeded by Cyber Cell without resolution action',
    escalationTime: new Date(nowMs - (6 * 3600000)).toLocaleString(),
    originalDepartment: 'Cyber Cell',
    originalAdminId: '44444',
    auditTimeline: [
      { id: '1', timestamp: new Date(nowMs - (30 * 3600000)).toLocaleString(), event: 'Cyber complaint registered', actor: 'V***** M.' },
      { id: '2', timestamp: new Date(nowMs - (6 * 3600000)).toLocaleString(), event: 'SLA deadline exceeded (24h timer elapsed)', actor: 'SLA Monitor' },
      { id: '3', timestamp: new Date(nowMs - (6 * 3600000)).toLocaleString(), event: 'AUTOMATICALLY ESCALATED TO DISTRICT MAGISTRATE (DM)', actor: 'Automated Escalation System' }
    ],
    messages: []
  },
  {
    id: 'G-2023-8938',
    title: 'District administrative service delay report',
    citizen: 'P***** G.',
    dept: 'District Magistrate (DM)',
    assignedAdminId: '55555',
    date: '2 days ago',
    submissionTimeMs: nowMs - (48 * 3600000),
    status: 'Resolved',
    priority: 'Medium',
    priorityReason: 'Priority MEDIUM: General public administrative request addressed',
    sla: 'Resolved',
    slaDeadline: nowMs - 3600000,
    slaColor: 'text-emerald-500',
    aiSummary: 'General district public administration inquiry successfully addressed.',
    location: 'Collectorate Office Compound',
    lat: 26.8701,
    lng: 80.9123,
    auditTimeline: [
      { id: '1', timestamp: new Date(nowMs - (48 * 3600000)).toLocaleString(), event: 'Complaint registered', actor: 'Citizen' },
      { id: '2', timestamp: new Date(nowMs - (12 * 3600000)).toLocaleString(), event: 'Action taken and issue marked Resolved by District Magistrate', actor: 'DM Admin' }
    ],
    messages: []
  }
];

function migrateGrievanceData(items: any[]): Grievance[] {
  return items.map(g => {
    let dept = g.dept || 'District Magistrate (DM)';
    let assignedAdminId = g.assignedAdminId;

    if (dept === 'Electricity Board') dept = 'UPPCL / Electricity Department';
    if (dept === 'Water & Sanitation') dept = 'Water Works / Jal Sansthan';
    if (dept === 'General Public Issue' || dept === 'General') dept = 'District Magistrate (DM)';

    if (!assignedAdminId) {
      if (DEPARTMENT_ADMINS[dept]) {
        assignedAdminId = DEPARTMENT_ADMINS[dept];
      } else {
        const classified = classifyDepartment(g.title + ' ' + (g.aiSummary || ''));
        dept = classified.department;
        assignedAdminId = classified.assignedAdminId;
      }
    }

    const lat = g.lat || (26.83 + Math.random() * 0.05);
    const lng = g.lng || (80.92 + Math.random() * 0.05);
    const submissionTimeMs = g.submissionTimeMs || (Date.now() - 3600000);
    const slaDeadline = g.slaDeadline || calculateSlaDeadline(dept, submissionTimeMs);

    const auditTimeline = g.auditTimeline || [
      { id: '1', timestamp: g.date || 'Recently', event: 'Complaint registered', actor: g.citizen || 'Citizen' }
    ];

    let state = g.state;
    if (!state) {
      if (g.reverseGeocodedLocation && (g.reverseGeocodedLocation.includes('UP') || g.reverseGeocodedLocation.includes('Uttar Pradesh') || g.reverseGeocodedLocation.includes('Lucknow'))) {
        state = 'Uttar Pradesh';
      } else {
        state = 'Uttar Pradesh'; // Fallback for mock data
      }
    }

    return {
      ...g,
      dept,
      assignedAdminId,
      lat,
      lng,
      submissionTimeMs,
      slaDeadline,
      auditTimeline,
      state,
      messages: g.messages || []
    };
  });
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [grievances, setGrievances] = useState<Grievance[]>(() => {
    const saved = localStorage.getItem('suvas_grievances_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return migrateGrievanceData(parsed);
        }
      } catch (e) {
        console.error('Failed to parse grievances from localStorage:', e);
      }
    }
    return initialGrievances;
  });

  const [masterIssues, setMasterIssues] = useState<MasterIssue[]>(() => {
    const saved = localStorage.getItem('suvas_master_issues');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return initialMasterIssues;
  });


  const [admins] = useState<Admin[]>([
      { id: '11111', name: 'Admin 1', role: 'admin', department: 'UPPCL / Electricity Department', departmentId: 'dept-1', district: 'Lucknow', status: 'Active', lastActive: new Date().toISOString() },
      { id: '22222', name: 'Admin 2', role: 'admin', department: 'PWD', departmentId: 'dept-2', district: 'Lucknow', status: 'Active', lastActive: new Date().toISOString() },
      { id: '33333', name: 'Admin 3', role: 'admin', department: 'Water Works / Jal Sansthan', departmentId: 'dept-3', district: 'Lucknow', status: 'Active', lastActive: new Date().toISOString() },
      { id: '44444', name: 'Admin 4', role: 'admin', department: 'Cyber Cell', departmentId: 'dept-4', district: 'Lucknow', status: 'Active', lastActive: new Date().toISOString() },
      { id: '55555', name: 'District Magistrate', role: 'admin', department: 'District Magistrate (DM)', departmentId: 'dept-5', district: 'Lucknow', status: 'Active', lastActive: new Date().toISOString() }
  ] as any[]);
  const [escalations, setEscalations] = useState<GrievanceEscalation[]>([]);
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

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('suvas_grievances_v2', JSON.stringify(grievances));
  }, [grievances]);

  useEffect(() => {
    localStorage.setItem('suvas_master_issues', JSON.stringify(masterIssues));
  }, [masterIssues]);

  // Automatic SLA breach monitoring loop
  const triggerSlaBreachCheck = () => {
    const now = Date.now();
    let hasChanges = false;

    setGrievances(prev => prev.map(g => {
      if (g.status !== 'Resolved' && !g.escalatedToDM && g.slaDeadline && now > g.slaDeadline) {
        hasChanges = true;
        const breachDuration = Math.round((now - g.slaDeadline) / (1000 * 60 * 60));

        const newEvent: AuditEvent = {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleString(),
          event: `SLA Deadline Exceeded (${breachDuration}h overdue). AUTOMATICALLY ESCALATED TO DISTRICT MAGISTRATE (DM).`,
          actor: 'System Auto-Escalation Engine'
        };

        return {
          ...g,
          escalatedToDM: true,
          assignedAdminId: '55555',
          originalDepartment: g.dept,
          originalAdminId: g.assignedAdminId,
          escalationReason: `SLA deadline exceeded by ${breachDuration > 0 ? breachDuration : 1} hours without officer action`,
          escalationTime: new Date().toLocaleString(),
          status: 'SLA Breached',
          auditTimeline: [newEvent, ...(g.auditTimeline || [])]
        };
      }
      return g;
    }));

    if (hasChanges) {
      console.log('Automated SLA check completed: Overdue complaints escalated to DM.');
    }
  };

  useEffect(() => {
    triggerSlaBreachCheck();
    const timer = setInterval(triggerSlaBreachCheck, 30000); // Check every 30 seconds
    return () => clearInterval(timer);
  }, []);

  const addGrievance = (g: Grievance) => {
    setGrievances(prev => [g, ...prev]);
  };

  const updateGrievanceStatus = (id: string, status: string) => {
    setGrievances(prev => prev.map(g => {
      if (g.id === id) {
        const eventText = `Status updated to "${status}"`;
        const newEvent: AuditEvent = {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleString(),
          event: eventText,
          actor: 'Authority Officer'
        };
        return {
          ...g,
          status,
          auditTimeline: [newEvent, ...(g.auditTimeline || [])]
        };
      }
      return g;
    }));
  };

  const addMessage = (id: string, message: Message) => {
    setGrievances(prev => prev.map(g => {
      if (g.id === id) {
        const newEvent: AuditEvent = {
          id: Math.random().toString(),
          timestamp: message.timestamp,
          event: `Official note added by ${message.sender}: "${message.text.substring(0, 40)}..."`,
          actor: message.sender
        };
        return {
          ...g,
          messages: [...g.messages, message],
          auditTimeline: [newEvent, ...(g.auditTimeline || [])]
        };
      }
      return g;
    }));
  };

  const createMasterIssue = (mi: MasterIssue) => {
    setMasterIssues(prev => [mi, ...prev]);
  };

  const linkToMasterIssue = (grievanceId: string, masterIssueId: string, confidence: number) => {
    let isCriticalEscalation = false;
    
    setMasterIssues(prev => {
      const targetMi = prev.find(mi => mi.id === masterIssueId);
      if (targetMi && !targetMi.linkedComplaintIds.includes(grievanceId)) {
         if (targetMi.linkedComplaintIds.length + 1 >= 2) {
             isCriticalEscalation = true;
         }
      }
      
      return prev.map(mi => {
        if (mi.id === masterIssueId && !mi.linkedComplaintIds.includes(grievanceId)) {
          const updatedPriority = isCriticalEscalation ? 'Critical' : mi.priority;
          const auditEvent = (isCriticalEscalation && mi.priority !== 'Critical')
            ? [{ id: Math.random().toString(), timestamp: new Date().toLocaleString(), event: 'Priority auto-escalated to Critical due to multiple duplicate reports', actor: 'AI System' }]
            : [];

          return {
            ...mi,
            linkedComplaintIds: [...mi.linkedComplaintIds, grievanceId],
            priority: updatedPriority as any,
            auditTimeline: [...auditEvent, ...(mi.auditTimeline || [])]
          };
        }
        return mi;
      });
    });

    setGrievances(prev => prev.map(g => {
      if (g.id === grievanceId) {
        const newEvent: AuditEvent = {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleString(),
          event: `Linked to Master Issue ${masterIssueId} (${confidence}% AI Duplicate Confidence)`,
          actor: 'AI Duplicate Detection Engine'
        };
        const escalateEvent = (isCriticalEscalation && g.priority !== 'Critical') ? [{
          id: Math.random().toString(),
          timestamp: new Date().toLocaleString(),
          event: `Priority escalated to Critical (High community impact detected)`,
          actor: 'AI System'
        }] : [];

        return {
          ...g,
          masterIssueId,
          duplicateConfidence: confidence,
          priority: isCriticalEscalation ? 'Critical' : g.priority,
          auditTimeline: [...escalateEvent, newEvent, ...(g.auditTimeline || [])]
        };
      } else if (g.masterIssueId === masterIssueId && isCriticalEscalation && g.priority !== 'Critical') {
         const escalateEvent: AuditEvent = {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleString(),
          event: `Priority escalated to Critical (High community impact detected)`,
          actor: 'AI System'
        };
        return {
            ...g,
            priority: 'Critical',
            auditTimeline: [escalateEvent, ...(g.auditTimeline || [])]
        };
      }
      return g;
    }));
  };

  const updateMasterIssueStatus = (masterIssueId: string, status: string) => {
    const validStatus = status as MasterIssue['status'];
    setMasterIssues(prev => prev.map(mi => {
      if (mi.id === masterIssueId) {
        return { ...mi, status: validStatus };
      }
      return mi;
    }));

    // Cascade resolution to linked citizen complaints while preserving history
    setGrievances(prev => prev.map(g => {
      if (g.masterIssueId === masterIssueId) {
        const newEvent: AuditEvent = {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleString(),
          event: `Master Issue ${masterIssueId} resolved. Citizen complaint resolution updated.`,
          actor: 'Department Admin / DM'
        };
        return {
          ...g,
          status: status === 'Resolved' ? 'Resolved' : g.status,
          auditTimeline: [newEvent, ...(g.auditTimeline || [])]
        };
      }
      return g;
    }));
  };


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
  
  const remindAdmin = (_grievanceId: string) => {
    // dummy function
  };
  
  const markNotificationAsRead = (id: string) => setReadNotificationIds(prev => [...prev, id]);
  const markAllNotificationsAsRead = (ids: string[]) => setReadNotificationIds(prev => [...prev, ...ids]);
  const updateEscalationStatus = (id: string, status: any, _notes?: string) => {
      setEscalations(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };

  const submitFeedback = (grievanceId: string, rating: 'Satisfied' | 'Good' | 'Not Satisfied', comments?: string) => {
    setGrievances(prev => prev.map(g => {
      if (g.id === grievanceId) {
        const feedback = { rating, comments, submittedAt: new Date().toISOString() };
        
        if (rating === 'Not Satisfied') {
          return {
            ...g,
            feedback,
            status: 'In Progress',
            priority: 'Critical',
            reopened: true,
            reopenedAt: feedback.submittedAt,
            reopenReason: 'Citizen not satisfied with resolution',
            reopenedBy: 'Citizen',
            activities: [
              ...(g.activities || []),
              { id: generateId(), type: 'reopened', actor: 'Citizen', description: 'Grievance reopened due to "Not Satisfied" feedback', timestamp: feedback.submittedAt }
            ],
            auditTimeline: [
              { id: generateId(), timestamp: new Date().toLocaleString(), event: 'Grievance REOPENED (Not Satisfied). Priority escalated to Critical.', actor: 'Citizen' },
              ...(g.auditTimeline || [])
            ]
          };
        }
        
        return {
          ...g,
          feedback,
          auditTimeline: [
            { id: generateId(), timestamp: new Date().toLocaleString(), event: `Citizen feedback submitted: ${rating}`, actor: 'Citizen' },
            ...(g.auditTimeline || [])
          ]
        };
      }
      return g;
    }));
  };

  return (
    <StoreContext.Provider
      value={{
        grievances,
        masterIssues,
        addGrievance,
        updateGrievanceStatus,
        addMessage,
        createMasterIssue,
        linkToMasterIssue,
        updateMasterIssueStatus,
        triggerSlaBreachCheck,

        admins: derivedAdmins,
        escalations,
        assignGrievance,
        reassignGrievance,
        escalateGrievance,
        updateEscalationStatus, addEscalation: (_e: any) => {},
        reopenGrievance,
        remindAdmin,
        readNotificationIds,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        submitFeedback,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
