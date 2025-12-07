/**
 * Operator Dashboard
 * Stub for recovery case management and will execution
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useDebounce } from "@/hooks/useDebounce";
import { useAnnounce } from "@/utils/accessibility";
import {
  Shield,
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { EnhancedAppSidebar } from "@/components/EnhancedAppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { API_BASE_URL } from "@shared/config/api";
import { logError } from "@/utils/logger";
import { motion } from "framer-motion";
import "../design-system.css";

interface RecoveryCase {
  id: string;
  walletAddress: string;
  claimantEmail: string;
  status: "pending" | "under_review" | "approved" | "rejected" | "expired";
  createdAt: string;
  evidenceCount: number;
}

interface WillCase {
  id: string;
  ownerName: string;
  ownerAddress: string;
  status: "draft" | "active" | "triggered" | "executed";
  contractAddress?: string;
  triggeredAt?: string;
  createdAt: string;
}

export default function OperatorDashboard() {
  const [, setLocation] = useLocation();
  const [recoveryCases, setRecoveryCases] = useState<RecoveryCase[]>([]);
  const [willCases, setWillCases] = useState<WillCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const announce = useAnnounce();

  useEffect(() => {
    loadCases();
  }, [filter]);

  // Announce filtered results to screen readers
  useEffect(() => {
    if (debouncedSearch) {
      const recoveryCount = recoveryCases.filter((case_) =>
        case_.walletAddress.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        case_.claimantEmail.toLowerCase().includes(debouncedSearch.toLowerCase())
      ).length;
      const willCount = willCases.filter((case_) =>
        case_.ownerName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        case_.ownerAddress.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        case_.contractAddress?.toLowerCase().includes(debouncedSearch.toLowerCase())
      ).length;
      const total = recoveryCount + willCount;
      
      announce(
        total > 0
          ? `Found ${total} ${total === 1 ? 'case' : 'cases'} matching "${debouncedSearch}"`
          : `No cases found matching "${debouncedSearch}"`
      );
    }
  }, [debouncedSearch, recoveryCases, willCases, announce]);

  const loadCases = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual API endpoints
      // const res = await fetch(`${API_BASE_URL}/api/operator/cases?filter=${filter}`, {
      //   credentials: "include",
      // });
      // const data = await res.json();
      // setRecoveryCases(data.recoveryCases || []);
      // setWillCases(data.willCases || []);

      // Mock data for now
      setRecoveryCases([
        {
          id: "1",
          walletAddress: "0x1234...5678",
          claimantEmail: "claimant@example.com",
          status: "pending",
          createdAt: new Date().toISOString(),
          evidenceCount: 2,
        },
      ]);
      setWillCases([
        {
          id: "1",
          ownerName: "John Doe",
          ownerAddress: "0xabcd...efgh",
          status: "triggered",
          contractAddress: "0xsmart...contract",
          triggeredAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "loadOperatorCases",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary" as const, icon: Clock },
      under_review: { variant: "default" as const, icon: Eye },
      approved: { variant: "default" as const, icon: CheckCircle2 },
      rejected: { variant: "destructive" as const, icon: XCircle },
      expired: { variant: "outline" as const, icon: AlertCircle },
      draft: { variant: "secondary" as const, icon: FileCheck },
      active: { variant: "default" as const, icon: CheckCircle2 },
      triggered: { variant: "default" as const, icon: AlertCircle },
      executed: { variant: "default" as const, icon: CheckCircle2 },
    };

    const config = variants[status] || { variant: "secondary" as const, icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="mr-1 h-3 w-3" />
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <SidebarProvider>
      <EnhancedAppSidebar />
      <SidebarInset>
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
        </div>
        <DashboardHeader />
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {/* Premium Mesh Gradient Background */}
          <div className="mesh-gradient" />
          <div className="noise-overlay" />
          
          {/* Animated Orbs */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-20 left-20 w-96 h-96 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(251, 146, 60, 0.15) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.div
              className="absolute right-0 bottom-0 w-96 h-96 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
              animate={{
                x: [0, -100, 0],
                y: [0, 100, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          <div className="relative z-10 container max-w-6xl mx-auto px-6 py-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <button
                onClick={() => setLocation("/dashboard")}
                className="mb-6 glass px-4 py-2 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-5xl font-bold display-font heading-glow mb-3">
                    Operator Dashboard
                  </h1>
                  <p className="text-slate-400 text-lg">
                    Manage recovery cases and will executions
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-4 items-center mb-6"
            >
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cases..."
                    className="pl-10 glass"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search recovery and will cases"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={filter === "pending" ? "default" : "outline"}
                  onClick={() => setFilter("pending")}
                >
                  Pending
                </Button>
                <Button
                  variant={filter === "in_progress" ? "default" : "outline"}
                  onClick={() => setFilter("in_progress")}
                >
                  In Progress
                </Button>
              </div>
            </motion.div>

            {/* Recovery Cases */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Recovery Cases</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading cases...
                  </div>
                ) : recoveryCases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p>No recovery cases found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recoveryCases
                      .filter((case_) =>
                        debouncedSearch
                          ? case_.walletAddress.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                            case_.claimantEmail.toLowerCase().includes(debouncedSearch.toLowerCase())
                          : true
                      )
                      .map((case_) => (
                      <Card key={case_.id} className="glass p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <strong>Wallet:</strong>
                              <span className="font-mono text-sm">{case_.walletAddress}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <strong>Claimant:</strong>
                              <span>{case_.claimantEmail}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <strong>Evidence:</strong>
                              <span>{case_.evidenceCount} file(s)</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Created: {new Date(case_.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(case_.status)}
                            <Button size="sm" variant="outline">
                              <Eye className="mr-2 h-4 w-4" />
                              Review
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Will Cases */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Will Executions</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading cases...
                  </div>
                ) : willCases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileCheck className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p>No will cases found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {willCases
                      .filter((case_) =>
                        debouncedSearch
                          ? case_.ownerName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                            case_.ownerAddress.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                            case_.contractAddress?.toLowerCase().includes(debouncedSearch.toLowerCase())
                          : true
                      )
                      .map((case_) => (
                      <Card key={case_.id} className="glass p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <strong>Owner:</strong>
                              <span>{case_.ownerName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <strong>Wallet:</strong>
                              <span className="font-mono text-sm">{case_.ownerAddress}</span>
                            </div>
                            {case_.contractAddress && (
                              <div className="flex items-center gap-2">
                                <strong>Contract:</strong>
                                <span className="font-mono text-sm">{case_.contractAddress}</span>
                              </div>
                            )}
                            {case_.triggeredAt && (
                              <div className="text-sm text-muted-foreground">
                                Triggered: {new Date(case_.triggeredAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(case_.status)}
                            <Button size="sm" variant="outline">
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SOP Checklist */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Standard Operating Procedures</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Recovery Case Intake Checklist</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Validate wallet format (0x...) and checksum</li>
                      <li>Request proof of ownership (signed message or transaction history)</li>
                      <li>Verify relationship proof (document upload, selfie + liveness)</li>
                      <li>Check evidence files for integrity (SHA-256 hash verification)</li>
                      <li>Run KYC-lite validation if required</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">On-Chain Operations SOP</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Dry-run on testnet before mainnet execution</li>
                      <li>Verify multisig thresholds are met</li>
                      <li>Check operator wallet has sufficient gas</li>
                      <li>Document transaction hash and block number</li>
                      <li>Update case status in database after confirmation</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Refund & Dispute Process</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Review case documentation</li>
                      <li>Consult legal team for complex disputes</li>
                      <li>Document decision and reasoning</li>
                      <li>Process refunds within 30 days if approved</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
