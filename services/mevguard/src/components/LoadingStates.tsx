// Loading State Components
import { Skeleton } from './ui/skeleton';
import { Card } from './ui/card';
import { Loader2 } from 'lucide-react';

export function CardSkeleton() {
  return (
    <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-40" />
    </Card>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-3 w-full max-w-sm" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
      <Skeleton className="h-6 w-40 mb-6" />
      <div className="h-64 flex items-end gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${Math.random() * 100}%` }}
          />
        ))}
      </div>
    </Card>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading MEVGUARD...</p>
      </div>
    </div>
  );
}

export function InlineLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-400">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <TableSkeleton rows={8} />
    </div>
  );
}
