import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import DOMPurify from "dompurify";
import {
  FileText,
  Download,
  Upload,
  Plus,
  Trash2,
  Save,
  Eye,
  Zap,
  Users,
  Percent,
  Wallet,
  AlertCircle,
  CheckCircle2,
  GripVertical,
  PieChart,
  User,
  Building2,
  Heart,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { EnhancedAppSidebar } from "@/components/EnhancedAppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { API_BASE_URL } from "@shared/config/api";

interface Allocation {
  id: string;
  recipient: string;
  recipientName: string;
  percentage: number;
  assetType: "native" | "token" | "nft" | "all";
  tokenAddress?: string;
  tokenSymbol?: string;
  isCharityDAO: boolean;
  nftOnly: boolean;
}

// Sortable Allocation Card Component
function SortableAllocationCard({
  allocation,
  index,
  onUpdate,
  onRemove,
  totalPercentage,
}: {
  allocation: Allocation;
  index: number;
  onUpdate: (id: string, updates: Partial<Allocation>) => void;
  onRemove: (id: string) => void;
  totalPercentage: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: allocation.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case "native":
        return <Wallet className="h-4 w-4" />;
      case "token":
        return <Percent className="h-4 w-4" />;
      case "nft":
        return <FileText className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`group relative ${isDragging ? "z-50" : ""}`}
    >
      <Card
        className={`overflow-hidden transition-all duration-200 ${
          isDragging
            ? "shadow-2xl ring-2 ring-primary scale-105"
            : "hover:shadow-lg hover:border-primary/50"
        }`}
      >
        {/* Percentage Bar */}
        <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-white/20"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "linear",
            }}
          />
        </div>

        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing mt-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <GripVertical className="h-5 w-5" />
            </div>

            <div className="flex-1 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={allocation.recipientName}
                        onChange={(e) =>
                          onUpdate(allocation.id, { recipientName: e.target.value })
                        }
                        placeholder="Recipient name..."
                        className="font-semibold text-lg border-0 focus-visible:ring-0 p-0 h-auto bg-transparent"
                      />
                      {allocation.isCharityDAO && (
                        <Badge variant="secondary" className="gap-1">
                          <Heart className="h-3 w-3" />
                          Charity
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Beneficiary #{index + 1}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemove(allocation.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Percentage Input - Large and Prominent */}
              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Allocation Percentage
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        step="0.01"
                        value={allocation.percentage}
                        onChange={(e) =>
                          onUpdate(allocation.id, {
                            percentage: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="text-4xl font-bold h-20 pr-16 text-center"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Visual Percentage Bar */}
                  <div className="w-32 space-y-2">
                    <div className="text-xs text-muted-foreground text-center">
                      Of total
                    </div>
                    <div className="h-24 w-full bg-muted rounded-lg overflow-hidden relative">
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-purple-500"
                        initial={{ height: 0 }}
                        animate={{
                          height: `${Math.min(
                            (allocation.percentage / 100) * 100,
                            100
                          )}%`,
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                        {allocation.percentage}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wallet Address */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-2">
                  <Wallet className="h-3 w-3" />
                  Recipient Wallet Address
                </Label>
                <Input
                  value={allocation.recipient}
                  onChange={(e) =>
                    onUpdate(allocation.id, { recipient: e.target.value })
                  }
                  placeholder="0x..."
                  className="font-mono"
                />
              </div>

              {/* Asset Type Selection */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Asset Type
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: "all", label: "All Assets", icon: Zap },
                    { value: "native", label: "Native", icon: Wallet },
                    { value: "token", label: "Token", icon: Percent },
                    { value: "nft", label: "NFT", icon: FileText },
                  ].map((type) => (
                    <motion.button
                      key={type.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        onUpdate(allocation.id, { assetType: type.value as any })
                      }
                      className={`p-3 rounded-lg border-2 transition-all ${
                        allocation.assetType === type.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <type.icon className="h-4 w-4 mx-auto mb-1" />
                      <span className="text-xs font-medium">{type.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Token Details (if token type) */}
              <AnimatePresence>
                {allocation.assetType === "token" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Token Address
                      </Label>
                      <Input
                        value={allocation.tokenAddress || ""}
                        onChange={(e) =>
                          onUpdate(allocation.id, { tokenAddress: e.target.value })
                        }
                        placeholder="0x..."
                        className="font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Token Symbol
                      </Label>
                      <Input
                        value={allocation.tokenSymbol || ""}
                        onChange={(e) =>
                          onUpdate(allocation.id, { tokenSymbol: e.target.value })
                        }
                        placeholder="USDC, DAI..."
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Options */}
              <div className="flex gap-4 pt-2">
                <motion.label
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={allocation.nftOnly}
                    onChange={(e) =>
                      onUpdate(allocation.id, { nftOnly: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span className="text-sm font-medium">NFTs Only</span>
                </motion.label>

                <motion.label
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={allocation.isCharityDAO}
                    onChange={(e) =>
                      onUpdate(allocation.id, { isCharityDAO: e.target.checked })
                    }
                    className="rounded"
                  />
                  <Heart className="h-3 w-3" />
                  <span className="text-sm font-medium">Charity DAO</span>
                </motion.label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function SmartWillBuilder() {
  const [, setLocation] = useLocation();
  const { user, walletAddress, isAuthenticated } = useWallet();
  const [ownerName, setOwnerName] = useState("");
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    if ((user as any)?.name) {
      setOwnerName((user as any).name);
    }
  }, [isAuthenticated, user, setLocation]);

  const totalPercentage = allocations.reduce((sum, alloc) => sum + alloc.percentage, 0);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setAllocations((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addAllocation = () => {
    const newAllocation: Allocation = {
      id: `alloc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      recipient: "",
      recipientName: "",
      percentage: 0,
      assetType: "all",
      isCharityDAO: false,
      nftOnly: false,
    };
    setAllocations([...allocations, newAllocation]);
  };

  const removeAllocation = (id: string) => {
    setAllocations(allocations.filter((a) => a.id !== id));
  };

  const updateAllocation = (id: string, updates: Partial<Allocation>) => {
    setAllocations(
      allocations.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  };

  const validateAllocations = (): string | null => {
    if (allocations.length === 0) {
      return "At least one allocation is required";
    }

    for (const alloc of allocations) {
      if (!alloc.recipient || !alloc.recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
        return `Invalid recipient address for ${alloc.recipientName || "allocation"}`;
      }
      if (alloc.percentage <= 0 || alloc.percentage > 100) {
        return `Invalid percentage for ${alloc.recipientName || "allocation"} (must be 1-100%)`;
      }
      if (alloc.assetType === "token" && !alloc.tokenAddress) {
        return `Token address required for ${alloc.recipientName || "allocation"}`;
      }
    }

    if (totalPercentage !== 100) {
      return `Total allocation must equal 100% (currently ${totalPercentage.toFixed(2)}%)`;
    }

    return null;
  };

  const generatePreview = async () => {
    const validationError = validateAllocations();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/wills/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          allocations: allocations.map((a) => ({
            recipient: a.recipient,
            recipientName: a.recipientName,
            percentage: a.percentage,
            assetType: a.assetType,
            tokenAddress: a.tokenAddress,
            tokenSymbol: a.tokenSymbol,
            isCharityDAO: a.isCharityDAO,
            nftOnly: a.nftOnly,
          })),
          ownerName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate preview");
      }

      const html = await response.text();
      setPreviewContent(html);
      setPreviewOpen(true);
    } catch (err: any) {
      setError(err.message || "Failed to generate preview");
    }
  };

  const downloadPDF = async () => {
    const validationError = validateAllocations();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsGeneratingPDF(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/wills/generate-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          allocations: allocations.map((a) => ({
            recipient: a.recipient,
            recipientName: a.recipientName,
            percentage: a.percentage,
            assetType: a.assetType,
            tokenAddress: a.tokenAddress,
            tokenSymbol: a.tokenSymbol,
            isCharityDAO: a.isCharityDAO,
            nftOnly: a.nftOnly,
          })),
          ownerName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `will_${Date.now()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccess("Legal will document downloaded successfully!");
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to generate PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const deployWill = async () => {
    const validationError = validateAllocations();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsDeploying(true);
      setError(null);

      const metadataHash = `will_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const response = await fetch(`${API_BASE_URL}/api/wills/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          allocations: allocations.map((a) => ({
            recipient: a.recipient,
            recipientName: a.recipientName,
            percentage: a.percentage,
            assetType: a.assetType,
            tokenAddress: a.tokenAddress,
            tokenSymbol: a.tokenSymbol,
            isCharityDAO: a.isCharityDAO,
            nftOnly: a.nftOnly,
          })),
          ownerName,
          metadataHash,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to deploy will");
      }

      const data = await response.json();
      setSuccess(`Will deployed successfully! Will ID: ${data.willId}`);
      setTimeout(() => setSuccess(null), 10000);
    } catch (err: any) {
      setError(err.message || "Failed to deploy will");
    } finally {
      setIsDeploying(false);
    }
  };

  const applyTemplate = (template: "family" | "charity" | "friends") => {
    const templates = {
      family: [
        {
          id: `alloc_${Date.now()}_1`,
          recipient: "",
          recipientName: "Spouse",
          percentage: 50,
          assetType: "all" as const,
          isCharityDAO: false,
          nftOnly: false,
        },
        {
          id: `alloc_${Date.now()}_2`,
          recipient: "",
          recipientName: "Children",
          percentage: 50,
          assetType: "all" as const,
          isCharityDAO: false,
          nftOnly: false,
        },
      ],
      charity: [
        {
          id: `alloc_${Date.now()}_1`,
          recipient: "",
          recipientName: "Charity DAO",
          percentage: 100,
          assetType: "all" as const,
          isCharityDAO: true,
          nftOnly: false,
        },
      ],
      friends: [
        {
          id: `alloc_${Date.now()}_1`,
          recipient: "",
          recipientName: "Friend 1",
          percentage: 33.33,
          assetType: "all" as const,
          isCharityDAO: false,
          nftOnly: false,
        },
        {
          id: `alloc_${Date.now()}_2`,
          recipient: "",
          recipientName: "Friend 2",
          percentage: 33.33,
          assetType: "all" as const,
          isCharityDAO: false,
          nftOnly: false,
        },
        {
          id: `alloc_${Date.now()}_3`,
          recipient: "",
          recipientName: "Friend 3",
          percentage: 33.34,
          assetType: "all" as const,
          isCharityDAO: false,
          nftOnly: false,
        },
      ],
    };
    setAllocations(templates[template]);
  };

  return (
    <SidebarProvider>
      <EnhancedAppSidebar />
      <SidebarInset>
        <div className="flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 border-b px-4 py-3">
          <SidebarTrigger className="-ml-1" />
        </div>
        <DashboardHeader />

        <div className="flex-1 p-8 pt-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Smart Will Builder
                </h1>
                <p className="text-muted-foreground mt-2">
                  Create visual, on-chain inheritance rules for your crypto assets
                </p>
              </div>
              <div className="flex gap-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" onClick={generatePreview} size="lg">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={downloadPDF} disabled={isGeneratingPDF} size="lg">
                    <Download className="mr-2 h-4 w-4" />
                    {isGeneratingPDF ? "Generating..." : "Download Legal Copy"}
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Testator Info Card */}
            <Card className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Testator Name
                    </Label>
                    <Input
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Your full legal name"
                      className="text-lg h-12"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Wallet Address
                    </Label>
                    <Input
                      value={walletAddress || "Not connected"}
                      disabled
                      className="font-mono h-12"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert className="border-green-500 bg-green-50 mb-4">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content - Allocations */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Start Templates
                  </CardTitle>
                  <CardDescription>
                    Start with a pre-configured template and customize
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        className="w-full h-auto flex-col gap-2 py-4"
                        onClick={() => applyTemplate("family")}
                      >
                        <Users className="h-6 w-6 text-blue-500" />
                        <div className="text-center">
                          <div className="font-semibold">Family</div>
                          <div className="text-xs text-muted-foreground">50/50 Split</div>
                        </div>
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        className="w-full h-auto flex-col gap-2 py-4"
                        onClick={() => applyTemplate("charity")}
                      >
                        <Heart className="h-6 w-6 text-pink-500" />
                        <div className="text-center">
                          <div className="font-semibold">Charity</div>
                          <div className="text-xs text-muted-foreground">100% Donation</div>
                        </div>
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        className="w-full h-auto flex-col gap-2 py-4"
                        onClick={() => applyTemplate("friends")}
                      >
                        <Users className="h-6 w-6 text-purple-500" />
                        <div className="text-center">
                          <div className="font-semibold">Friends</div>
                          <div className="text-xs text-muted-foreground">3-Way Split</div>
                        </div>
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>

              {/* Allocations List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">Beneficiaries</h2>
                    <p className="text-sm text-muted-foreground">
                      Drag to reorder, click to edit
                    </p>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={addAllocation} size="lg">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Beneficiary
                    </Button>
                  </motion.div>
                </div>

                {allocations.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <Card className="border-dashed">
                      <CardContent className="py-16">
                        <FileText className="mx-auto h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium text-muted-foreground mb-2">
                          No beneficiaries yet
                        </p>
                        <p className="text-sm text-muted-foreground mb-6">
                          Start by adding a beneficiary or choosing a template
                        </p>
                        <Button onClick={addAllocation} size="lg">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Your First Beneficiary
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={allocations.map((a) => a.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4">
                        <AnimatePresence>
                          {allocations.map((allocation, index) => (
                            <SortableAllocationCard
                              key={allocation.id}
                              allocation={allocation}
                              index={index}
                              onUpdate={updateAllocation}
                              onRemove={removeAllocation}
                              totalPercentage={totalPercentage}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>

            {/* Sidebar - Summary & Actions */}
            <div className="space-y-6">
              {/* Total Allocation Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Allocation Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Circular Progress */}
                    <div className="relative w-48 h-48 mx-auto">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="96"
                          cy="96"
                          r="80"
                          stroke="currentColor"
                          strokeWidth="16"
                          fill="none"
                          className="text-muted"
                        />
                        <motion.circle
                          cx="96"
                          cy="96"
                          r="80"
                          stroke="currentColor"
                          strokeWidth="16"
                          fill="none"
                          strokeLinecap="round"
                          className={
                            totalPercentage === 100
                              ? "text-green-500"
                              : totalPercentage > 100
                              ? "text-red-500"
                              : "text-blue-500"
                          }
                          initial={{ strokeDasharray: "0 502" }}
                          animate={{
                            strokeDasharray: `${(totalPercentage / 100) * 502} 502`,
                          }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-bold">
                          {totalPercentage.toFixed(0)}
                        </span>
                        <span className="text-2xl text-muted-foreground">%</span>
                      </div>
                    </div>

                    {/* Status Message */}
                    <div className="text-center">
                      {totalPercentage === 100 ? (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-semibold">Perfect allocation!</span>
                        </div>
                      ) : totalPercentage < 100 ? (
                        <div className="text-muted-foreground">
                          <span className="font-semibold">
                            {(100 - totalPercentage).toFixed(2)}%
                          </span>{" "}
                          remaining
                        </div>
                      ) : (
                        <div className="text-red-600">
                          <span className="font-semibold">
                            {(totalPercentage - 100).toFixed(2)}%
                          </span>{" "}
                          over limit
                        </div>
                      )}
                    </div>

                    {/* Beneficiary List */}
                    {allocations.length > 0 && (
                      <div className="space-y-2 pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-3">
                          {allocations.length} Beneficiar{allocations.length === 1 ? "y" : "ies"}
                        </h4>
                        {allocations.map((alloc, index) => (
                          <div
                            key={alloc.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {index + 1}
                              </div>
                              <span className="text-sm font-medium truncate max-w-[120px]">
                                {alloc.recipientName || "Unnamed"}
                              </span>
                            </div>
                            <Badge variant="secondary">{alloc.percentage}%</Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Deploy Button */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="pt-4 border-t"
                    >
                      <Button
                        onClick={deployWill}
                        disabled={isDeploying || totalPercentage !== 100}
                        className="w-full h-14 text-lg"
                        size="lg"
                      >
                        <Zap className="mr-2 h-5 w-5" />
                        {isDeploying ? "Deploying..." : "Deploy On-Chain Will"}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground mt-3">
                        One-time: $299 + $99/year monitoring
                      </p>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Will Preview</DialogTitle>
            </DialogHeader>
            <div className="overflow-auto">
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(previewContent, {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'table', 'tr', 'td', 'th', 'thead', 'tbody'],
                    ALLOWED_ATTR: ['class', 'id', 'style'],
                    ALLOW_DATA_ATTR: false,
                  })
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}