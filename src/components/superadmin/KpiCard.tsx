import { Card, CardContent } from '../ui/Card';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass?: string;
}

export function KpiCard({ title, value, icon: Icon, colorClass = "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30" }: KpiCardProps) {
  return (
    <Card className="border-gray-100 dark:border-gray-800 shadow-sm transition-transform hover:-translate-y-1 duration-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl ${colorClass}`}>
            <Icon size={28} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
