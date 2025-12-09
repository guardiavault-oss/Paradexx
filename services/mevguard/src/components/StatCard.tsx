import { Card } from './ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  className?: string;
}

export function StatCard({ title, value, icon, trend, trendUp, subtitle, className }: StatCardProps) {
  return (
    <Card className={`p-6 border ${className || 'bg-[#1a1a1a] border-[#2a2a2a]'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="text-gray-400 text-sm">{title}</div>
        <div className="text-gray-400">{icon}</div>
      </div>
      
      <div className="space-y-2">
        <div className="text-white tracking-tight">{value}</div>
        
        <div className="flex items-center gap-3">
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${trendUp ? 'text-emerald-500' : 'text-gray-500'}`}>
              {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{trend}</span>
            </div>
          )}
          {subtitle && (
            <span className="text-sm text-gray-500">{subtitle}</span>
          )}
        </div>
      </div>
    </Card>
  );
}