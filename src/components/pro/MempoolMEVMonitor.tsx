/**
 * Mempool & MEV Monitor - Pro User Dashboard
 * Comprehensive real-time monitoring and protection interface
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { toast } from '@/components/Toast';
import {
    useMempoolDashboard,
    useMempoolTransactions,
    useMempoolMEVOpportunities,
    useMempoolThreats,
    useMempoolNetworks,
    useMEVProtectionStatus,
    useMEVDashboard,
    useMEVThreats,
    useMEVStats,
    useMEVNetworks,
    useMEVRelays,
    useMEVKPIMetrics,
    useMEVLiveMonitoring,
    useStartMEVProtection,
    useStopMEVProtection,
    useToggleMEVProtection,
} from '@/hooks/useApiQuery';
import { subscribeToMempoolTransactions, subscribeToMempoolAlerts, subscribeToMempoolDashboard } from '@/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    Shield, 
    Activity, 
    AlertTriangle, 
    TrendingUp, 
    Network, 
    Zap,
    Play,
    Square,
    RefreshCw,
    BarChart3,
    Eye,
    Lock,
    Download,
    Search,
    Filter
} from 'lucide-react';

interface MempoolMEVMonitorProps {
    type?: 'degen' | 'regen';
    onClose?: () => void;
}

export default function MempoolMEVMonitor({ type = 'degen', onClose }: MempoolMEVMonitorProps) {
    const [selectedNetwork, setSelectedNetwork] = useState<string>('ethereum');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [liveTransactions, setLiveTransactions] = useState<unknown[]>([]);
    const [liveAlerts, setLiveAlerts] = useState<unknown[]>([]);

    // Mempool queries
    const { data: mempoolDashboard, isLoading: mempoolLoading } = useMempoolDashboard({
        enabled: autoRefresh,
    });
    const { data: mempoolTxs } = useMempoolTransactions({
        network: selectedNetwork,
        suspicious_only: false,
        limit: 50,
    });
    const { data: mevOpportunities } = useMempoolMEVOpportunities({
        network: selectedNetwork,
        limit: 20,
    });
    const { data: threats } = useMempoolThreats({
        network: selectedNetwork,
        limit: 20,
    });
    const { data: networks } = useMempoolNetworks();

    // MEV Protection queries
    const { data: mevStatus, error: mevStatusError, isLoading: mevStatusLoading } = useMEVProtectionStatus();
    const { data: mevDashboard, error: mevDashboardError } = useMEVDashboard();
    const { data: mevThreats, error: mevThreatsError } = useMEVThreats({ network: selectedNetwork });
    const { data: mevStats, error: mevStatsError } = useMEVStats(selectedNetwork, '24h');
    const { data: mevNetworks, error: mevNetworksError } = useMEVNetworks();
    const { data: relays, error: relaysError } = useMEVRelays();
    const { data: kpiMetrics, error: kpiMetricsError } = useMEVKPIMetrics();
    const { data: liveMonitoring, error: liveMonitoringError } = useMEVLiveMonitoring();

    // Mutations
    const startProtection = useStartMEVProtection();
    const stopProtection = useStopMEVProtection();
    const toggleProtection = useToggleMEVProtection();

    // WebSocket connection status
    const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

    // WebSocket subscriptions
    useEffect(() => {
        let unsubscribeTx: (() => void) | undefined;
        let unsubscribeAlerts: (() => void) | undefined;
        let unsubscribeDashboard: (() => void) | undefined;
        let unsubscribeStatus: (() => void) | undefined;

        try {
            unsubscribeTx = subscribeToMempoolTransactions((data) => {
                setLiveTransactions(prev => [data, ...prev].slice(0, 100));
            });

            unsubscribeAlerts = subscribeToMempoolAlerts((data) => {
                setLiveAlerts(prev => [data, ...prev].slice(0, 50));
            });

            unsubscribeDashboard = subscribeToMempoolDashboard((data) => {
                // Update dashboard data
            });

            // Subscribe to WebSocket status changes
            import('@/services').then(({ mempoolWsService }) => {
                unsubscribeStatus = mempoolWsService.onStatusChange((status) => {
                    setWsStatus(status);
                });
                // Set initial status
                setWsStatus(mempoolWsService.status);
            }).catch(() => {
                setWsStatus('error');
            });
        } catch (error) {
            console.error('Failed to subscribe to mempool WebSocket:', error);
            setWsStatus('error');
        }

        return () => {
            unsubscribeTx?.();
            unsubscribeAlerts?.();
            unsubscribeDashboard?.();
            unsubscribeStatus?.();
        };
    }, []);

    // Memoized computed values
    const isProtectionActive = useMemo(() => mevStatus?.data?.is_active || false, [mevStatus?.data?.is_active]);
    const protectionLevel = useMemo(() => mevStatus?.data?.protection_level || 'standard', [mevStatus?.data?.protection_level]);
    
    // Memoized network options
    const networkOptions = useMemo(() => [
        { value: 'ethereum', label: 'Ethereum' },
        { value: 'polygon', label: 'Polygon' },
        { value: 'bsc', label: 'BSC' },
        { value: 'arbitrum', label: 'Arbitrum' },
        { value: 'optimism', label: 'Optimism' },
        { value: 'avalanche', label: 'Avalanche' },
    ], []);

    const handleToggleProtection = useCallback(() => {
        toggleProtection.mutate(!isProtectionActive, {
            onSuccess: () => {
                toast.success(
                    isProtectionActive ? 'MEV Protection stopped' : 'MEV Protection started',
                    { type, duration: 3000 }
                );
            },
            onError: (error) => {
                console.error('Failed to toggle protection:', error);
                toast.error(
                    `Failed to ${isProtectionActive ? 'stop' : 'start'} protection: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    { type, duration: 5000 }
                );
            },
        });
    }, [isProtectionActive, toggleProtection, type]);

    const handleStartProtection = useCallback(() => {
        startProtection.mutate({
            networks: [selectedNetwork],
            protectionLevel: 'high',
        }, {
            onSuccess: () => {
                toast.success(`MEV Protection started for ${selectedNetwork}`, { type, duration: 3000 });
            },
            onError: (error) => {
                console.error('Failed to start protection:', error);
                toast.error(
                    `Failed to start protection: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    { type, duration: 5000 }
                );
            },
        });
    }, [selectedNetwork, startProtection, type]);

    const handleStopProtection = useCallback(() => {
        stopProtection.mutate({ networks: [selectedNetwork] }, {
            onSuccess: () => {
                toast.success(`MEV Protection stopped for ${selectedNetwork}`, { type, duration: 3000 });
            },
            onError: (error) => {
                console.error('Failed to stop protection:', error);
                toast.error(
                    `Failed to stop protection: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    { type, duration: 5000 }
                );
            },
        });
    }, [selectedNetwork, stopProtection, type]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Error Alert */}
                {hasError && (
                    <Alert className="bg-red-900/20 border-red-500/50 mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Connection Error</AlertTitle>
                        <AlertDescription>
                            {mempoolError instanceof Error ? mempoolError.message : 'Failed to connect to monitoring services. Please check your connection.'}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Shield className="w-8 h-8 text-purple-400" />
                            Mempool & MEV Monitor
                        </h1>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-slate-400">Real-time blockchain monitoring and protection</p>
                            <Badge 
                                variant={wsStatus === 'connected' ? 'default' : wsStatus === 'connecting' ? 'secondary' : 'destructive'}
                                className="flex items-center gap-1"
                            >
                                <div className={`w-2 h-2 rounded-full ${
                                    wsStatus === 'connected' ? 'bg-green-400' :
                                    wsStatus === 'connecting' ? 'bg-yellow-400' :
                                    'bg-red-400'
                                }`} />
                                {wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting' : 'Disconnected'}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Network Selector */}
                        <select
                            value={selectedNetwork}
                            onChange={(e) => {
                                setSelectedNetwork(e.target.value);
                                toast.info(`Switched to ${e.target.value} network`, { type, duration: 2000 });
                            }}
                            className="bg-slate-800 text-white border border-slate-700 rounded-md px-3 py-2 text-sm hover:border-purple-500/50 transition-colors"
                        >
                            {networkOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <Button
                            variant={isProtectionActive ? "destructive" : "default"}
                            onClick={handleToggleProtection}
                            disabled={toggleProtection.isPending}
                        >
                            {toggleProtection.isPending ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    {isProtectionActive ? 'Stopping...' : 'Starting...'}
                                </>
                            ) : isProtectionActive ? (
                                <>
                                    <Square className="w-4 h-4 mr-2" />
                                    Stop Protection
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Start Protection
                                </>
                            )}
                        </Button>
                        {onClose && (
                            <Button variant="ghost" onClick={onClose}>
                                Close
                            </Button>
                        )}
                    </div>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-slate-800/50 border-purple-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-300">Protection Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="text-2xl font-bold">
                                    {isProtectionActive ? (
                                        <span className="text-green-400">Active</span>
                                    ) : (
                                        <span className="text-red-400">Inactive</span>
                                    )}
                                </div>
                                <Badge variant={isProtectionActive ? "default" : "secondary"}>
                                    {protectionLevel}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-purple-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-300">MEV Saved (24h)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {kpiMetrics?.data ? (
                                <div className="text-2xl font-bold text-purple-400">
                                    {kpiMetrics.data.total_mev_saved_eth?.toFixed(4) || '0.0000'} ETH
                                </div>
                            ) : (
                                <Skeleton className="h-8 w-24" />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-purple-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-300">Threats Detected</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {mevStats?.isLoading ? (
                                <Skeleton className="h-8 w-24" />
                            ) : mevStats?.error ? (
                                <div className="text-sm text-red-400">Error loading</div>
                            ) : mevStats?.data ? (
                                <div className="text-2xl font-bold text-orange-400">
                                    {mevStats.data.statistics?.threats_detected || 0}
                                </div>
                            ) : (
                                <Skeleton className="h-8 w-24" />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-purple-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-300">Active Networks</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {networks?.isLoading ? (
                                <Skeleton className="h-8 w-24" />
                            ) : networks?.error ? (
                                <div className="text-sm text-red-400">Error loading</div>
                            ) : networks?.data ? (
                                <div className="text-2xl font-bold text-blue-400">
                                    {networks.data.total_active || 0}
                                </div>
                            ) : (
                                <Skeleton className="h-8 w-24" />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList className="bg-slate-800/50">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="transactions">Live Transactions</TabsTrigger>
                        <TabsTrigger value="mev">MEV Opportunities</TabsTrigger>
                        <TabsTrigger value="threats">Threat Intelligence</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        <TabsTrigger value="networks">Networks</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Mempool Dashboard */}
                            <Card className="bg-slate-800/50 border-purple-500/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="w-5 h-5" />
                                        Mempool Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {mempoolLoading ? (
                                        <Skeleton className="h-32" />
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Pending Transactions:</span>
                                                <span className="font-bold">
                                                    {mempoolDashboard?.data?.pending_transactions || 0}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Suspicious:</span>
                                                <span className="font-bold text-orange-400">
                                                    {mempoolDashboard?.data?.suspicious_transactions || 0}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">MEV Opportunities:</span>
                                                <span className="font-bold text-purple-400">
                                                    {mempoolDashboard?.data?.mev_opportunities || 0}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* MEV Protection Status */}
                            <Card className="bg-slate-800/50 border-purple-500/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="w-5 h-5" />
                                        MEV Protection
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {mevStatusLoading ? (
                                        <Skeleton className="h-32" />
                                    ) : mevStatusError ? (
                                        <Alert variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertTitle>Error</AlertTitle>
                                            <AlertDescription>
                                                {mevStatusError instanceof Error ? mevStatusError.message : 'Failed to load MEV status'}
                                            </AlertDescription>
                                        </Alert>
                                    ) : mevStatus?.data ? (
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Status:</span>
                                                <Badge variant={isProtectionActive ? "default" : "secondary"}>
                                                    {isProtectionActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Active Networks:</span>
                                                <span className="font-bold">
                                                    {mevStatus.data.active_networks?.length || 0}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Transactions Protected:</span>
                                                <span className="font-bold text-green-400">
                                                    {mevStatus.data.statistics?.transactions_protected || 0}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Success Rate:</span>
                                                <span className="font-bold">
                                                    {mevStatus.data.statistics?.success_rate?.toFixed(1) || '0.0'}%
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <Skeleton className="h-32" />
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Alerts */}
                        {liveAlerts.length > 0 && (
                            <Card className="bg-slate-800/50 border-orange-500/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-orange-400">
                                        <AlertTriangle className="w-5 h-5" />
                                        Recent Alerts
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {liveAlerts.slice(0, 5).map((alert: any, index) => (
                                            <Alert key={index} className="bg-slate-900/50">
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertTitle>{alert.type || 'Alert'}</AlertTitle>
                                                <AlertDescription>{alert.description || JSON.stringify(alert)}</AlertDescription>
                                            </Alert>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="transactions" className="space-y-4">
                        <Card className="bg-slate-800/50 border-purple-500/20">
                            <CardHeader>
                                <CardTitle>Live Transactions</CardTitle>
                                <CardDescription>Real-time mempool transaction monitoring</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {mempoolTxsLoading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-16" />
                                        <Skeleton className="h-16" />
                                        <Skeleton className="h-16" />
                                    </div>
                                ) : mempoolTxsError ? (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>
                                            {mempoolTxsError instanceof Error ? mempoolTxsError.message : 'Failed to load transactions'}
                                        </AlertDescription>
                                    </Alert>
                                ) : mempoolTxs?.data?.transactions?.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No transactions in mempool</p>
                                    </div>
                                ) : mempoolTxs?.data?.transactions ? (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {mempoolTxs.data.transactions.map((tx: any, index: number) => (
                                            <div
                                                key={index}
                                                className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-purple-500/50 transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={tx.is_suspicious ? "destructive" : "secondary"}>
                                                            {tx.network || selectedNetwork}
                                                        </Badge>
                                                        <span className="text-sm font-mono text-slate-300">
                                                            {tx.hash?.slice(0, 10)}...{tx.hash?.slice(-8)}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-bold">
                                                            {(tx.value / 1e18).toFixed(4)} ETH
                                                        </div>
                                                        <div className="text-xs text-slate-400">
                                                            Risk: {tx.risk_score?.toFixed(2) || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        </div>
                                        {mempoolTxs.data.transactions.filter((tx: any) => {
                                            if (showSuspiciousOnly && !tx.is_suspicious) return false;
                                            if (!searchQuery) return true;
                                            const query = searchQuery.toLowerCase();
                                            return (
                                                tx.hash?.toLowerCase().includes(query) ||
                                                tx.from_address?.toLowerCase().includes(query) ||
                                                tx.to_address?.toLowerCase().includes(query)
                                            );
                                        }).length === 0 && (
                                            <div className="text-center py-8 text-slate-400">
                                                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p>No transactions match your filters</p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Skeleton className="h-64" />
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="mev" className="space-y-4">
                        <Card className="bg-slate-800/50 border-purple-500/20">
                            <CardHeader>
                                <CardTitle>MEV Opportunities</CardTitle>
                                <CardDescription>Detected MEV opportunities and attacks</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {mevOpportunities?.data ? (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {mevOpportunities.data.opportunities?.map((op: any, index: number) => (
                                            <div
                                                key={index}
                                                className="p-3 bg-slate-900/50 rounded-lg border border-purple-500/20"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-bold text-purple-400">
                                                            {op.type || 'MEV Opportunity'}
                                                        </div>
                                                        <div className="text-sm text-slate-400">
                                                            Profit: {op.profit_estimate?.toFixed(4) || '0.0000'} ETH
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline">
                                                        Confidence: {(op.confidence * 100).toFixed(0)}%
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <Skeleton className="h-64" />
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="threats" className="space-y-4">
                        <Card className="bg-slate-800/50 border-orange-500/20">
                            <CardHeader>
                                <CardTitle>Threat Intelligence</CardTitle>
                                <CardDescription>Security threats and suspicious activity</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {threats?.isLoading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-20" />
                                        <Skeleton className="h-20" />
                                    </div>
                                ) : threats?.error ? (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>
                                            {threats.error instanceof Error ? threats.error.message : 'Failed to load threats'}
                                        </AlertDescription>
                                    </Alert>
                                ) : threats?.data?.threats?.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No threats detected</p>
                                    </div>
                                ) : threats?.data?.threats ? (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {threats.data.threats.map((threat: any, index: number) => (
                                            <Alert
                                                key={index}
                                                className={`bg-slate-900/50 ${
                                                    threat.severity === 'critical' ? 'border-red-500' :
                                                    threat.severity === 'high' ? 'border-orange-500' :
                                                    'border-yellow-500'
                                                }`}
                                            >
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertTitle>{threat.severity?.toUpperCase()}</AlertTitle>
                                                <AlertDescription>{threat.description || threat.source}</AlertDescription>
                                            </Alert>
                                        ))}
                                    </div>
                                ) : (
                                    <Skeleton className="h-64" />
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Card className="bg-slate-800/50 border-purple-500/20">
                                <CardHeader>
                                    <CardTitle>KPI Metrics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {kpiMetrics?.isLoading ? (
                                        <Skeleton className="h-32" />
                                    ) : kpiMetrics?.error ? (
                                        <Alert variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertTitle>Error</AlertTitle>
                                            <AlertDescription>
                                                {kpiMetrics.error instanceof Error ? kpiMetrics.error.message : 'Failed to load KPI metrics'}
                                            </AlertDescription>
                                        </Alert>
                                    ) : kpiMetrics?.data ? (
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span>Total MEV Saved:</span>
                                                <span className="font-bold text-purple-400">
                                                    {kpiMetrics.data.total_mev_saved_eth?.toFixed(4) || '0.0000'} ETH
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Protection Success Rate:</span>
                                                <span className="font-bold">
                                                    {kpiMetrics.data.protection_success_rate?.toFixed(1) || '0.0'}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>KPI Score:</span>
                                                <span className="font-bold text-green-400">
                                                    {kpiMetrics.data.kpi_score?.toFixed(1) || '0.0'}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <Skeleton className="h-32" />
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/50 border-purple-500/20">
                                <CardHeader>
                                    <CardTitle>24h Statistics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {mevStats?.isLoading ? (
                                        <Skeleton className="h-32" />
                                    ) : mevStats?.error ? (
                                        <Alert variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertTitle>Error</AlertTitle>
                                            <AlertDescription>
                                                {mevStats.error instanceof Error ? mevStats.error.message : 'Failed to load statistics'}
                                            </AlertDescription>
                                        </Alert>
                                    ) : mevStats?.data ? (
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span>Threats Detected:</span>
                                                <span className="font-bold text-orange-400">
                                                    {mevStats.data.statistics?.threats_detected || 0}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Threats Mitigated:</span>
                                                <span className="font-bold text-green-400">
                                                    {mevStats.data.statistics?.threats_mitigated || 0}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Value Protected:</span>
                                                <span className="font-bold">
                                                    ${mevStats.data.statistics?.value_protected?.toFixed(2) || '0.00'}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <Skeleton className="h-32" />
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="networks" className="space-y-4">
                        <Card className="bg-slate-800/50 border-purple-500/20">
                            <CardHeader>
                                <CardTitle>Network Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {networks?.data ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {networks.data.networks?.map((network: any, index: number) => (
                                            <div
                                                key={index}
                                                className={`p-3 rounded-lg border ${
                                                    network.status === 'active'
                                                        ? 'bg-green-900/20 border-green-500/50'
                                                        : 'bg-slate-900/50 border-slate-700'
                                                }`}
                                            >
                                                <div className="font-bold">{network.display_name || network.name}</div>
                                                <div className="text-sm text-slate-400">
                                                    Latency: {network.latency_ms || 0}ms
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <Skeleton className="h-32" />
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-purple-500/20">
                            <CardHeader>
                                <CardTitle>Private Relays</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {relays?.isLoading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-16" />
                                        <Skeleton className="h-16" />
                                    </div>
                                ) : relays?.error ? (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>
                                            {relays.error instanceof Error ? relays.error.message : 'Failed to load relays'}
                                        </AlertDescription>
                                    </Alert>
                                ) : relays?.data?.relays && Object.keys(relays.data.relays).length > 0 ? (
                                    <div className="space-y-2">
                                        {Object.entries(relays.data.relays).map(([key, relay]: [string, any]) => (
                                            <div key={key} className="p-3 bg-slate-900/50 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-bold">{key}</div>
                                                        <div className="text-sm text-slate-400">
                                                            Status: {relay.status}
                                                        </div>
                                                    </div>
                                                    <Badge variant={relay.status === 'connected' ? 'default' : 'secondary'}>
                                                        {relay.success_rate?.toFixed(1) || '0.0'}%
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-slate-400">
                                        <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>No relays configured</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

