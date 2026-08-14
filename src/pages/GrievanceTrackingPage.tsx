import { ArrowLeft, Clock, CheckCircle2, MapPin, Building2, User, Bot } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useStore } from '../lib/store';

export function GrievanceTrackingPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') || 'G-2023-8942';
  const { grievances } = useStore();
  const grievance = grievances.find(g => g.id === id);

  const timeline = [
    { title: 'Grievance Filed', date: grievance?.date || 'Oct 24, 2023', status: 'completed', desc: 'Complaint registered successfully.' },
    { title: 'AI Analysis & Routing', date: grievance?.date || 'Oct 24, 2023', status: 'completed', desc: `Classified as ${grievance?.priority} Priority. Routed to ${grievance?.dept} dept.` },
    { title: 'Resolution', date: 'Expected: ' + (grievance?.sla || 'Soon'), status: grievance?.status === 'Resolved' ? 'completed' : 'pending', desc: grievance?.status === 'Resolved' ? 'Resolved' : 'Pending completion.' },
  ];

  if (!grievance) {
    return <div className="pt-24 text-center">Grievance not found.</div>;
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
        <div className="flex items-center space-x-2">
          <Button variant="outline">Download PDF</Button>
          <Button variant="primary">Add Comment</Button>
        </div>
      </div>

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
                    <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full flex items-center justify-center border-4 border-white dark:border-surface-dark ${
                      step.status === 'completed' ? 'bg-accent' :
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
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Messages from Admin</h3>
              {grievance.messages.length === 0 ? (
                <p className="text-sm text-gray-500">No messages yet.</p>
              ) : (
                <div className="space-y-4">
                  {grievance.messages.map(msg => (
                    <div key={msg.id} className="p-4 bg-gray-50 dark:bg-[#1A2332] rounded-lg border border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm text-primary">{msg.sender}</span>
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
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Target Resolution</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">Oct 28, 2023</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                <div className="bg-warning h-2.5 rounded-full w-[60%]"></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-right">2 days remaining</p>
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
