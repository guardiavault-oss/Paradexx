import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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

    const primaryColor = type === "degen" ? "#DC143C" : "#0080FF";
    const secondaryColor = type === "degen" ? "#8B0000" : "#000080";

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
            const newBeneficiaries = beneficiaries.map((b, i) => ({
                ...b,
                allocation: suggestions.allocations.suggested_allocation?.[i] ?? Math.floor(100 / beneficiaries.length)
            }));
            setBeneficiaries(newBeneficiaries);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
                <div className="min-h-screen p-4 md:p-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto bg-black rounded-2xl border shadow-2xl" style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}>
                        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}>
                            <div className="flex items-center gap-3">
                                {step !== "templates" && (
                                    <button onClick={() => step === "review" ? setStep("builder") : currentSection > 0 ? setCurrentSection(currentSection - 1) : (setStep("templates"), setSelectedTemplate(null))} aria-label="Go back" className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
                                        <ArrowLeft className="w-5 h-5 text-white/60" />
                                    </button>
                                )}
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5" style={{ color: primaryColor }} />Smart Will Builder</h2>
                                    <p className="text-sm text-white/60">{step === "templates" ? "Choose a template" : step === "review" ? "Review your will" : selectedTemplate?.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {step === "builder" && (
                                    <button
                                        onClick={handleGetAISuggestions}
                                        disabled={aiLoading}
                                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm transition-all"
                                    >
                                        {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                                        <span className="hidden sm:inline">AI Assist</span>
                                    </button>
                                )}
                                <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white/60" /></button>
                            </div>
                        </div>

                        {step === "builder" && selectedTemplate && (
                            <div className="px-6 py-3 bg-white/5 border-b flex gap-2" style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}>
                                {selectedTemplate.sections.map((s, i) => (
                                    <div key={s.id} className={`flex-1 h-2 rounded-full`} style={{ backgroundColor: i <= currentSection ? primaryColor : "rgba(255, 255, 255, 0.1)" }} />
                                ))}
                            </div>
                        )}

                        <div className="flex">
                            <div className={`p-6 ${showAISuggestions && suggestions ? 'w-2/3' : 'w-full'} max-h-[60vh] overflow-y-auto`}>
                                {step === "templates" && (
                                    <div className="space-y-4">
                                        {isAvailable && (
                                            <div className="p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/20 flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                                                    <Brain className="w-5 h-5 text-purple-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-purple-300">Scarlette AI Available</h4>
                                                    <p className="text-xs text-purple-400/70 mt-1">Get personalized template recommendations and allocation suggestions powered by AI</p>
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
                                                        className={`p-5 bg-white/5 rounded-xl border cursor-pointer group relative ${isRecommended ? 'border-purple-500/50' : 'border-white/10 hover:border-white/30'}`}>
                                                        {isRecommended && (
                                                            <div className="absolute -top-2 -right-2 px-2 py-1 bg-purple-500 rounded-full text-[10px] font-medium text-white flex items-center gap-1">
                                                                <Sparkles className="w-3 h-3" />AI Pick
                                                            </div>
                                                        )}
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${t.color}20` }}>
                                                                <Icon className="w-6 h-6" style={{ color: t.color }} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h3 className="font-semibold text-white">{t.name}</h3>
                                                                    {t.popular && <span className="px-2 py-0.5 bg-white/10 text-xs rounded-full flex items-center gap-1" style={{ color: primaryColor }}><Sparkles className="w-3 h-3" />Popular</span>}
                                                                </div>
                                                                <p className="text-sm text-white/60 mb-2">{t.description}</p>
                                                                <div className="flex gap-2 text-xs text-white/40">
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
                                            <label className="flex items-center gap-2 text-sm text-white/60">
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
                                            <div key={b.id} className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-white">{b.name}</div>
                                                    <div className="text-sm text-white/60">{b.relationship} • {b.wallet.slice(0, 10)}...</div>
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
                                                        className="w-16 px-2 py-1 bg-white/10 border border-white/10 rounded text-white text-sm text-center"
                                                    />
                                                    <span className="font-medium" style={{ color: primaryColor }}>%</span>
                                                    <button onClick={() => setBeneficiaries(beneficiaries.filter((_, j) => j !== i))} aria-label="Remove beneficiary" className="p-2 hover:bg-white/10 rounded-lg">
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="p-4 bg-white/5 rounded-xl border border-dashed border-white/10">
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <input placeholder="Name" value={newBen.name} onChange={e => setNewBen({ ...newBen, name: e.target.value })} className="px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white text-sm placeholder-white/40" />
                                                <select value={newBen.relationship} onChange={e => setNewBen({ ...newBen, relationship: e.target.value })} aria-label="Relationship" className="px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white text-sm">
                                                    {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                                <input placeholder="Wallet Address" value={newBen.wallet} onChange={e => setNewBen({ ...newBen, wallet: e.target.value })} className="px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white text-sm placeholder-white/40" />
                                                <input type="number" placeholder="%" value={newBen.allocation || ""} onChange={e => setNewBen({ ...newBen, allocation: Number(e.target.value) })} className="px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white text-sm placeholder-white/40" />
                                            </div>
                                            <button onClick={addBeneficiary} className="w-full py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-white/10 transition-colors" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                                                <Plus className="w-4 h-4" />Add Beneficiary
                                            </button>
                                        </div>

                                        <div className={`text-sm ${totalAllocation === 100 ? "text-green-500" : "text-yellow-500"}`}>
                                            Total: {totalAllocation}% {totalAllocation !== 100 && "(should be 100%)"}
                                        </div>
                                    </div>
                                )}

                                {step === "review" && (
                                    <div className="space-y-4">
                                        <input value={willName} onChange={e => setWillName(e.target.value)} placeholder="Will name" aria-label="Will name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-medium placeholder-white/40" />
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                                            <div className="flex justify-between"><span className="text-white/60">Template</span><span className="text-white">{selectedTemplate?.name}</span></div>
                                            <div className="flex justify-between"><span className="text-white/60">Beneficiaries</span><span className="text-white">{beneficiaries.length}</span></div>
                                            {guardians.length > 0 && <div className="flex justify-between"><span className="text-white/60">Guardians</span><span className="text-white">{guardians.length}</span></div>}
                                            {charities.length > 0 && <div className="flex justify-between"><span className="text-white/60">Charities</span><span className="text-white">{charities.length}</span></div>}
                                            <div className="flex justify-between border-t border-white/10 pt-3"><span className="text-white/60">Total Allocation</span><span className={totalAllocation === 100 ? "text-green-500" : "text-red-500"}>{totalAllocation}%</span></div>
                                        </div>
                                        {totalAllocation !== 100 && (
                                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-sm text-red-500">
                                                <AlertTriangle className="w-4 h-4" />Allocation must equal 100%
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {showAISuggestions && suggestions && (
                                <div className="w-1/3 p-4 border-l border-white/10 bg-gradient-to-b from-purple-900/10 to-transparent max-h-[60vh] overflow-y-auto">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-medium text-purple-300 flex items-center gap-2">
                                            <Brain className="w-4 h-4" />AI Suggestions
                                        </h4>
                                        <button onClick={() => setShowAISuggestions(false)} className="p-1 hover:bg-white/10 rounded">
                                            <X className="w-4 h-4 text-white/60" />
                                        </button>
                                    </div>

                                    {aiLoading ? (
                                        <div className="flex flex-col items-center justify-center py-8">
                                            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
                                            <p className="text-sm text-purple-300">Analyzing your will...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {suggestions.allocations && beneficiaries.length > 0 && (
                                                <div className="p-3 bg-white/5 rounded-lg border border-purple-500/20">
                                                    <h5 className="text-xs font-medium text-purple-300 mb-2 flex items-center gap-1">
                                                        <Lightbulb className="w-3 h-3" />Allocation Suggestion
                                                    </h5>
                                                    {suggestions.allocations.suggested_allocation && (
                                                        <>
                                                            <p className="text-xs text-white/60 mb-2">
                                                                Suggested: {suggestions.allocations.suggested_allocation.join('% / ')}%
                                                            </p>
                                                            <button
                                                                onClick={applyAllocationSuggestion}
                                                                className="w-full py-1.5 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded"
                                                            >
                                                                Apply Suggestion
                                                            </button>
                                                        </>
                                                    )}
                                                    <div className="mt-2 space-y-1">
                                                        {suggestions.allocations.tips.slice(0, 2).map((tip, i) => (
                                                            <p key={i} className="text-[10px] text-white/40">• {tip}</p>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {suggestions.securityTips && (
                                                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                                    <h5 className="text-xs font-medium text-white/60 mb-2 flex items-center gap-1">
                                                        <Shield className="w-3 h-3" />Security Tips
                                                    </h5>
                                                    <div className="space-y-1">
                                                        {suggestions.securityTips.slice(0, 3).map((tip, i) => (
                                                            <p key={i} className="text-[10px] text-white/40">• {tip}</p>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {suggestions.aiInsights && (
                                                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                                    <h5 className="text-xs font-medium text-white/60 mb-2">AI Analysis</h5>
                                                    <p className="text-[10px] text-white/40 leading-relaxed line-clamp-6">
                                                        {suggestions.aiInsights}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t flex justify-between" style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}>
                            <div className="text-sm text-white/60">{step === "builder" && selectedTemplate && `${currentSection + 1}/${selectedTemplate.sections.length}`}</div>
                            <div className="flex gap-3">
                                {step === "builder" && (
                                    <button onClick={() => currentSection < (selectedTemplate?.sections.length || 1) - 1 ? setCurrentSection(currentSection + 1) : setStep("review")} className="px-6 py-2 rounded-lg font-medium text-white flex items-center gap-2 hover:opacity-90 transition-all" style={{ backgroundColor: primaryColor }}>
                                        {currentSection < (selectedTemplate?.sections.length || 1) - 1 ? "Next" : "Review"}<ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                                {step === "review" && (
                                    <button onClick={handleSave} disabled={totalAllocation !== 100} className="px-6 py-2 rounded-lg font-medium text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all" style={{ backgroundColor: "#10B981" }}>
                                        <Save className="w-4 h-4" />Save Will
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
