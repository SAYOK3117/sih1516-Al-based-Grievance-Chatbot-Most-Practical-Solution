import { Card, CardContent } from '../ui/Card';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass?: string;
  onClick?: () => void;
  subtitle?: string;
}

export function KpiCard({ 
  title, 
  value, 
  icon: Icon, 
  colorClass = "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30",
  onClick,
  subtitle
}: KpiCardProps) {
  return (
    <Card 
      onClick={onClick}
      className={`border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-200 ${
        onClick 
          ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600/60 active:scale-[0.99] group' 
          : 'transition-transform hover:-translate-y-1'
      }`}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex items-center gap-1.5">
              {title}
            </p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{value}</h3>
            {subtitle ? (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            ) : onClick ? (
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-2 opacity-70 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                View panel →
              </p>
            ) : null}
          </div>
          <div className={`p-3 rounded-xl ${colorClass} group-hover:scale-110 transition-transform`}>
            <Icon size={28} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
