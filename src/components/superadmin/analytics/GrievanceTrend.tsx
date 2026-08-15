import { useMemo } from 'react';
import type { Grievance } from '../../../lib/store';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function GrievanceTrend({ grievances }: { grievances: Grievance[] }) {
  const trendData = useMemo(() => {
    // We group by Date (MMM dd). 
    const dateMap: Record<string, { date: string, incoming: number, resolved: number, timestamp: number }> = {};
    
    const formatDate = (d: Date) => {
      const month = d.toLocaleString('default', { month: 'short' });
      const day = d.getDate().toString().padStart(2, '0');
      return `${month} ${day}`;
    };

    grievances.forEach(g => {
      // Incoming
      const cDateStr = g.createdAt || g.date;
      if (cDateStr) {
        const d = new Date(cDateStr);
        if (!isNaN(d.getTime())) {
          const key = formatDate(d);
          if (!dateMap[key]) {
            dateMap[key] = { date: key, incoming: 0, resolved: 0, timestamp: d.getTime() };
          }
          dateMap[key].incoming++;
        }
      }

      // Resolved
      if (g.status === 'Resolved' && g.updatedAt) {
        const rDate = new Date(g.updatedAt);
        if (!isNaN(rDate.getTime())) {
          const key = formatDate(rDate);
          if (!dateMap[key]) {
            dateMap[key] = { date: key, incoming: 0, resolved: 0, timestamp: rDate.getTime() };
          }
          dateMap[key].resolved++;
        }
      }
    });

    // Sort by timestamp
    const sorted = Object.values(dateMap).sort((a, b) => a.timestamp - b.timestamp);
    
    return sorted;
  }, [grievances]);

  return (
    <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-4 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="font-bold text-gray-900 dark:text-white">Grievance Trend</h3>
        <p className="text-xs text-gray-500 mt-1">Incoming vs Resolved grievances over time</p>
      </div>
      
      <div className="flex-1 min-h-[300px]">
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" name="Incoming" dataKey="incoming" stroke="#9333ea" strokeWidth={2} fillOpacity={1} fill="url(#colorIncoming)" />
              <Area type="monotone" name="Resolved" dataKey="resolved" stroke="#16a34a" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-gray-500 italic">
            Insufficient historical data for trend visualization.
          </div>
        )}
      </div>
    </div>
  );
}
