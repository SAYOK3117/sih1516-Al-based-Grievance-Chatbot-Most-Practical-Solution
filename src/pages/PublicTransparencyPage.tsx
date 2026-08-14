import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { MapPin, TrendingUp, Users, CheckCircle2 } from 'lucide-react';

export function PublicTransparencyPage() {
  const barData = [
    { name: 'Water', resolved: 85, total: 100 },
    { name: 'Electricity', resolved: 92, total: 100 },
    { name: 'Roads', resolved: 65, total: 100 },
    { name: 'Sanitation', resolved: 78, total: 100 },
    { name: 'Police', resolved: 95, total: 100 },
  ];

  const lineData = [
    { name: 'Week 1', filed: 400, resolved: 240 },
    { name: 'Week 2', filed: 300, resolved: 398 },
    { name: 'Week 3', filed: 200, resolved: 480 },
    { name: 'Week 4', filed: 278, resolved: 390 },
  ];

  return (
    <div className="pt-24 pb-20 container mx-auto px-4 max-w-6xl">
      <div className="text-center mb-12 max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Transparency Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">
          We believe in complete open data. Track how efficiently your local government is resolving citizen grievances in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-primary to-blue-800 text-white border-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/20 rounded-lg"><CheckCircle2 size={24} /></div>
              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">+12% this month</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">87.4%</h3>
            <p className="text-blue-100 text-sm font-medium">Overall Resolution Rate</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/20 rounded-lg"><TrendingUp size={24} /></div>
              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">-1.5 days</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">3.2 Days</h3>
            <p className="text-emerald-100 text-sm font-medium">Average Resolution Time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white border-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/20 rounded-lg"><Users size={24} /></div>
              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">+5k users</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">142k</h3>
            <p className="text-purple-100 text-sm font-medium">Active Citizens</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Resolution Rate by Department</CardTitle>
            <CardDescription>Percentage of complaints resolved within SLA</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#6B7280', fontSize: 12 }} width={80} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1A2332', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="resolved" fill="#1E9E7C" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Complaints Filed vs Resolved</CardTitle>
            <CardDescription>Last 30 days trend</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1A2332', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="filed" stroke="#E8A33D" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Filed" />
                <Line type="monotone" dataKey="resolved" stroke="#1E9E7C" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><MapPin className="mr-2 text-primary" size={20} /> Live Issue Density Map</CardTitle>
          <CardDescription>Visualizing complaint hotspots (Illustrative Data)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[400px] bg-[#0F1620] rounded-xl relative overflow-hidden flex items-center justify-center border border-gray-800">
            {/* Dark Map Mockup with grid */}
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#1f2937 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            {/* Heatmap Dots Mock */}
            <div className="absolute top-[30%] left-[40%] w-32 h-32 bg-alert/30 rounded-full blur-2xl"></div>
            <div className="absolute top-[32%] left-[42%] w-16 h-16 bg-alert/60 rounded-full blur-xl"></div>
            
            <div className="absolute top-[60%] left-[20%] w-40 h-40 bg-warning/30 rounded-full blur-2xl"></div>
            <div className="absolute top-[65%] left-[22%] w-20 h-20 bg-warning/50 rounded-full blur-xl"></div>
            
            <div className="absolute top-[20%] left-[70%] w-24 h-24 bg-primary/40 rounded-full blur-xl"></div>
            
            <div className="absolute bottom-6 right-6 bg-[#1A2332]/80 backdrop-blur border border-gray-700 p-3 rounded-lg flex flex-col gap-2 text-xs">
              <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-alert mr-2"></span> High Density (Overdue)</div>
              <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-warning mr-2"></span> Medium Density</div>
              <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-primary mr-2"></span> New Issues</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
