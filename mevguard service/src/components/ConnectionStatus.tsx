import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import type { ConnectionStatus as StatusType } from '../lib/websocket-manager';

interface ConnectionStatusProps {
  status: StatusType;
  stats?: {
    messagesReceived: number;
    reconnectAttempts: number;
    lastHeartbeat: Date | null;
    duplicatesDropped: number;
  };
  className?: string;
}

const statusConfig = {
  connecting: {
    label: 'Connecting...',
    icon: RefreshCw,
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    animate: true,
  },
  connected: {
    label: 'Live',
    icon: Wifi,
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    animate: false,
  },
  reconnecting: {
    label: 'Reconnecting...',
    icon: RefreshCw,
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    animate: true,
  },
  disconnected: {
    label: 'Offline',
    icon: WifiOff,
    color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    animate: false,
  },
  error: {
    label: 'Error',
    icon: AlertTriangle,
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    animate: false,
  },
  stale: {
    label: 'Connection Stale',
    icon: Clock,
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    animate: true,
  },
};

export function ConnectionStatus({ status, stats, className = '' }: ConnectionStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const tooltipContent = stats ? (
    <div className="space-y-1 text-xs">
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">Status:</span>
        <span className="text-white">{config.label}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">Messages:</span>
        <span className="text-white">{stats.messagesReceived.toLocaleString()}</span>
      </div>
      {stats.reconnectAttempts > 0 && (
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Reconnects:</span>
          <span className="text-white">{stats.reconnectAttempts}</span>
        </div>
      )}
      {stats.duplicatesDropped > 0 && (
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Duplicates Dropped:</span>
          <span className="text-white">{stats.duplicatesDropped}</span>
        </div>
      )}
      {stats.lastHeartbeat && (
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Last Heartbeat:</span>
          <span className="text-white">
            {new Date(stats.lastHeartbeat).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  ) : (
    <span className="text-xs">{config.label}</span>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${config.color} border ${className}`}
          >
            <Icon 
              className={`w-3 h-3 mr-1.5 ${config.animate ? 'animate-spin' : ''}`}
            />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="bg-[#1a1a1a] border-[#2a2a2a]">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
