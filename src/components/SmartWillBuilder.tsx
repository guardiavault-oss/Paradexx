import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getThemeStyles, cn } from "../design-system";
import {
    X, FileText, CheckCircle, ArrowRight, ArrowLeft, Sparkles, Users, Clock,
    Shield, Gift, Building2, Heart, GraduationCap, Wallet, AlertTriangle,
    Plus, Trash2, Save, Calendar, Percent, Target, Brain, Loader2, Lightbulb,
} from "lucide-react";
import { useScarletteWillAI } from "../hooks/useScarletteWillAI";

interface WillTemplate {
    id: string;
    name: string;
    description: string;
    icon: any;
    color: string;
    popular: boolean;
    features: string[];
    bestFor: string;
    timeToComplete: string;
    sections: { id: string; title: string; type: string; required: boolean }[];
}

interface Beneficiary {
    id: string;
    name: string;
    relationship: string;
    wallet: string;
    allocation: number;
    conditions: { type: string; value: string }[];
}

interface SmartWillBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    initialTemplate?: string;
    onSave: (willData: any) => void;
    type: "degen" | "regen";
}

const WILL_TEMPLATES: WillTemplate[] = [
    {
        id: "standard", name: "Standard Asset Distribution",
        description: "Equal or custom percentage distribution among beneficiaries",
        icon: Users, color: "#0080FF", popular: true,
        features: ["Simple percentage allocation", "Multiple beneficiaries", "Immediate distribution", "Easy to modify"],
        bestFor: "Families looking for straightforward distribution", timeToComplete: "5-10 minutes",
        sections: [
            { id: "beneficiaries", title: "Beneficiaries", type: "beneficiaries", required: true },
            { id: "messages", title: "Legacy Messages", type: "messages", required: false },
        ],
    },
    {
        id: "trust-fund", name: "Trust Fund Setup",
        description: "Gradual release based on age milestones or achievements",
        icon: GraduationCap, color: "#8B5CF6", popular: true,
        features: ["Age-based milestones", "Educational triggers", "Vesting schedules", "Guardian oversight"],
        bestFor: "Parents planning for children's future", timeToComplete: "15-20 minutes",
        sections: [
            { id: "beneficiaries", title: "Beneficiaries", type: "beneficiaries", required: true },
            { id: "conditions", title: "Release Conditions", type: "conditions", required: true },
            { id: "guardians", title: "Trustees", type: "guardians", required: true },
        ],
    },
    {
        id: "charitable", name: "Charitable Giving",
        description: "Allocate assets to charitable organizations and causes",
        icon: Heart, color: "#EC4899", popular: false,
        features: ["Charity allocation", "Multiple organizations", "Tax-efficient", "Legacy impact"],
        bestFor: "Philanthropists wanting charitable impact", timeToComplete: "10-15 minutes",
        sections: [
            { id: "charity", title: "Charities", type: "charity", required: true },
            { id: "beneficiaries", title: "Family", type: "beneficiaries", required: false },
        ],
    },
    {
        id: "business", name: "Business Succession",
        description: "Transfer business ownership and DAO positions",
        icon: Building2, color: "#F59E0B", popular: false,
        features: ["Ownership transfer", "Multi-sig succession", "DAO voting rights", "Continuity planning"],
        bestFor: "Entrepreneurs planning succession", timeToComplete: "20-30 minutes",
        sections: [
            { id: "beneficiaries", title: "Successors", type: "beneficiaries", required: true },
            { id: "conditions", title: "Transfer Conditions", type: "conditions", required: true },
        ],
    },
    {
        id: "multi-chain", name: "Multi-Chain Portfolio",
        description: "Distribution across multiple blockchains and DeFi",
        icon: Wallet, color: "#10B981", popular: false,
        features: ["Cross-chain management", "DeFi unwinding", "NFT distribution", "Staking handling"],
        bestFor: "DeFi users with complex portfolios", timeToComplete: "25-35 minutes",
        sections: [
            { id: "beneficiaries", title: "Beneficiaries", type: "beneficiaries", required: true },
            { id: "messages", title: "Technical Instructions", type: "messages", required: true },
        ],
    },
    {
        id: "conditional", name: "Conditional Inheritance",
        description: "Complex conditions with multi-sig and oracle triggers",
        icon: Shield, color: "#6366F1", popular: false,
        features: ["Multi-signature", "Oracle verification", "Time-locks", "Dispute resolution"],
        bestFor: "High-net-worth requiring maximum security", timeToComplete: "30-45 minutes",
        sections: [
            { id: "beneficiaries", title: "Beneficiaries", type: "beneficiaries", required: true },
            { id: "guardians", title: "Approvers", type: "guardians", required: true },
            { id: "conditions", title: "Trigger Conditions", type: "conditions", required: true },
        ],
    },
];

const RELATIONSHIPS = ["Spouse", "Child", "Parent", "Sibling", "Grandchild", "Friend", "Business Partner", "Charity", "Other"];

export function SmartWillBuilder({ isOpen, onClose, initialTemplate, onSave, type }: SmartWillBuilderProps) {
    const [step, setStep] = useState<"templates" | "builder" | "review">("templates");
    const [selectedTemplate, setSelectedTemplate] = useState<WillTemplate | null>(null);
    const [currentSection, setCurrentSection] = useState(0);
    const [willName, setWillName] = useState("My Digital Will");
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
    const [guardians, setGuardians] = useState<{ id: string; name: string; wallet: string; role: string }[]>([]);
    const [charities, setCharities] = useState<{ id: string; name: string; wallet: string; allocation: number }[]>([]);
    const [newBen, setNewBen] = useState({ name: "", relationship: "Child", wallet: "", allocation: 0 });
    const [showAISuggestions, setShowAISuggestions] = useState(false);
    const [hasMinors, setHasMinors] = useState(false);

    const { suggestions, loading: aiLoading, getSuggestions, checkAvailability, isAvailable } = useScarletteWillAI();

    // Use design system theme styles
    const theme = getThemeStyles(type);
    const primaryColor = theme.primaryColor;
    const secondaryColor = theme.secondaryColor;

    useEffect(() => {
        if (isOpen) {
            checkAvailability();
        }
    }, [isOpen, checkAvailability]);

    useEffect(() => {
        if (initialTemplate) {
            const t = WILL_TEMPLATES.find(t => t.id === initialTemplate);
            if (t) { setSelectedTemplate(t); setStep("builder"); }
        }
    }, [initialTemplate]);

    const totalAllocation = beneficiaries.reduce((s, b) => s + b.allocation, 0) + charities.reduce((s, c) => s + c.allocation, 0);

    const addBeneficiary = () => {
        if (newBen.name && newBen.wallet) {
            setBeneficiaries([...beneficiaries, { ...newBen, id: `b-${Date.now()}`, conditions: [] }]);
            setNewBen({ name: "", relationship: "Child", wallet: "", allocation: 0 });
        }
    };

    const handleSave = () => {
        onSave({ name: willName, template: selectedTemplate?.id, beneficiaries, guardians, charities, createdAt: new Date().toISOString() });
        onClose();
    };

    const handleGetAISuggestions = async () => {
        setShowAISuggestions(true);
        await getSuggestions({
            numBeneficiaries: beneficiaries.length || 1,
            hasMinors,
            hasCharity: charities.length > 0 || selectedTemplate?.id === 'charitable',
            hasBusiness: selectedTemplate?.id === 'business',
            multiChain: selectedTemplate?.id === 'multi-chain',
            templateId: selectedTemplate?.id,
        });
    };

    const applyAllocationSuggestion = () => {
        if (suggestions?.allocations?.suggested_allocation && beneficiaries.length > 0) {
            const newBeneficiaries = beneficiaries.map((b: Beneficiary, i: number) => ({
                ...b,
                allocation: suggestions.allocations.suggested_allocation?.[i] ?? Math.floor(100 / beneficiaries.length)
            }));
            setBeneficiaries(newBeneficiaries);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[var(--bg-base)]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    className="w-full max-w-4xl bg-[var(--bg-surface)] rounded-[var(--radius-2xl)] border border-[var(--border-neutral)] overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-[var(--border-neutral)] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                                <FileText className="w-5 h-5" style={{ color: primaryColor }} />
                            </div>
                            <div>
                                <h2 className="text-[var(--text-lg)] font-[var(--font-weight-semibold)] text-[var(--text-primary)]">Smart Will Builder</h2>
                                <p className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
                                    {step === "templates" ? "Choose a template" : step === "builder" ? selectedTemplate?.name : "Review & Save"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {step === "builder" && (
                                <button
                                    onClick={handleGetAISuggestions}
                                    disabled={aiLoading}
                                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-[var(--border-neutral)] rounded-[var(--radius-lg)] text-[var(--text-secondary)] text-[var(--text-sm)] transition-all duration-[var(--duration-normal)]"
                                >
                                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                                    <span className="hidden sm:inline">AI Assist</span>
                                </button>
                            )}
                            <button onClick={onClose} aria-label="Close" className="p-2 rounded-[var(--radius-lg)] hover:bg-[var(--bg-hover)] transition-all duration-[var(--duration-normal)]">
                                <X className="w-5 h-5 text-[var(--text-tertiary)]" />
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {step === "builder" && selectedTemplate && (
                        <div className="px-6 py-3 bg-[var(--bg-hover)] border-b border-[var(--border-neutral)] flex gap-2">
                            {selectedTemplate.sections.map((s: { id: string; title: string; type: string; required: boolean }, i: number) => (
                                <div key={s.id} className="flex-1 h-2 rounded-full transition-all duration-[var(--duration-normal)]" style={{ backgroundColor: i <= currentSection ? primaryColor : "var(--border-neutral)" }} />
                            ))}
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex">
                        <div className={`p-6 ${showAISuggestions && suggestions ? 'w-2/3' : 'w-full'} max-h-[60vh] overflow-y-auto`}>
                            {step === "templates" && (
                                <div className="space-y-4">
                                    {isAvailable && (
                                        <div className="p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-[var(--radius-xl)] border border-[var(--border-strong)] flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-purple-500/20 flex items-center justify-center shrink-0">
                                                <Brain className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)]">Scarlette AI Available</h4>
                                                <p className="text-[var(--text-xs)] text-[var(--text-muted)] mt-1">Get personalized template recommendations and allocation suggestions powered by AI</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {WILL_TEMPLATES.map((t, i) => {
                                            const Icon = t.icon;
                                            const isRecommended = suggestions?.templates?.some(rec => rec.template_id === t.id);
                                            return (
                                                <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                                    onClick={() => { setSelectedTemplate(t); setStep("builder"); setCurrentSection(0); }}
                                                    className={`p-5 bg-[var(--bg-hover)] rounded-[var(--radius-xl)] border cursor-pointer group relative transition-all duration-[var(--duration-normal)] ${isRecommended ? 'border-[var(--border-strong)]' : 'border-[var(--border-neutral)] hover:border-[var(--border-strong)]'}`}>
                                                    {isRecommended && (
                                                        <div className="absolute -top-2 -right-2 px-2 py-1 bg-purple-500 rounded-full text-[10px] font-[var(--font-weight-medium)] text-[var(--text-primary)] flex items-center gap-1">
                                                            <Sparkles className="w-3 h-3" />AI Pick
                                                        </div>
                                                    )}
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-[var(--radius-xl)] flex items-center justify-center" style={{ backgroundColor: `${t.color}20` }}>
                                                            <Icon className="w-6 h-6" style={{ color: t.color }} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="font-[var(--font-weight-semibold)] text-[var(--text-primary)]">{t.name}</h3>
                                                                {t.popular && <span className="px-2 py-0.5 bg-[var(--bg-hover)] text-[var(--text-xs)] rounded-full flex items-center gap-1" style={{ color: primaryColor }}><Sparkles className="w-3 h-3" />Popular</span>}
                                                            </div>
                                                            <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] mb-2">{t.description}</p>
                                                            <div className="flex gap-2 text-[var(--text-xs)] text-[var(--text-muted)]">
                                                                <span>{t.sections.length} sections</span>
                                                                <span>•</span>
                                                                <span>~{t.timeToComplete}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {step === "builder" && selectedTemplate && currentSection === 0 && selectedTemplate.sections[0]?.type === "beneficiaries" && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <label className="flex items-center gap-2 text-[var(--text-sm)] text-[var(--text-tertiary)]">
                                            <input
                                                type="checkbox"
                                                checked={hasMinors}
                                                onChange={(e) => setHasMinors(e.target.checked)}
                                                className="w-4 h-4"
                                                style={{ accentColor: primaryColor }}
                                            />
                                            Include minor beneficiaries (under 18)
                                        </label>
                                    </div>

                                    {beneficiaries.map((b, i) => (
                                        <div key={b.id} className="p-4 bg-[var(--bg-hover)] rounded-[var(--radius-xl)] border border-[var(--border-neutral)] flex items-center justify-between">
                                            <div>
                                                <div className="font-[var(--font-weight-medium)] text-[var(--text-primary)]">{b.name}</div>
                                                <div className="text-[var(--text-sm)] text-[var(--text-tertiary)]">{b.relationship} • {b.wallet.slice(0, 10)}...</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="number"
                                                    value={b.allocation}
                                                    onChange={(e) => {
                                                        const newBens = [...beneficiaries];
                                                        newBens[i].allocation = Number(e.target.value);
                                                        setBeneficiaries(newBens);
                                                    }}
                                                    className="w-16 px-2 py-1 bg-[var(--bg-hover)] border border-[var(--border-neutral)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-[var(--text-sm)] text-center"
                                                />
                                                <span className="font-medium" style={{ color: primaryColor }}>%</span>
                                                <button onClick={() => setBeneficiaries(beneficiaries.filter((_, j) => j !== i))} aria-label="Remove beneficiary" className="p-2 hover:bg-[var(--bg-hover)] rounded-[var(--radius-lg)] transition-all duration-[var(--duration-normal)]">
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="p-4 bg-[var(--bg-hover)] rounded-[var(--radius-xl)] border border-dashed border-[var(--border-neutral)]">
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <input placeholder="Name" value={newBen.name} onChange={e => setNewBen({ ...newBen, name: e.target.value })} className="px-3 py-2 bg-[var(--bg-hover)] border border-[var(--border-neutral)] rounded-[var(--radius-lg)] text-[var(--text-primary)] text-[var(--text-sm)] placeholder-[var(--text-muted)]" />
                                            <select value={newBen.relationship} onChange={e => setNewBen({ ...newBen, relationship: e.target.value })} aria-label="Relationship" className="px-3 py-2 bg-[var(--bg-hover)] border border-[var(--border-neutral)] rounded-[var(--radius-lg)] text-[var(--text-primary)] text-[var(--text-sm)]">
                                                {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                            <input placeholder="Wallet Address" value={newBen.wallet} onChange={e => setNewBen({ ...newBen, wallet: e.target.value })} className="px-3 py-2 bg-[var(--bg-hover)] border border-[var(--border-neutral)] rounded-[var(--radius-lg)] text-[var(--text-primary)] text-[var(--text-sm)] placeholder-[var(--text-muted)]" />
                                            <input type="number" placeholder="%" value={newBen.allocation || ""} onChange={e => setNewBen({ ...newBen, allocation: Number(e.target.value) })} className="px-3 py-2 bg-[var(--bg-hover)] border border-[var(--border-neutral)] rounded-[var(--radius-lg)] text-[var(--text-primary)] text-[var(--text-sm)] placeholder-[var(--text-muted)]" />
                                        </div>
                                        <button onClick={addBeneficiary} className="w-full py-2 rounded-[var(--radius-lg)] flex items-center justify-center gap-2 hover:bg-[var(--bg-hover)] transition-all duration-[var(--duration-normal)]" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                                            <Plus className="w-4 h-4" />Add Beneficiary
                                        </button>
                                    </div>

                                    <div className={`text-[var(--text-sm)] ${totalAllocation === 100 ? "text-[var(--regen-primary)]" : "text-[var(--degen-secondary)]"}`}>
                                        Total: {totalAllocation}% {totalAllocation !== 100 && "(should be 100%)"}
                                    </div>
                                </div>
                            )}

                            {step === "review" && (
                                <div className="space-y-4">
                                    <input value={willName} onChange={e => setWillName(e.target.value)} placeholder="Will name" aria-label="Will name" className="w-full px-4 py-3 bg-[var(--bg-hover)] border border-[var(--border-neutral)] rounded-[var(--radius-xl)] text-[var(--text-primary)] text-[var(--text-lg)] font-[var(--font-weight-medium)] placeholder-[var(--text-muted)]" />
                                    <div className="p-4 bg-[var(--bg-hover)] rounded-[var(--radius-xl)] border border-[var(--border-neutral)] space-y-3">
                                        <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Template</span><span className="text-[var(--text-primary)]">{selectedTemplate?.name}</span></div>
                                        <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Beneficiaries</span><span className="text-[var(--text-primary)]">{beneficiaries.length}</span></div>
                                        {guardians.length > 0 && <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Guardians</span><span className="text-[var(--text-primary)]">{guardians.length}</span></div>}
                                        {charities.length > 0 && <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Charities</span><span className="text-[var(--text-primary)]">{charities.length}</span></div>}
                                        <div className="flex justify-between border-t border-[var(--border-neutral)] pt-3"><span className="text-[var(--text-tertiary)]">Total Allocation</span><span className={totalAllocation === 100 ? "text-[var(--regen-primary)]" : "text-[var(--degen-primary)]"}>{totalAllocation}%</span></div>
                                    </div>
                                    {totalAllocation !== 100 && (
                                        <div className="p-3 bg-[var(--degen-primary)]/10 border border-[var(--degen-primary)]/30 rounded-[var(--radius-xl)] flex items-center gap-2 text-[var(--text-sm)] text-[var(--degen-primary)]">
                                            <AlertTriangle className="w-4 h-4" />Allocation must equal 100%
                                        </div>
                                    )}
                                </div>
                            )}
                            {step === "review" && (
                                <button onClick={handleSave} disabled={totalAllocation !== 100} className="px-6 py-2 rounded-[var(--radius-lg)] font-[var(--font-weight-medium)] text-[var(--text-primary)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-[var(--duration-normal)]" style={{ backgroundColor: "var(--regen-primary)" }}>
                                    <Save className="w-4 h-4" />Save Will
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
