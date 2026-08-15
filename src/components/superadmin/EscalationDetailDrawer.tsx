import { X, ShieldAlert, CheckCircle2, AlertTriangle, Clock, MapPin, User, Building2, ChevronRight } from 'lucide-react';
import type { GrievanceEscalation } from '../../lib/store';
import { useStore } from '../../lib/store';
import { Button } from '../ui/Button';
import { useState } from 'react';
import { SuperAdminGrievanceDetails } from './SuperAdminGrievanceDetails';

interface EscalationDetailDrawerProps {
  escalation: GrievanceEscalation;
  onClose: () => void;
}

export function EscalationDetailDrawer({ escalation, onClose }: EscalationDetailDrawerProps) {
  const { grievances, updateEscalationStatus } = useStore();
  const grievance = grievances.find(g => g.id === escalation.grievanceId);
  
  const [showGrievanceDetail, setShowGrievanceDetail] = useState(false);
  const [actionNote, setActionNote] = useState('');
  const [showActionForm, setShowActionForm] = useState(false);
  const [actionType, setActionType] = useState<'Action Taken' | 'Resolved' | null>(null);

  if (!grievance) return null;

  const handleStartReview = () => {
    if (window.confirm('Start reviewing this escalation?')) {
      updateEscalationStatus(escalation.id, 'Under Review');
    }
  };

  const submitAction = () => {
    if (!actionNote.trim()) {
      alert('Please provide a note.');
      return;
    }
    if (actionType) {
      updateEscalationStatus(escalation.id, actionType, actionNote);
      setShowActionForm(false);
      setActionNote('');
      setActionType(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-200" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] lg:w-[700px] bg-white dark:bg-[#050B14] shadow-2xl z-[101] flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between bg-gray-50/50 dark:bg-gray-900/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="text-red-600 dark:text-red-500 w-5 h-5" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Escalation {escalation.id}</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Escalated on {new Date(escalation.escalatedAt).toLocaleDateString()}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Escalation Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-[#0F1620] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Status</p>
              <div className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white">
                {escalation.status === 'Resolved' && <CheckCircle2 size={16} className="text-green-500" />}
                {escalation.status === 'Pending' && <Clock size={16} className="text-red-500" />}
                {escalation.status === 'Under Review' && <AlertTriangle size={16} className="text-orange-500" />}
                {escalation.status === 'Action Taken' && <ShieldAlert size={16} className="text-blue-500" />}
                {escalation.status}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-[#0F1620] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Priority</p>
              <div className="font-semibold text-red-600 dark:text-red-400">
                {escalation.priority}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">Escalation Details</h3>
            <div className="bg-white dark:bg-[#141C27] border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-4 shadow-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reason for Escalation</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{escalation.reason}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Escalated By</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{escalation.escalatedBy}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Escalated To</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{escalation.escalatedTo}</p>
                </div>
              </div>
              {escalation.notes && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Resolution / Action Notes</p>
                  <div className="text-sm text-gray-900 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    {escalation.notes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Grievance Context */}
          <div>
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2 mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Underlying Grievance</h3>
              <button 
                onClick={() => setShowGrievanceDetail(true)}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center"
              >
                View Full Grievance <ChevronRight size={14} />
              </button>
            </div>
            
            <div className="bg-white dark:bg-[#141C27] border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm cursor-pointer hover:border-purple-300 transition-colors" onClick={() => setShowGrievanceDetail(true)}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-mono font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                  {grievance.id}
                </span>
                <span className="text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                  {grievance.status}
                </span>
              </div>
              
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                {grievance.title}
              </h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <User size={16} />
                  <span className="truncate">{grievance.citizen}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin size={16} />
                  <span className="truncate">{grievance.location || grievance.city}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Building2 size={16} />
                  <span className="truncate">{grievance.dept}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <ShieldAlert size={16} />
                  <span className="truncate">{grievance.assignedAdminName || 'Unassigned'}</span>
                </div>
              </div>

              {grievance.aiSummary && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-start gap-3 bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg border border-purple-100 dark:border-purple-900/30">
                    <div className="text-xl">🤖</div>
                    <div>
                      <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase mb-1">AI Summary</p>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{grievance.aiSummary}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#050B14]">
          {showActionForm ? (
            <div className="space-y-3 animate-in slide-in-from-bottom-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {actionType === 'Resolved' ? 'Resolution Note' : 'Action Note'}
              </label>
              <textarea
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-[#0F1620] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                rows={3}
                placeholder="Enter details..."
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
              />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => { setShowActionForm(false); setActionType(null); }}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={submitAction}>
                  Confirm {actionType}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              {escalation.status === 'Pending' && (
                <Button className="flex-1" onClick={handleStartReview}>
                  Start Review
                </Button>
              )}
              {escalation.status === 'Under Review' && (
                <Button 
                  className="flex-1" 
                  onClick={() => { setActionType('Action Taken'); setShowActionForm(true); }}
                >
                  Mark Action Taken
                </Button>
              )}
              {escalation.status === 'Action Taken' && (
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
                  onClick={() => { setActionType('Resolved'); setShowActionForm(true); }}
                >
                  Mark Resolved
                </Button>
              )}
              {escalation.status === 'Resolved' && (
                <div className="w-full text-center p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium rounded-lg border border-green-200 dark:border-green-900/50">
                  Escalation Resolved on {new Date(escalation.resolvedAt!).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showGrievanceDetail && (
        <SuperAdminGrievanceDetails grievance={grievance} onClose={() => setShowGrievanceDetail(false)} />
      )}
    </>
  );
}
