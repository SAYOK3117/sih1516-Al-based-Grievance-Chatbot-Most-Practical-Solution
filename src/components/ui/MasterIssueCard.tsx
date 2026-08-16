import { Layers, MapPin, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import type { MasterIssue } from '../../lib/store';

interface MasterIssueCardProps {
  masterIssue: MasterIssue;
  onUpdateStatus?: (id: string, status: string) => void;
  onSelect?: (id: string) => void;
}

export function MasterIssueCard({ masterIssue, onUpdateStatus, onSelect }: MasterIssueCardProps) {
  return (
    <Card className="hover:border-primary/40 dark:hover:border-primary/40 transition-colors border-2 border-primary/20">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-400 text-xs font-mono font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
              <Layers size={14} />
              {masterIssue.id}
            </span>
            <Badge variant={masterIssue.priority === 'Critical' || masterIssue.priority === 'High' ? 'alert' : 'warning'}>
              {masterIssue.priority} Priority
            </Badge>
            <Badge variant={masterIssue.status === 'Resolved' ? 'success' : 'primary'}>
              {masterIssue.status}
            </Badge>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <span>👥 {masterIssue.linkedComplaintIds.length} Linked Citizen Reports</span>
          </div>
        </div>

        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 cursor-pointer hover:text-primary transition-colors" onClick={() => onSelect?.(masterIssue.id)}>
          {masterIssue.title}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-4">
          <div className="flex items-center">
            <MapPin size={14} className="mr-1.5 text-gray-400 shrink-0" />
            <span className="truncate">{masterIssue.location}</span>
          </div>
          <div>
            <strong>Dept:</strong> <span className="text-primary dark:text-blue-400 font-semibold">{masterIssue.dept}</span>
          </div>
        </div>

        {onUpdateStatus && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            <span className="text-[11px] text-gray-400">Created: {masterIssue.createdAt}</span>
            <div className="flex gap-2">
              {masterIssue.status !== 'Resolved' ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-emerald-600 border-emerald-600 hover:bg-emerald-50 text-xs h-8"
                  onClick={() => onUpdateStatus(masterIssue.id, 'Resolved')}
                >
                  <CheckCircle2 size={14} className="mr-1" />
                  Resolve Master Issue
                </Button>
              ) : (
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <CheckCircle2 size={14} className="mr-1" /> Resolved
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
