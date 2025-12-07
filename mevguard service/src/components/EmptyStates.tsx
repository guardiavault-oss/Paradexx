// Empty State Components
import { Card } from './ui/card';
import { Button } from './ui/button';
import { 
  AlertCircle, 
  Database, 
  Search, 
  Shield, 
  Activity, 
  Network,
  FileText,
  Plus,
  RefreshCw
} from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <Card className="p-12 bg-[#1a1a1a] border-[#2a2a2a] text-center">
      <div className="max-w-md mx-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2a2a2a] mb-4">
          {icon || <Database className="w-8 h-8 text-gray-500" />}
        </div>
        <h3 className="text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-6">{description}</p>
        <div className="flex gap-3 justify-center">
          {action && (
            <Button onClick={action.onClick} className="bg-emerald-600 hover:bg-emerald-700">
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button 
              onClick={secondaryAction.onClick} 
              variant="outline"
              className="border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a]"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export function NoDataYet({ resource = 'data', onAdd }: { resource?: string; onAdd?: () => void }) {
  return (
    <EmptyState
      icon={<Database className="w-8 h-8 text-gray-500" />}
      title={`No ${resource} yet`}
      description={`You haven't created any ${resource} yet. Get started by adding your first one.`}
      action={onAdd ? { label: `Add ${resource}`, onClick: onAdd } : undefined}
    />
  );
}

export function NoSearchResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <EmptyState
      icon={<Search className="w-8 h-8 text-gray-500" />}
      title="No results found"
      description={`No results match "${query}". Try adjusting your search or filters.`}
      action={{ label: 'Clear search', onClick: onClear }}
    />
  );
}

export function NoThreatsDetected() {
  return (
    <EmptyState
      icon={<Shield className="w-8 h-8 text-emerald-500" />}
      title="All clear!"
      description="No threats detected in the last 24 hours. Your assets are protected."
    />
  );
}

export function NoTransactions({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      icon={<Activity className="w-8 h-8 text-gray-500" />}
      title="No transactions"
      description="No transactions found for the selected period or filters."
      action={onRefresh ? { label: 'Refresh', onClick: onRefresh } : undefined}
    />
  );
}

export function NoNetworkConnection({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon={<Network className="w-8 h-8 text-red-500" />}
      title="No connection"
      description="Unable to connect to the network. Please check your connection and try again."
      action={{ label: 'Retry', onClick: onRetry }}
    />
  );
}

export function NoAlerts() {
  return (
    <EmptyState
      icon={<AlertCircle className="w-8 h-8 text-gray-500" />}
      title="No alerts"
      description="You're all caught up! No new alerts at this time."
    />
  );
}
