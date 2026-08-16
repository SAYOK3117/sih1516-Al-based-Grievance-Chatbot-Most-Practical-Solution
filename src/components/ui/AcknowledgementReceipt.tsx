import type { Grievance } from '../../lib/store';
import { formatSlaDeadline } from '../../lib/slaConfig';

/* 
 * DEMO ACKNOWLEDGEMENT COMPONENT
 * Generated entirely client-side. Not a legally binding or 
 * cryptographically verified government document. 
 */

/** Formats any date input in Indian Standard Time (IST, UTC+5:30). */
const formatIST = (input?: string | number | null): string => {
  if (!input) return '—';
  return new Date(input).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  }) + ' IST';
};

export const AcknowledgementReceipt = ({ grievance }: { grievance: Grievance }) => {
  const generatedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  }) + ' IST';

  return (
    <div className="bg-white dark:bg-[#121826] border border-gray-300 dark:border-gray-700 p-6 md:p-8 rounded shadow-sm text-gray-900 dark:text-gray-100 font-sans mx-auto w-full">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 dark:border-gray-200 pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-black dark:text-white">NAGRIK SETU</h1>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mt-1">Grievance Acknowledgement Receipt</h2>
      </div>

      {/* Token Box */}
      <div className="border-4 border-gray-900 dark:border-gray-100 p-4 text-center mb-8 bg-gray-50 dark:bg-gray-800/50">
        <span className="block text-xs uppercase tracking-widest font-bold text-gray-600 dark:text-gray-400 mb-1">Token / Registration No. (DEMO)</span>
        <span className="block text-3xl font-mono font-bold tracking-wider text-black dark:text-white">{grievance.id}</span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mb-8 text-sm">
        <div className="border-b border-gray-200 dark:border-gray-800 pb-2">
          <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date & Time of Filing</span>
          <span className="font-medium">{formatIST(grievance.submissionTimeMs ?? grievance.createdAt)}</span>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-800 pb-2">
          <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Citizen Name</span>
          <span className="font-medium">{grievance.citizen || '—'}</span>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-800 pb-2">
          <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Department / Category</span>
          <span className="font-medium">{grievance.dept || '—'}</span>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-800 pb-2">
          <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Priority</span>
          <span className="font-medium">{grievance.priority || '—'}</span>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-800 pb-2 md:col-span-2">
          <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Brief Subject</span>
          <span className="font-medium">{grievance.title || grievance.aiSummary || '—'}</span>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-800 pb-2 md:col-span-2">
          <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Location</span>
          <span className="font-medium">{grievance.location || grievance.reverseGeocodedLocation || '—'}</span>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-800 pb-2">
          <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Current Status</span>
          <span className="font-medium">{grievance.status || '—'}</span>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-800 pb-2">
          <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Expected Resolution</span>
          <span className="font-medium">{grievance.slaDeadline ? formatSlaDeadline(grievance.slaDeadline) : '—'}</span>
        </div>
      </div>

      {/* Note Line */}
      <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 text-yellow-900 dark:text-yellow-200 text-xs italic">
        Please quote this Token/Registration Number in all future correspondence and while checking your grievance status on this portal.
      </div>

      {/* Footer Disclaimer */}
      <div className="text-center text-[10px] text-gray-500 dark:text-gray-500 pt-4 border-t border-gray-200 dark:border-gray-800">
        <p className="mb-1">This is a system-generated acknowledgement and does not require a physical signature.</p>
        <p>Receipt generated on: {generatedAt}</p>
      </div>
    </div>
  );
};
