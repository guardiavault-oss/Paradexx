/**
 * Smart Will Builder Wizard
 * Multi-step wizard for creating on-chain wills
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Users,
  Shield,
  Coins,
  Clock,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Mail,
  Wallet as WalletIcon,
  Upload,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { EnhancedAppSidebar } from "@/components/EnhancedAppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import WizardProgress from "@/components/WizardProgress";
import { API_BASE_URL } from "@shared/config/api";

interface WizardState {
  step: number;
  userProfile?: {
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
  };
  beneficiaries?: Array<{
    address: string;
    name?: string;
    email?: string;
    phone?: string;
    percent: number;
    tokenAddress?: string;
    isNftOnly?: boolean;
    isCharityDao?: boolean;
  }>;
  guardians?: Array<{
    type: "email" | "wallet";
    identifier: string;
    walletAddress?: string;
  }>;
  guardianThreshold?: number;
  assets?: Array<{
    tokenAddress: string;
    tokenSymbol?: string;
    tokenName?: string;
    spenderAddress: string;
    allowanceAmount?: string;
    network?: string;
  }>;
  triggers?: {
    type: "time_lock" | "death_oracle" | "multisig_recovery" | "manual";
    checkInIntervalDays?: number;
    gracePeriodDays?: number;
    deathOracleAddress?: string;
    requiredConfidenceScore?: number;
    recoveryContractAddress?: string;
    recoveryKeys?: string[];
    threshold?: number;
    executorAddress?: string;
  };
}

const STEPS = [
  { id: 1, title: "User Profile", icon: User },
  { id: 2, title: "Beneficiaries", icon: Users },
  { id: 3, title: "Guardians", icon: Shield },
  { id: 4, title: "Assets", icon: Coins },
  { id: 5, title: "Triggers", icon: Clock },
  { id: 6, title: "Finalize", icon: FileCheck },
];

export default function WillWizard() {
  const [, setLocation] = useLocation();
  const { user, walletAddress, isAuthenticated } = useWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardState, setWizardState] = useState<WizardState>({ step: 1 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load saved state on mount
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    loadWizardState();
  }, [isAuthenticated, setLocation]);

  const loadWizardState = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/wills/wizard/state`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          setWizardState(data.state);
          setCurrentStep(data.state.step || 1);
        }
      }
    } catch (err) {
      const { logError } = await import("@/utils/logger");
      logError(err instanceof Error ? err : new Error(String(err)), {
        context: "loadWizardState",
      });
    }
  };

  const saveState = async (state: WizardState) => {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/wills/wizard/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ state }),
      });
      if (!res.ok) {
        throw new Error("Failed to save wizard state");
      }
      setWizardState(state);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateState = (updates: Partial<WizardState>) => {
    const newState = { ...wizardState, ...updates, step: currentStep };
    setWizardState(newState);
    saveState(newState);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      updateState({ step: newStep });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      updateState({ step: newStep });
    }
  };

  const validateStep = (step: number): string | null => {
    switch (step) {
      case 1:
        if (!wizardState.userProfile?.fullName || !wizardState.userProfile?.email) {
          return "Full name and email are required";
        }
        break;
      case 2: {
        if (!wizardState.beneficiaries || wizardState.beneficiaries.length === 0) {
          return "At least one beneficiary is required";
        }
        const totalPercent = wizardState.beneficiaries.reduce((sum, b) => sum + b.percent, 0);
        if (totalPercent !== 100) {
          return `Beneficiary percentages must total 100% (currently ${totalPercent}%)`;
        }
        for (const b of wizardState.beneficiaries) {
          if (!b.address || !b.address.match(/^0x[a-fA-F0-9]{40}$/)) {
            return `Invalid beneficiary address: ${b.address || "empty"}`;
          }
        }
        break;
      }
      case 5:
        if (!wizardState.triggers) {
          return "Trigger conditions are required";
        }
        break;
    }
    return null;
  };

  const handleFinalize = async () => {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/wills/wizard/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ state: wizardState }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to finalize will");
      }

      const data = await res.json();
      setSuccess(`Will created successfully! Will ID: ${data.willId}`);
      setTimeout(() => {
        setLocation("/dashboard");
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Convert STEPS to WizardProgress format
  const wizardSteps = STEPS.map((step) => ({
    id: step.id,
    title: step.title,
    description: step.id === 1 ? "Enter your contact information" :
                 step.id === 2 ? "Add beneficiaries and their allocations" :
                 step.id === 3 ? "Set up guardians for will execution" :
                 step.id === 4 ? "Configure asset allowances to track" :
                 step.id === 5 ? "Configure trigger conditions for execution" :
                 "Review and finalize your will",
  }));

  return (
    <SidebarProvider>
      <EnhancedAppSidebar />
      <SidebarInset>
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
        </div>
        <DashboardHeader />
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-6xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Smart Will Builder</h1>
            <p className="text-muted-foreground">
              Create your on-chain will in 6 simple steps
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="mb-8">
            <WizardProgress steps={wizardSteps} currentStep={currentStep - 1} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
              <CardDescription>
                {currentStep === 1 && "Enter your contact information"}
                {currentStep === 2 && "Add beneficiaries and their allocations"}
                {currentStep === 3 && "Set up guardians for will execution"}
                {currentStep === 4 && "Configure asset allowances to track"}
                {currentStep === 5 && "Configure trigger conditions for execution"}
                {currentStep === 6 && "Review and finalize your will"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <Step1UserProfile
                    key="step1"
                    state={wizardState}
                    walletAddress={walletAddress || ""}
                    user={user}
                    onUpdate={(updates) => updateState(updates)}
                  />
                )}
                {currentStep === 2 && (
                  <Step2Beneficiaries
                    key="step2"
                    state={wizardState}
                    onUpdate={(updates) => updateState(updates)}
                  />
                )}
                {currentStep === 3 && (
                  <Step3Guardians
                    key="step3"
                    state={wizardState}
                    onUpdate={(updates) => updateState(updates)}
                  />
                )}
                {currentStep === 4 && (
                  <Step4Assets
                    key="step4"
                    state={wizardState}
                    onUpdate={(updates) => updateState(updates)}
                  />
                )}
                {currentStep === 5 && (
                  <Step5Triggers
                    key="step5"
                    state={wizardState}
                    onUpdate={(updates) => updateState(updates)}
                  />
                )}
                {currentStep === 6 && (
                  <Step6Finalize
                    key="step6"
                    state={wizardState}
                    onFinalize={handleFinalize}
                    saving={saving}
                  />
                )}
              </AnimatePresence>

              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                {currentStep < STEPS.length ? (
                  <Button
                    onClick={() => {
                      const err = validateStep(currentStep);
                      if (err) {
                        setError(err);
                      } else {
                        nextStep();
                      }
                    }}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleFinalize} disabled={saving}>
                    {saving ? "Finalizing..." : "Finalize Will"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// Step 1: User Profile
function Step1UserProfile({
  state,
  walletAddress,
  user,
  onUpdate,
}: {
  state: WizardState;
  walletAddress: string;
  user: any;
  onUpdate: (updates: Partial<WizardState>) => void;
}) {
  const profile = state.userProfile || {
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name *</Label>
        <Input
          id="fullName"
          value={profile.fullName}
          onChange={(e) =>
            onUpdate({
              userProfile: { ...profile, fullName: e.target.value },
            })
          }
          placeholder="John Doe"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={profile.email}
          onChange={(e) =>
            onUpdate({
              userProfile: { ...profile, email: e.target.value },
            })
          }
          placeholder="john@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={profile.phone}
          onChange={(e) =>
            onUpdate({
              userProfile: { ...profile, phone: e.target.value },
            })
          }
          placeholder="+1 (555) 123-4567"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Physical Address</Label>
        <Input
          id="address"
          value={profile.address}
          onChange={(e) =>
            onUpdate({
              userProfile: { ...profile, address: e.target.value },
            })
          }
          placeholder="123 Main St, City, State, ZIP"
        />
      </div>
      <div className="space-y-2">
        <Label>Wallet Address</Label>
        <Input value={walletAddress} disabled className="font-mono text-sm" />
        <p className="text-xs text-muted-foreground">
          This wallet will be the executor address
        </p>
      </div>
    </motion.div>
  );
}

// Step 2: Beneficiaries
function Step2Beneficiaries({
  state,
  onUpdate,
}: {
  state: WizardState;
  onUpdate: (updates: Partial<WizardState>) => void;
}) {
  const beneficiaries = state.beneficiaries || [];

  const addBeneficiary = () => {
    onUpdate({
      beneficiaries: [
        ...beneficiaries,
        {
          address: "",
          name: "",
          email: "",
          phone: "",
          percent: 0,
        },
      ],
    });
  };

  const removeBeneficiary = (index: number) => {
    onUpdate({
      beneficiaries: beneficiaries.filter((_, i) => i !== index),
    });
  };

  const updateBeneficiary = (index: number, updates: Partial<typeof beneficiaries[0]>) => {
    const updated = [...beneficiaries];
    updated[index] = { ...updated[index], ...updates };
    onUpdate({ beneficiaries: updated });
  };

  const totalPercent = beneficiaries.reduce((sum, b) => sum + b.percent, 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="flex justify-between items-center">
        <Label>Beneficiaries</Label>
        <Button size="sm" onClick={addBeneficiary}>
          <Plus className="mr-2 h-4 w-4" />
          Add Beneficiary
        </Button>
      </div>

      {beneficiaries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p>No beneficiaries yet. Click "Add Beneficiary" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {beneficiaries.map((beneficiary, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <Badge variant="secondary">Beneficiary {index + 1}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeBeneficiary(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={beneficiary.name || ""}
                      onChange={(e) =>
                        updateBeneficiary(index, { name: e.target.value })
                      }
                      placeholder="Recipient name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Percentage %</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={beneficiary.percent}
                      onChange={(e) =>
                        updateBeneficiary(index, {
                          percent: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Wallet Address *</Label>
                  <Input
                    value={beneficiary.address}
                    onChange={(e) =>
                      updateBeneficiary(index, { address: e.target.value })
                    }
                    placeholder="0x..."
                    className="font-mono text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input
                      type="email"
                      value={beneficiary.email || ""}
                      onChange={(e) =>
                        updateBeneficiary(index, { email: e.target.value })
                      }
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <Input
                      type="tel"
                      value={beneficiary.phone || ""}
                      onChange={(e) =>
                        updateBeneficiary(index, { phone: e.target.value })
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={beneficiary.isNftOnly || false}
                      onChange={(e) =>
                        updateBeneficiary(index, { isNftOnly: e.target.checked })
                      }
                    />
                    NFTs Only
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={beneficiary.isCharityDao || false}
                      onChange={(e) =>
                        updateBeneficiary(index, { isCharityDao: e.target.checked })
                      }
                    />
                    Charity DAO
                  </label>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="pt-4 border-t">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Total Allocation:</span>
          <Badge variant={totalPercent === 100 ? "default" : "destructive"}>
            {totalPercent}%
          </Badge>
        </div>
        {totalPercent !== 100 && (
          <p className="text-xs text-destructive mt-2">
            Total must equal 100%
          </p>
        )}
      </div>
    </motion.div>
  );
}

// Step 3: Guardians
function Step3Guardians({
  state,
  onUpdate,
}: {
  state: WizardState;
  onUpdate: (updates: Partial<WizardState>) => void;
}) {
  const guardians = state.guardians || [];
  const threshold = state.guardianThreshold || 1;

  const addGuardian = () => {
    onUpdate({
      guardians: [
        ...guardians,
        {
          type: "email",
          identifier: "",
        },
      ],
    });
  };

  const removeGuardian = (index: number) => {
    onUpdate({
      guardians: guardians.filter((_, i) => i !== index),
    });
  };

  const updateGuardian = (index: number, updates: Partial<typeof guardians[0]>) => {
    const updated = [...guardians];
    updated[index] = { ...updated[index], ...updates };
    onUpdate({ guardians: updated });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="flex justify-between items-center">
        <Label>Guardians (Optional)</Label>
        <Button size="sm" onClick={addGuardian}>
          <Plus className="mr-2 h-4 w-4" />
          Add Guardian
        </Button>
      </div>

      {guardians.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Shield className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p>No guardians added. Will execution won't require guardian approval.</p>
          <p className="text-xs mt-2">Click "Add Guardian" to add one or more guardians.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {guardians.map((guardian, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <Badge variant="secondary">Guardian {index + 1}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeGuardian(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Guardian Type</Label>
                  <select
                    value={guardian.type}
                    onChange={(e) =>
                      updateGuardian(index, {
                        type: e.target.value as "email" | "wallet",
                        identifier: "",
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="email">Email</option>
                    <option value="wallet">Wallet Address</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">
                    {guardian.type === "email" ? "Email Address" : "Wallet Address"} *
                  </Label>
                  <Input
                    value={guardian.identifier}
                    onChange={(e) =>
                      updateGuardian(index, { identifier: e.target.value })
                    }
                    placeholder={
                      guardian.type === "email"
                        ? "guardian@example.com"
                        : "0x..."
                    }
                    className={guardian.type === "wallet" ? "font-mono text-xs" : ""}
                  />
                </div>
              </div>
            </Card>
          ))}

          {guardians.length > 0 && (
            <div className="space-y-2">
              <Label>
                Guardian Threshold (M-of-{guardians.length})
              </Label>
              <Input
                type="number"
                min="1"
                max={guardians.length}
                value={threshold}
                onChange={(e) =>
                  onUpdate({
                    guardianThreshold: parseInt(e.target.value) || 1,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Number of guardians required to approve will execution
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Step 4: Assets
function Step4Assets({
  state,
  onUpdate,
}: {
  state: WizardState;
  onUpdate: (updates: Partial<WizardState>) => void;
}) {
  const assets = state.assets || [];

  const addAsset = () => {
    onUpdate({
      assets: [
        ...assets,
        {
          tokenAddress: "",
          tokenSymbol: "",
          tokenName: "",
          spenderAddress: "",
          allowanceAmount: "",
          network: "ethereum",
        },
      ],
    });
  };

  const removeAsset = (index: number) => {
    onUpdate({
      assets: assets.filter((_, i) => i !== index),
    });
  };

  const updateAsset = (index: number, updates: Partial<typeof assets[0]>) => {
    const updated = [...assets];
    updated[index] = { ...updated[index], ...updates };
    onUpdate({ assets: updated });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="flex justify-between items-center">
        <Label>Asset Allowances (Optional)</Label>
        <Button size="sm" onClick={addAsset}>
          <Plus className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Track on-chain token allowances for your will execution. This is optional but recommended for comprehensive asset management.
      </p>

      {assets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Coins className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p>No assets configured. Click "Add Asset" to track token allowances.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assets.map((asset, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <Badge variant="secondary">Asset {index + 1}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeAsset(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Token Address *</Label>
                  <Input
                    value={asset.tokenAddress}
                    onChange={(e) =>
                      updateAsset(index, { tokenAddress: e.target.value })
                    }
                    placeholder="0x..."
                    className="font-mono text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Token Symbol</Label>
                    <Input
                      value={asset.tokenSymbol || ""}
                      onChange={(e) =>
                        updateAsset(index, { tokenSymbol: e.target.value })
                      }
                      placeholder="USDC"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Token Name</Label>
                    <Input
                      value={asset.tokenName || ""}
                      onChange={(e) =>
                        updateAsset(index, { tokenName: e.target.value })
                      }
                      placeholder="USD Coin"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Spender Address *</Label>
                  <Input
                    value={asset.spenderAddress}
                    onChange={(e) =>
                      updateAsset(index, { spenderAddress: e.target.value })
                    }
                    placeholder="0x..."
                    className="font-mono text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Allowance Amount</Label>
                    <Input
                      value={asset.allowanceAmount || ""}
                      onChange={(e) =>
                        updateAsset(index, { allowanceAmount: e.target.value })
                      }
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Network</Label>
                    <select
                      value={asset.network || "ethereum"}
                      onChange={(e) =>
                        updateAsset(index, { network: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="ethereum">Ethereum</option>
                      <option value="polygon">Polygon</option>
                      <option value="binance">Binance Smart Chain</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Step 5: Triggers
function Step5Triggers({
  state,
  onUpdate,
}: {
  state: WizardState;
  onUpdate: (updates: Partial<WizardState>) => void;
}) {
  const triggers = state.triggers || { type: "time_lock" };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div>
        <Label>Trigger Type *</Label>
        <select
          value={triggers.type}
          onChange={(e) =>
            onUpdate({
              triggers: {
                ...triggers,
                type: e.target.value as any,
              },
            })
          }
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="time_lock">Time-Lock (Deadman Switch)</option>
          <option value="death_oracle">Death Oracle</option>
          <option value="multisig_recovery">Multi-Sig Recovery</option>
          <option value="manual">Manual Execution</option>
        </select>
      </div>

      {triggers.type === "time_lock" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Check-in Interval (Days)</Label>
              <Input
                type="number"
                min="1"
                value={triggers.checkInIntervalDays || 90}
                onChange={(e) =>
                  onUpdate({
                    triggers: {
                      ...triggers,
                      checkInIntervalDays: parseInt(e.target.value) || 90,
                    },
                  })
                }
              />
            </div>
            <div>
              <Label>Grace Period (Days)</Label>
              <Input
                type="number"
                min="1"
                value={triggers.gracePeriodDays || 14}
                onChange={(e) =>
                  onUpdate({
                    triggers: {
                      ...triggers,
                      gracePeriodDays: parseInt(e.target.value) || 14,
                    },
                  })
                }
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            The will will trigger if you miss check-ins for the specified grace period.
          </p>
        </div>
      )}

      {triggers.type === "death_oracle" && (
        <div className="space-y-3">
          <div>
            <Label>Death Oracle Address</Label>
            <Input
              value={triggers.deathOracleAddress || ""}
              onChange={(e) =>
                onUpdate({
                  triggers: {
                    ...triggers,
                    deathOracleAddress: e.target.value,
                  },
                })
              }
              placeholder="0x..."
              className="font-mono text-xs"
            />
          </div>
          <div>
            <Label>Required Confidence Score (0.00 - 1.00)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={triggers.requiredConfidenceScore || 0.7}
              onChange={(e) =>
                onUpdate({
                  triggers: {
                    ...triggers,
                    requiredConfidenceScore: parseFloat(e.target.value) || 0.7,
                  },
                })
              }
            />
          </div>
        </div>
      )}

      {triggers.type === "multisig_recovery" && (
        <div className="space-y-3">
          <div>
            <Label>Recovery Contract Address</Label>
            <Input
              value={triggers.recoveryContractAddress || ""}
              onChange={(e) =>
                onUpdate({
                  triggers: {
                    ...triggers,
                    recoveryContractAddress: e.target.value,
                  },
                })
              }
              placeholder="0x..."
              className="font-mono text-xs"
            />
          </div>
          <div>
            <Label>Recovery Keys (one per line, wallet addresses)</Label>
            <textarea
              className="w-full px-3 py-2 border rounded-md font-mono text-xs"
              rows={3}
              value={(triggers.recoveryKeys || []).join("\n")}
              onChange={(e) =>
                onUpdate({
                  triggers: {
                    ...triggers,
                    recoveryKeys: e.target.value
                      .split("\n")
                      .map((k) => k.trim())
                      .filter((k) => k.length > 0),
                  },
                })
              }
              placeholder="0x1234...\n0x5678...\n0x9abc..."
            />
          </div>
          <div>
            <Label>Threshold (M-of-N)</Label>
            <Input
              type="number"
              min="1"
              max={(triggers.recoveryKeys || []).length || 1}
              value={triggers.threshold || 1}
              onChange={(e) =>
                onUpdate({
                  triggers: {
                    ...triggers,
                    threshold: parseInt(e.target.value) || 1,
                  },
                })
              }
            />
          </div>
        </div>
      )}

      {triggers.type === "manual" && (
        <div>
          <Label>Executor Address</Label>
          <Input
            value={triggers.executorAddress || ""}
            onChange={(e) =>
              onUpdate({
                triggers: {
                  ...triggers,
                  executorAddress: e.target.value,
                },
              })
            }
            placeholder="0x..."
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Address authorized to manually trigger will execution
          </p>
        </div>
      )}
    </motion.div>
  );
}

// Step 6: Finalize
function Step6Finalize({
  state,
  onFinalize,
  saving,
}: {
  state: WizardState;
  onFinalize: () => void;
  saving: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold mb-4">Review Your Will</h3>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">User Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {state.userProfile?.fullName || "N/A"}</p>
                <p><strong>Email:</strong> {state.userProfile?.email || "N/A"}</p>
                {state.userProfile?.phone && (
                  <p><strong>Phone:</strong> {state.userProfile.phone}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Beneficiaries ({state.beneficiaries?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {state.beneficiaries?.map((b, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{b.name || b.address}</span>
                    <Badge>{b.percent}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {state.guardians && state.guardians.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Guardians ({state.guardians.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Threshold:</strong> {state.guardianThreshold || 1}-of-
                    {state.guardians.length}
                  </p>
                  {state.guardians.map((g, i) => (
                    <p key={i}>
                      {i + 1}. {g.identifier} ({g.type})
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Trigger: {state.triggers?.type || "N/A"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {state.triggers?.type === "time_lock" && (
                  <>
                    <p>
                      <strong>Check-in Interval:</strong>{" "}
                      {state.triggers.checkInIntervalDays} days
                    </p>
                    <p>
                      <strong>Grace Period:</strong> {state.triggers.gracePeriodDays} days
                    </p>
                  </>
                )}
                {state.triggers?.type === "death_oracle" && (
                  <>
                    <p>
                      <strong>Oracle:</strong> {state.triggers.deathOracleAddress || "N/A"}
                    </p>
                    <p>
                      <strong>Confidence:</strong>{" "}
                      {state.triggers.requiredConfidenceScore || 0.7}
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          After finalizing, you'll be able to generate a legal PDF document and deploy your will on-chain.
          You can always update your will before it's triggered.
        </AlertDescription>
      </Alert>

      <div className="flex gap-4">
        <Button variant="outline" className="flex-1">
          Download PDF Preview
        </Button>
        <Button
          onClick={onFinalize}
          disabled={saving}
          className="flex-1"
        >
          {saving ? "Finalizing..." : "Finalize Will"}
        </Button>
      </div>
    </motion.div>
  );
}

