import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant?: "card" | "stats" | "list" | "chart" | "table";
  className?: string;
}

export function LoadingSkeleton({ variant = "card", className }: LoadingSkeletonProps) {
  switch (variant) {
    case "stats":
      return (
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6", className)}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-4 sm:p-6 space-y-4">
              <div className="flex items-start justify-between">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      );

    case "card":
      return (
        <div className={cn("glass-card p-6 sm:p-8 space-y-6", className)}>
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass p-4 sm:p-6 rounded-2xl space-y-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      );

    case "list":
      return (
        <div className={cn("space-y-3", className)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl glass">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-4" />
            </div>
          ))}
        </div>
      );

    case "chart":
      return (
        <div className={cn("glass-card p-6 space-y-4", className)}>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      );

    case "table":
      return (
        <div className={cn("glass-card overflow-hidden", className)}>
          <div className="p-4 border-b border-white/10">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="divide-y divide-white/5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return <Skeleton className={className} />;
  }
}

