/**
 * AirdropPage - Airdrop Hunter & Farming Opportunities
 * Find, track, and claim airdrops
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getThemeStyles } from "../design-system";
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
    onClose?: () => void;
    type: "degen" | "regen";
}

export function AirdropPage({ onBack, onClose, type }: AirdropPageProps) {
    // Use design system theme styles
    const theme = getThemeStyles(type);
    const primaryColor = theme.primaryColor;

    // Support both onBack and onClose
    const handleClose = onClose || onBack;

    const [activeTab, setActiveTab] = useState<'airdrops' | 'farming' | 'eligible'>('airdrops');
    const [airdrops, setAirdrops] = useState<Airdrop[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Fetch airdrops from backend API
    useEffect(() => {
        const fetchAirdrops = async () => {
            setLoading(true);
            try {
                const { API_URL } = await import('../config/api');
                const response = await fetch(`${API_URL}/api/airdrop/active`);
                if (response.ok) {
                    const data = await response.json();
                    setAirdrops(data.airdrops || []);
                } else {
                    // Fallback to default airdrops if API fails
                    setAirdrops([
                        {
                            id: 'layerzero-2024',
                            projectName: 'LayerZero',
                            tokenSymbol: 'ZRO',
                            status: 'active',
                            estimatedValue: '$500 - $5,000',
                            description: 'Cross-chain interoperability protocol airdrop',
                            verified: true,
                            categories: ['bridge', 'infrastructure'],
                            requirements: ['Used LayerZero bridges', 'Cross-chain transactions'],
                        },
                        {
                            id: 'eigenlayer-s2',
                            projectName: 'EigenLayer Season 2',
                            tokenSymbol: 'EIGEN',
                            status: 'upcoming',
                            estimatedValue: '$1,000 - $10,000',
                            description: 'Restaking protocol season 2 rewards',
                            verified: true,
                            categories: ['restaking', 'defi'],
                            requirements: ['Restaked ETH', 'Active participation'],
                        },
                    ]);
                }
            } catch (error) {
                console.error('Failed to fetch airdrops:', error);
                // Use fallback data on error
                setAirdrops([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAirdrops();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return `text-${theme.regenPrimary} bg-${theme.regenPrimary}/10 border-${theme.regenPrimary}/20`;
            case 'upcoming': return `text-${theme.degenPrimary} bg-${theme.degenPrimary}/10 border-${theme.degenPrimary}/20`;
            case 'ended': return `text-${theme.textMuted} bg-${theme.textMuted}/10 border-${theme.textMuted}/20`;
            default: return `text-${theme.textMuted} bg-${theme.textMuted}/10 border-${theme.textMuted}/20`;
        }
    };

    const filteredAirdrops = statusFilter === 'all'
        ? airdrops
        : airdrops.filter((a: Airdrop) => a.status === statusFilter);

    return (
        <div className="min-h-screen bg-base text-primary p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="p-2 hover:bg-hover rounded-radius-lg" title="Go back" aria-label="Go back">
                            <X className="w-5 h-5 text-primary" />
                        </button>
                    )}
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)` }}
                        >
                            <Gift className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-primary">Airdrop Hunter</h1>
                            <p className="text-tertiary text-sm">Find and claim free tokens</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-hover rounded-radius-xl p-4 border border-neutral">
                    <div className="text-tertiary text-sm mb-1">Total Claimed</div>
                    <div className="text-2xl font-bold text-primary" style={{ color: primaryColor }}>0</div>
                </div>
                <div className="bg-hover rounded-radius-xl p-4 border border-neutral">
                    <div className="text-tertiary text-sm mb-1">Total Value</div>
                    <div className="text-2xl font-bold text-regenPrimary">$0</div>
                </div>
                <div className="bg-hover rounded-radius-xl p-4 border border-neutral">
                    <div className="text-tertiary text-sm mb-1">Eligible Now</div>
                    <div className="text-2xl font-bold text-degenPrimary">0</div>
                </div>
                <div className="bg-hover rounded-radius-xl p-4 border border-neutral">
                    <div className="text-tertiary text-sm mb-1">Upcoming</div>
                    <div className="text-2xl font-bold text-primary">2</div>
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
                            background: activeTab === tab.id ? primaryColor : 'var(--bg-hover)',
                            color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
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
                                        background: statusFilter === status ? 'var(--bg-active)' : 'var(--bg-hover)',
                                        color: statusFilter === status ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                    }}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        {/* Airdrop List */}
                        <div className="space-y-4">
                            {filteredAirdrops.length === 0 ? (
                                <div className="text-center py-12 bg-hover rounded-radius-xl">
                                    <Gift className="w-12 h-12 mx-auto mb-4 text-textMuted" />
                                    <p className="text-tertiary">No airdrops found</p>
                                </div>
                            ) : (
                                filteredAirdrops.map((airdrop: Airdrop) => (
                                    <motion.div
                                        key={airdrop.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="bg-hover rounded-radius-xl p-5 border border-neutral"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-12 h-12 rounded-radius-xl flex items-center justify-center text-primary font-bold"
                                                    style={{ background: `${primaryColor}40` }}
                                                >
                                                    {airdrop.tokenSymbol?.slice(0, 2) || '??'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-lg flex items-center gap-2 text-primary">
                                                        {airdrop.projectName}
                                                        {airdrop.verified && <Check className="w-4 h-4 text-regenPrimary" />}
                                                    </div>
                                                    <div className="text-sm text-tertiary">{airdrop.tokenSymbol}</div>
                                                </div>
                                            </div>
                                            <span className={`text-xs px-3 py-1 rounded-full border capitalize ${getStatusColor(airdrop.status)}`}>
                                                {airdrop.status}
                                            </span>
                                        </div>

                                        <p className="text-sm text-tertiary mb-3">{airdrop.description}</p>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {airdrop.categories.map((cat: string) => (
                                                <span key={cat} className="text-xs px-2 py-1 bg-hover rounded text-tertiary">
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm text-tertiary">Estimated Value</div>
                                                <div className="text-lg font-bold text-primary" style={{ color: primaryColor }}>
                                                    {airdrop.estimatedValue}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    className="px-4 py-2 rounded-radius-lg text-sm border border-neutral"
                                                    style={{ borderColor: `${primaryColor}40`, color: primaryColor }}
                                                    title="Check eligibility for airdrop"
                                                    aria-label="Check eligibility for airdrop"
                                                >
                                                    Check Eligibility
                                                </button>
                                                {airdrop.status === 'active' && (
                                                    <button
                                                        className="px-4 py-2 rounded-radius-lg text-sm text-primary"
                                                        style={{ background: primaryColor }}
                                                        title="Claim airdrop"
                                                        aria-label="Claim airdrop"
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
                        <div className="text-center py-12 bg-hover rounded-radius-xl">
                            <Check className="w-12 h-12 mx-auto mb-4 text-textMuted" />
                            <p className="text-tertiary">No eligible airdrops found</p>
                            <p className="text-sm text-textMuted mt-1">Check eligibility for active airdrops</p>
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
                            className="rounded-radius-xl p-4 mb-6"
                            style={{ background: `${primaryColor}20`, border: `1px solid ${primaryColor}40` }}
                        >
                            <div className="flex items-center gap-2 font-medium mb-1" style={{ color: primaryColor }}>
                                <Zap className="w-5 h-5 text-primary" />
                                Farming Opportunities
                            </div>
                            <p className="text-sm text-tertiary">
                                Complete these tasks to potentially qualify for future airdrops
                            </p>
                        </div>

                        <div className="text-center py-12 bg-hover rounded-radius-xl">
                            <Sparkles className="w-12 h-12 mx-auto mb-4 text-textMuted" />
                            <p className="text-tertiary">No farming opportunities</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default AirdropPage;
