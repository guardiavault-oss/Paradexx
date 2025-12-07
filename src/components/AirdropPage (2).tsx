/**
 * AirdropPage - Airdrop Hunter & Farming Opportunities
 * Find, track, and claim airdrops
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Gift, Sparkles, Clock, Check, X, ExternalLink,
    Target, Wallet, TrendingUp, Filter, Search, Zap
} from 'lucide-react';

interface Airdrop {
    id: string;
    projectName: string;
    tokenSymbol: string;
    status: 'upcoming' | 'active' | 'ended';
    estimatedValue: string;
    claimStartDate?: string;
    claimEndDate?: string;
    requirements: string[];
    verified: boolean;
    categories: string[];
    description: string;
}

interface AirdropPageProps {
  onBack?: () => void;
  type: "degen" | "regen";
}

export function AirdropPage({ onBack, type }: AirdropPageProps) {
    const isDegen = type === "degen";
    const primaryColor = isDegen ? "#DC143C" : "#0080FF";
    
    const [activeTab, setActiveTab] = useState<'airdrops' | 'farming' | 'eligible'>('airdrops');
    const [airdrops, setAirdrops] = useState<Airdrop[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Mock data
    const mockAirdrops: Airdrop[] = [
        {
            id: '1',
            projectName: 'LayerZero',
            tokenSymbol: 'ZRO',
            status: 'active',
            estimatedValue: '$500 - $2,000',
            description: 'Cross-chain interoperability protocol airdrop',
            verified: true,
            categories: ['DeFi', 'Infrastructure'],
            requirements: ['Bridge assets', 'Complete tasks'],
        },
        {
            id: '2',
            projectName: 'zkSync',
            tokenSymbol: 'ZK',
            status: 'upcoming',
            estimatedValue: '$1,000 - $5,000',
            description: 'Zero-knowledge rollup Layer 2 solution',
            verified: true,
            categories: ['L2', 'Scaling'],
            requirements: ['Use zkSync Era', 'Hold NFTs'],
        },
    ];

    useEffect(() => {
        setAirdrops(mockAirdrops);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'upcoming': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'ended': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        }
    };

    const filteredAirdrops = statusFilter === 'all'
        ? airdrops
        : airdrops.filter(a => a.status === statusFilter);

    return (
        <div className="min-h-screen text-white p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                    <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)` }}
                        >
                            <Gift className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Airdrop Hunter</h1>
                            <p className="text-white/60 text-sm">Find and claim free tokens</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-white/60 text-sm mb-1">Total Claimed</div>
                    <div className="text-2xl font-bold" style={{ color: primaryColor }}>0</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-white/60 text-sm mb-1">Total Value</div>
                    <div className="text-2xl font-bold text-green-400">$0</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-white/60 text-sm mb-1">Eligible Now</div>
                    <div className="text-2xl font-bold text-blue-400">0</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-white/60 text-sm mb-1">Upcoming</div>
                    <div className="text-2xl font-bold">2</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                {[
                    { id: 'airdrops', label: 'All Airdrops', icon: Gift },
                    { id: 'eligible', label: 'Eligible', icon: Check },
                    { id: 'farming', label: 'Farming', icon: Sparkles },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-2`}
                        style={{
                            background: activeTab === tab.id ? primaryColor : 'rgba(255, 255, 255, 0.05)',
                            color: activeTab === tab.id ? 'white' : 'rgba(255, 255, 255, 0.6)',
                        }}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'airdrops' && (
                    <motion.div
                        key="airdrops"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        {/* Filter */}
                        <div className="flex gap-2 mb-4">
                            {['all', 'active', 'upcoming', 'ended'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-1.5 rounded-lg text-sm capitalize`}
                                    style={{
                                        background: statusFilter === status ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                        color: statusFilter === status ? 'white' : 'rgba(255, 255, 255, 0.6)',
                                    }}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        {/* Airdrop List */}
                        <div className="space-y-4">
                            {filteredAirdrops.length === 0 ? (
                                <div className="text-center py-12 bg-white/5 rounded-xl">
                                    <Gift className="w-12 h-12 mx-auto mb-4 text-white/30" />
                                    <p className="text-white/60">No airdrops found</p>
                                </div>
                            ) : (
                                filteredAirdrops.map(airdrop => (
                                    <motion.div
                                        key={airdrop.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="bg-white/5 rounded-xl p-5 border border-white/10"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div 
                                                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                                                  style={{ background: `${primaryColor}40` }}
                                                >
                                                    {airdrop.tokenSymbol?.slice(0, 2) || '??'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-lg flex items-center gap-2">
                                                        {airdrop.projectName}
                                                        {airdrop.verified && <Check className="w-4 h-4 text-green-400" />}
                                                    </div>
                                                    <div className="text-sm text-white/60">{airdrop.tokenSymbol}</div>
                                                </div>
                                            </div>
                                            <span className={`text-xs px-3 py-1 rounded-full border capitalize ${getStatusColor(airdrop.status)}`}>
                                                {airdrop.status}
                                            </span>
                                        </div>

                                        <p className="text-sm text-white/60 mb-3">{airdrop.description}</p>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {airdrop.categories.map(cat => (
                                                <span key={cat} className="text-xs px-2 py-1 bg-white/5 rounded text-white/60">
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm text-white/60">Estimated Value</div>
                                                <div className="text-lg font-bold" style={{ color: primaryColor }}>
                                                    {airdrop.estimatedValue}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                  className="px-4 py-2 rounded-lg text-sm border"
                                                  style={{ borderColor: `${primaryColor}40`, color: primaryColor }}
                                                >
                                                    Check Eligibility
                                                </button>
                                                {airdrop.status === 'active' && (
                                                    <button 
                                                      className="px-4 py-2 rounded-lg text-sm text-white"
                                                      style={{ background: primaryColor }}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'eligible' && (
                    <motion.div
                        key="eligible"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <div className="text-center py-12 bg-white/5 rounded-xl">
                            <Check className="w-12 h-12 mx-auto mb-4 text-white/30" />
                            <p className="text-white/60">No eligible airdrops found</p>
                            <p className="text-sm text-white/40 mt-1">Check eligibility for active airdrops</p>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'farming' && (
                    <motion.div
                        key="farming"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <div 
                          className="rounded-xl p-4 mb-6"
                          style={{ background: `${primaryColor}20`, border: `1px solid ${primaryColor}40` }}
                        >
                            <div className="flex items-center gap-2 font-medium mb-1" style={{ color: primaryColor }}>
                                <Zap className="w-5 h-5" />
                                Farming Opportunities
                            </div>
                            <p className="text-sm text-white/60">
                                Complete these tasks to potentially qualify for future airdrops
                            </p>
                        </div>

                        <div className="text-center py-12 bg-white/5 rounded-xl">
                            <Sparkles className="w-12 h-12 mx-auto mb-4 text-white/30" />
                            <p className="text-white/60">No farming opportunities</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default AirdropPage;
