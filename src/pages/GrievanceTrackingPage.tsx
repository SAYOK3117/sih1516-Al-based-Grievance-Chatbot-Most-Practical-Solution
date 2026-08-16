import { useState, useRef } from 'react';
import { ArrowLeft, Clock, CheckCircle2, MapPin, Building2, User, Bot, Search, Loader2, Download } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { useStore } from '../lib/store';
import { AcknowledgementReceipt } from '../components/ui/AcknowledgementReceipt';
import { generateGrievancePdf } from '../lib/pdfUtils';

/** SLA window in days per priority level. */
const SLA_DAYS: Record<string, number> = {
  High: 2,
  Medium: 5,
  Low: 7,
};

/** Returns days remaining (can be negative = overdue) or null if filedAt is absent. */
function calcDaysLeft(filedAt: string | undefined, priority: string): number | null {
  if (!filedAt) return null;
  const slaWindow = SLA_DAYS[priority] ?? 7;
  const deadline = new Date(filedAt).getTime() + slaWindow * 86_400_000;
  const msLeft = deadline - Date.now();
  return Math.ceil(msLeft / 86_400_000);
}

/** Returns a 0-100 progress value based on grievance status. */
function calcProgress(status: string): number {
  if (status === 'Resolved') return 100;
  if (status === 'In Progress') return 60;
  return 25; // Filed
}

export function GrievanceTrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const id = searchParams.get('id') || '';
  const [showReceipt, setShowReceipt] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const hiddenReceiptRef = useRef<HTMLDivElement>(null);
  
  const { grievances, addMessage } = useStore();
  const currentUserRole = localStorage.getItem('suvas_user_role');
  const grievance = grievances.find(g => g.id === id);

  const handleDownloadPdf = async () => {
    if (!hiddenReceiptRef.current || !grievance) return;
    setIsGeneratingPdf(true);
    try {
      await generateGrievancePdf(hiddenReceiptRef.current, grievance.id);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert("Couldn't generate PDF, please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isCitizenCommenting, setIsCitizenCommenting] = useState(false);
  const [citizenCommentText, setCitizenCommentText] = useState('');

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTokenError(null);
    const trimmed = tokenInput.trim();
    if (!trimmed) {
      setTokenError('Please enter a token number.');
      return;
    }
    const found = grievances.find(g => g.id === trimmed);
    if (found) {
      setSearchParams({ id: trimmed });
    } else {
      setTokenError('No grievance found with this token number. Please check and try again.');
    }
  };

  const timeline = [
    { title: 'Grievance Filed', date: grievance?.date || 'Oct 24, 2023', status: 'completed', desc: 'Complaint registered successfully.' },
    { title: 'AI Analysis & Routing', date: grievance?.date || 'Oct 24, 2023', status: 'completed', desc: `Classified as ${grievance?.priority} Priority. Routed to ${grievance?.dept} dept.` },
    { title: 'Resolution', date: 'Expected: ' + (grievance?.sla || 'Soon'), status: grievance?.status === 'Resolved' ? 'completed' : 'pending', desc: grievance?.status === 'Resolved' ? 'Resolved' : 'Pending completion.' },
  ];

  if (!id || !grievance) {
    return (
      <div className="pt-24 pb-20 container mx-auto px-4 max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Track Your Grievance</h1>
          <p className="text-gray-500 dark:text-gray-400">Enter your token number to check the status of your complaint.</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <div>
                <label htmlFor="token-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Token / Reference Number
                </label>
                <Input
                  id="token-input"
                  type="text"
                  placeholder="e.g. G-2023-8942"
                  value={tokenInput}
                  onChange={e => { setTokenInput(e.target.value); setTokenError(null); }}
                  error={!!tokenError}
                  autoFocus
                />
                {tokenError && (
                  <p className="mt-2 text-sm text-red-500">{tokenError}</p>
                )}
              </div>
              <Button type="submit" className="w-full">
                <Search size={16} className="mr-2" /> Track Status
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 md:pb-12 container mx-auto px-4 max-w-5xl">
      <div className="mb-6">
        <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-mono">{grievance.id}</h1>
            <Badge variant={grievance.status === 'Resolved' ? 'success' : grievance.status === 'In Progress' ? 'warning' : 'primary'}>{grievance.status}</Badge>
          </div>
          <h2 className="text-lg text-gray-600 dark:text-gray-300">{grievance.title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={() => setShowReceipt(!showReceipt)}>
            {showReceipt ? 'Hide Acknowledgement' : 'View Acknowledgement'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
            {isGeneratingPdf ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Download size={16} className="mr-2" />}
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSearchParams({})}>Track Another</Button>
          {currentUserRole === 'Admin' ? (
            <Button variant="primary" size="sm" onClick={() => setIsCommenting(true)}>Add Comment</Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsCitizenCommenting(true)}>Add Comment</Button>
          )}
        </div>
      </div>

      {showReceipt && (
        <div className="mb-8 overflow-hidden rounded shadow-sm border border-gray-200 dark:border-gray-800">
          <AcknowledgementReceipt grievance={grievance} />
        </div>
      )}

      {/* Hidden receipt for PDF capture */}
      <div className="fixed top-[-9999px] left-[-9999px]">
        <div ref={hiddenReceiptRef} className="w-[800px] bg-white text-black p-8">
          <AcknowledgementReceipt grievance={grievance} />
        </div>
      </div>

      {isCommenting && (
        <Card className="mb-8 border-primary/20 dark:border-blue-900/30 shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Add Official Comment</h3>
            <Textarea
              className="mb-3 text-sm h-24"
              placeholder="Type a message to the citizen..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setIsCommenting(false); setCommentText(''); }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (commentText.trim()) {
                    addMessage(grievance.id, {
                      id: Math.random().toString(),
                      sender: 'Admin',
                      text: commentText,
                      timestamp: new Date().toLocaleTimeString()
                    });
                    setCommentText('');
                    setIsCommenting(false);
                  }
                }}
              >
                Post Comment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isCitizenCommenting && (
        <Card className="mb-8 border-emerald-200 dark:border-emerald-900/30 shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Add a Comment</h3>
            <Textarea
              className="mb-3 text-sm h-24"
              placeholder="Type your message to the department..."
              value={citizenCommentText}
              onChange={(e) => setCitizenCommentText(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setIsCitizenCommenting(false); setCitizenCommentText(''); }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (citizenCommentText.trim()) {
                    addMessage(grievance.id, {
                      id: Math.random().toString(),
                      sender: 'Citizen',
                      text: citizenCommentText,
                      timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
                    });
                    setCitizenCommentText('');
                    setIsCitizenCommenting(false);
                  }
                }}
              >
                Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
              <CardTitle className="flex items-center">
                <Clock className="mr-2 text-primary" size={20} />
                Resolution Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 md:ml-4 space-y-8 pb-4">
                {timeline.map((step, i) => (
                  <div key={i} className="relative pl-8">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full flex items-center justify-center border-4 border-white dark:border-surface-dark ${step.status === 'completed' ? 'bg-accent' :
                        step.status === 'current' ? 'bg-warning animate-pulse-subtle' :
                          'bg-gray-300 dark:bg-gray-600'
                      }`}>
                      {step.status === 'completed' && <CheckCircle2 size={12} className="text-white" />}
                    </div>

                    <div>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-1 gap-1">
                        <h3 className={`font-semibold ${step.status === 'pending' ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                          {step.title}
                        </h3>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md w-fit">
                          {step.date}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Communication Log</h3>
              {grievance.messages.length === 0 ? (
                <p className="text-sm text-gray-500">No messages yet.</p>
              ) : (
                <div className="space-y-4">
                  {grievance.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg border ${
                        msg.sender === 'Citizen'
                          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30'
                          : 'bg-gray-50 dark:bg-[#1A2332] border-gray-100 dark:border-gray-800'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-semibold text-sm ${
                          msg.sender === 'Citizen' ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'
                        }`}>{msg.sender}</span>
                        <span className="text-xs text-gray-500">{msg.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{msg.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-t-4 border-t-warning">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider">SLA Status</h3>
              {(() => {
                const daysLeft = calcDaysLeft(grievance.createdAt, grievance.priority);
                const progress = calcProgress(grievance.status);
                const slaWindow = SLA_DAYS[grievance.priority] ?? 7;
                // Progress bar colour: green if resolved, amber if on track, red if overdue
                const barColor =
                  grievance.status === 'Resolved' ? 'bg-accent' :
                    daysLeft !== null && daysLeft < 0 ? 'bg-red-500' : 'bg-warning';

                return (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Resolution Progress</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-3">
                      <div
                        className={`${barColor} h-2.5 rounded-full transition-all`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {daysLeft !== null ? (
                      <p className={`text-xs font-medium text-right ${daysLeft < 0 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                        {daysLeft < 0
                          ? `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''}`
                          : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining (of ${slaWindow}-day SLA)`
                        }
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-right">{grievance.sla}</p>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">AI Intelligence</h3>
                <div className="flex items-start bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
                  <Bot className="text-primary mt-0.5 mr-2 shrink-0" size={16} />
                  <div>
                    <p className="text-sm text-primary dark:text-blue-300 font-medium mb-1">Priority: {grievance.priority}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{grievance.aiSummary}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Department Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Building2 className="text-gray-400 mr-3 shrink-0" size={16} />
                    <span className="text-gray-900 dark:text-gray-200">{grievance.dept}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <User className="text-gray-400 mr-3 shrink-0" size={16} />
                    <span className="text-gray-900 dark:text-gray-200">Admin</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="text-gray-400 mr-3 shrink-0" size={16} />
                    <span className="text-gray-900 dark:text-gray-200">{grievance.location}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
