import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface Message {
  id: string;
  sender: 'Admin' | 'Citizen';
  text: string;
  timestamp: string;
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
}

interface StoreContextType {
  grievances: Grievance[];
  addGrievance: (g: Grievance) => void;
  updateGrievanceStatus: (id: string, status: string) => void;
  addMessage: (grievanceId: string, message: Message) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const initialGrievances: Grievance[] = [
  {
    id: 'G-2023-8942',
    title: 'Blocked open drain causing sewage overflow',
    citizen: 'Citizen Demo',
    dept: 'Water & Sanitation',
    date: '2 hours ago',
    status: 'In Progress',
    priority: 'High',
    sla: '2 days left',
    slaColor: 'text-warning',
    aiSummary: 'Blocked drain causing sewage overflow. Poses health hazard and traffic disruption.',
    location: 'Sector 4 Market Road, City Center',
    messages: []
  },
  {
    id: 'G-2023-8941',
    title: 'Street light not working in Sector 9',
    citizen: 'A***** S.',
    dept: 'Electricity Board',
    date: '5 hours ago',
    status: 'Filed',
    priority: 'Low',
    sla: '5 days left',
    slaColor: 'text-emerald-500',
    aiSummary: 'Single street light pole not working. No safety hazard reported.',
    location: 'Sector 9, Phase 2',
    messages: []
  }
];

export function StoreProvider({ children }: { children: ReactNode }) {
  const [grievances, setGrievances] = useState<Grievance[]>(() => {
    const saved = localStorage.getItem('suvas_grievances');
    if (saved) return JSON.parse(saved);
    return initialGrievances;
  });

  useEffect(() => {
    localStorage.setItem('suvas_grievances', JSON.stringify(grievances));
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'suvas_grievances' && e.newValue) {
        setGrievances(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [grievances]);

  const addGrievance = (g: Grievance) => setGrievances(prev => [g, ...prev]);

  const updateGrievanceStatus = (id: string, status: string) => {
    setGrievances(prev => prev.map(g => g.id === id ? { ...g, status } : g));
  };

  const addMessage = (id: string, message: Message) => {
    setGrievances(prev => prev.map(g => {
      if (g.id === id) {
        return { ...g, messages: [...g.messages, message] };
      }
      return g;
    }));
  };

  return (
    <StoreContext.Provider value={{ grievances, addGrievance, updateGrievanceStatus, addMessage }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
