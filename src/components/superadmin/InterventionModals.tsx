import { useState } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useStore } from '../../lib/store';
import type { Grievance } from '../../lib/store';

// ------------------------------------------
// 1. Send Reminder Modal
// ------------------------------------------
export function ReminderModal({ grievance, onClose }: { grievance: Grievance; onClose: () => void }) {
  const { remindAdmin } = useStore();
  const [success, setSuccess] = useState(false);

  const handleSend = () => {
    remindAdmin(grievance.id);
    setSuccess(true);
    setTimeout(onClose, 1500);
  };

  if (success) {
    return <SuccessState message="Reminder sent successfully." />;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0F1620] w-full max-w-md rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Send Reminder to Admin</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          You are about to send an in-system reminder to <strong className="text-gray-900 dark:text-white">{grievance.assignedAdminName}</strong> regarding grievance <strong className="text-gray-900 dark:text-white">{grievance.id}</strong>.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">Cancel</Button>
          <Button onClick={handleSend} className="bg-purple-600 hover:bg-purple-700 text-white border-transparent">Send Reminder</Button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------
// 2. Reassign Modal
// ------------------------------------------
export function ReassignModal({ grievance, onClose }: { grievance: Grievance; onClose: () => void }) {
  const { admins, reassignGrievance } = useStore();
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const eligibleAdmins = admins.filter(a => a.status === 'Active' && a.id !== grievance.assignedAdminId);

  const handleReassign = () => {
    if (selectedAdminId) {
      reassignGrievance(grievance.id, selectedAdminId);
      setSuccess(true);
      setTimeout(onClose, 1500);
    }
  };

  if (success) {
    return <SuccessState message="Grievance reassigned successfully." />;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0F1620] w-full max-w-2xl rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reassign Grievance: {grievance.id}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select an active admin to reassign this grievance to:</p>
          
          {eligibleAdmins.length === 0 ? (
            <p className="text-sm font-medium text-orange-600 dark:text-orange-400 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
              No eligible active Admin available for reassignment.
            </p>
          ) : (
            <div className="space-y-3">
              {eligibleAdmins.map(admin => (
                <div 
                  key={admin.id} 
                  onClick={() => setSelectedAdminId(admin.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAdminId === admin.id ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-100 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{admin.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{admin.department} • {admin.district}, {admin.state}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-purple-600 dark:text-purple-400">Assigned: {admin.assignedGrievances}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Pending: {admin.pendingGrievances}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-b-2xl">
          <Button variant="outline" onClick={onClose} className="border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">Cancel</Button>
          <Button onClick={handleReassign} disabled={!selectedAdminId} className="bg-purple-600 hover:bg-purple-700 text-white border-transparent disabled:opacity-50">Confirm Reassignment</Button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------
// 3. Escalate Modal
// ------------------------------------------
export function EscalateModal({ grievance, onClose }: { grievance: Grievance; onClose: () => void }) {
  const { escalateGrievance } = useStore();
  const [reason, setReason] = useState('');
  const [success, setSuccess] = useState(false);

  const REASONS = [
    'SLA breached',
    'Critical public impact',
    'Admin not responding',
    'Repeated complaint',
    'Requires higher authority',
    'Other'
  ];

  const handleEscalate = () => {
    if (reason) {
      escalateGrievance(grievance.id, reason);
      setSuccess(true);
      setTimeout(onClose, 1500);
    }
  };

  if (grievance.escalated && !success) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-[#0F1620] w-full max-w-md rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 animate-in zoom-in-95 duration-200 text-center">
          <AlertTriangle size={32} className="mx-auto text-orange-500 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Already Escalated</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">This grievance has already been escalated.</p>
          <Button onClick={onClose} className="w-full bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 border-transparent">Close</Button>
        </div>
      </div>
    );
  }

  if (success) {
    return <SuccessState message="Grievance escalated successfully." />;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0F1620] w-full max-w-md rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2"><AlertTriangle size={20} /> Escalate Grievance</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl">
            <p className="text-xs text-red-700 dark:text-red-400 font-bold uppercase tracking-wider mb-1">Grievance</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{grievance.id}: {grievance.title}</p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Select Reason for Escalation</label>
            <select 
              className="w-full bg-white dark:bg-[#0F1620] border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-white outline-none focus:border-red-400"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="" disabled>Select a reason...</option>
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          
          {reason.startsWith('Other') && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Custom Reason</label>
              <input 
                type="text" 
                className="w-full bg-white dark:bg-[#0F1620] border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-white outline-none focus:border-red-400"
                placeholder="Enter specific reason..."
                onChange={(e) => setReason(`Other: ${e.target.value}`)}
              />
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 rounded-b-2xl">
          <Button variant="outline" onClick={onClose} className="border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">Cancel</Button>
          <Button onClick={handleEscalate} disabled={!reason || reason === 'Other: '} className="bg-red-600 hover:bg-red-700 text-white border-transparent disabled:opacity-50">Escalate</Button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------
// 4. Reopen Modal
// ------------------------------------------
export function ReopenModal({ grievance, onClose }: { grievance: Grievance; onClose: () => void }) {
  const { reopenGrievance } = useStore();
  const [reason, setReason] = useState('');
  const [success, setSuccess] = useState(false);

  const REASONS = [
    'Citizen reports issue is not resolved',
    'Incorrect resolution',
    'Issue recurred',
    'Evidence indicates unresolved issue',
    'Other'
  ];

  const handleReopen = () => {
    if (reason) {
      reopenGrievance(grievance.id, reason);
      setSuccess(true);
      setTimeout(onClose, 1500);
    }
  };

  if (success) {
    return <SuccessState message="Grievance reopened successfully." />;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0F1620] w-full max-w-md rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-2">Reopen Grievance</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl">
            <p className="text-xs text-yellow-700 dark:text-yellow-400 font-bold uppercase tracking-wider mb-1">Resolved Grievance</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{grievance.id}: {grievance.title}</p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Select Reason for Reopening</label>
            <select 
              className="w-full bg-white dark:bg-[#0F1620] border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-white outline-none focus:border-yellow-400"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="" disabled>Select a reason...</option>
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          
          {reason.startsWith('Other') && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Custom Reason</label>
              <input 
                type="text" 
                className="w-full bg-white dark:bg-[#0F1620] border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-white outline-none focus:border-yellow-400"
                placeholder="Enter specific reason..."
                onChange={(e) => setReason(`Other: ${e.target.value}`)}
              />
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 rounded-b-2xl">
          <Button variant="outline" onClick={onClose} className="border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">Cancel</Button>
          <Button onClick={handleReopen} disabled={!reason || reason === 'Other: '} className="bg-yellow-600 hover:bg-yellow-700 text-white border-transparent disabled:opacity-50">Reopen</Button>
        </div>
      </div>
    </div>
  );
}


function SuccessState({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0F1620] w-full max-w-sm rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 flex flex-col items-center justify-center animate-in zoom-in duration-300">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">{message}</h3>
      </div>
    </div>
  );
}
