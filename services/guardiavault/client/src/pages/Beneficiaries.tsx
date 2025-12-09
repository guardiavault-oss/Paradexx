import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Users, Eye, UserPlus, UserX, RefreshCw, Gift, Heart, Coins, Image, Wallet, FileText, AlertCircle } from "lucide-react";
import { useVaults, usePartiesByRole } from "@/hooks/useVaults";
import { Skeleton } from "@/components/ui/skeleton";
import GuardianCard from "@/components/GuardianCard";
import EnhancedBeneficiaryCard from "@/components/EnhancedBeneficiaryCard";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { logError } from "@/utils/logger";
import { Checkbox } from "@/components/ui/checkbox";
import { useWallet } from "@/hooks/useWallet";
// Optimized Ethers import - use optimized imports for better tree-shaking
import { BrowserProvider, formatEther, parseEther } from "@/lib/ethers-optimized";
import type { ExtendedParty } from "@/types/party";
import { EnhancedAppSidebar } from "@/components/EnhancedAppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import {
  fetchAllAssets,
  fetchTokenBalances,
  fetchNFTs,
  getTotalPortfolioValue,
  getAssetAllocations,
  type Asset,
  type TokenAsset,
  type NFTAsset,
  SUPPORTED_CHAINS,
} from "@/services/assetFetcher";
import "../design-system.css";

export default function Beneficiaries() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: vaultsData, isLoading: vaultsLoading } = useVaults();
  const vault = vaultsData?.vaults?.[0];
  const vaultId = vault?.id;

  const { data: beneficiariesData, isLoading: beneficiariesLoading } = usePartiesByRole(
    vaultId,
    "beneficiary"
  );

  const beneficiaries = beneficiariesData?.parties || [];
  const { walletAddress, isWalletConnected } = useWallet();
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [letterDialogOpen, setLetterDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<any>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isNonprofit, setIsNonprofit] = useState(false);
  const [nonprofitName, setNonprofitName] = useState("");
  const [nonprofitEIN, setNonprofitEIN] = useState("");
  const [nonprofitWebsite, setNonprofitWebsite] = useState("");
  const [letterToBeneficiary, setLetterToBeneficiary] = useState("");
  const [processing, setProcessing] = useState(false);

  // Asset state
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [selectedChains, setSelectedChains] = useState<number[]>([1]); // Default to Ethereum
  const [portfolioValue, setPortfolioValue] = useState<number>(0);

  // Fetch assets (tokens + NFTs) from wallet
  useEffect(() => {
    if (walletAddress && isWalletConnected) {
      fetchAssets();
    } else {
      // Try API fallback for demo accounts
      fetchAssetsFromAPI();
    }
  }, [walletAddress, isWalletConnected, selectedChains]);

  const fetchAssets = async () => {
    if (!walletAddress) return;

    setLoadingAssets(true);
    setAssetError(null);

    try {
      // Fetch assets from all selected chains
      const fetchedAssets = await fetchAllAssets(
        walletAddress,
        selectedChains,
        undefined,
        import.meta.env.VITE_ALCHEMY_API_KEY
      );

      setAssets(fetchedAssets);
      setPortfolioValue(getTotalPortfolioValue(fetchedAssets));
    } catch (error: any) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "fetchAssets",
      });
      setAssetError(error.message || "Failed to fetch assets");
      toast({
        title: "Error Loading Assets",
        description: error.message || "Unable to fetch your crypto assets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAssets(false);
    }
  };

  const fetchAssetsFromAPI = async () => {
    // Fallback for demo accounts or when wallet isn't connected
    setLoadingAssets(true);
    try {
      const response = await fetch("/api/wallet/balance", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        // Convert API response to asset format
        const apiAssets: Asset[] = [];
        
        if (data.eth) {
          apiAssets.push({
            type: "token",
            chainId: 1,
            chainName: "Ethereum",
            address: "native",
            symbol: "ETH",
            name: "Ethereum",
            decimals: 18,
            balance: parseEther(data.eth.toString()).toString(),
            balanceFormatted: data.eth.toString(),
            priceUsd: data.ethPrice || 0,
            valueUsd: parseFloat(data.eth) * (data.ethPrice || 0),
          });
        }

        if (data.tokens) {
          Object.entries(data.tokens).forEach(([symbol, amount]: [string, any]) => {
            if (parseFloat(amount) > 0) {
              apiAssets.push({
                type: "token",
                chainId: 1,
                chainName: "Ethereum",
                address: `token-${symbol.toLowerCase()}`,
                symbol: symbol.toUpperCase(),
                name: symbol.toUpperCase(),
                decimals: 18,
                balance: parseEther(amount.toString()).toString(),
                balanceFormatted: amount.toString(),
              });
            }
          });
        }

        setAssets(apiAssets);
        setPortfolioValue(getTotalPortfolioValue(apiAssets));
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "fetchAssetsFromAPI",
      });
    } finally {
      setLoadingAssets(false);
    }
  };

  // Get available assets for selection (tokens with balance > 0 + all NFTs)
  const availableAssets: Asset[] = assets.filter(
    (asset) =>
      asset.type === "nft" ||
      (asset.type === "token" && parseFloat(asset.balanceFormatted) > 0)
  );

  // Get asset allocations for display
  const assetAllocationData = getAssetAllocations(assets);

  // Selected asset allocations per beneficiary
  const [assetAllocations, setAssetAllocations] = useState<Record<string, string[]>>({});

  const handleAddBeneficiary = () => {
    setSelectedBeneficiary(null);
    setName("");
    setEmail("");
    setPhone("");
    setIsNonprofit(false);
    setNonprofitName("");
    setNonprofitEIN("");
    setNonprofitWebsite("");
    setLetterToBeneficiary("");
    setAddDialogOpen(true);
  };

  const handleViewLetter = (beneficiary: ExtendedParty) => {
    setSelectedBeneficiary(beneficiary);
    setLetterToBeneficiary(beneficiary.letterToBeneficiary || "");
    setLetterDialogOpen(true);
  };

  const handleSaveLetter = async () => {
    if (!vaultId || !selectedBeneficiary) return;
    
    setProcessing(true);
    try {
      const response = await apiRequest("PATCH", `/api/parties/${selectedBeneficiary.id}`, {
        letterToBeneficiary,
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/vaults", vaultId, "parties"] });
        toast({
          title: "Letter Saved",
          description: "Your personal letter has been saved and will be delivered to the beneficiary.",
        });
        setLetterDialogOpen(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save letter",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleEditBeneficiary = (beneficiary: ExtendedParty) => {
    setSelectedBeneficiary(beneficiary);
    setName(beneficiary.name);
    setEmail(beneficiary.email);
    setPhone(beneficiary.phone || "");
    setIsNonprofit(Boolean(beneficiary.isNonprofit));
    setNonprofitName(beneficiary.nonprofitName || "");
    setNonprofitEIN(beneficiary.nonprofitEIN || "");
    setNonprofitWebsite(beneficiary.nonprofitWebsite || "");
    setLetterToBeneficiary(beneficiary.letterToBeneficiary || "");
    setEditDialogOpen(true);
  };

  const handleAllocateAssets = (beneficiary: ExtendedParty) => {
    setSelectedBeneficiary(beneficiary);
    // Load existing allocations for this beneficiary
    const existingAssets = beneficiary.allocatedAssets || [];
    setAssetAllocations({
      [beneficiary.id]: existingAssets,
    });
    setAllocationDialogOpen(true);
  };

  const handleRemoveBeneficiary = (beneficiary: ExtendedParty) => {
    setSelectedBeneficiary(beneficiary);
    setRemoveDialogOpen(true);
  };

  const confirmAdd = async () => {
    if (!vaultId || !name || !email) return;
    
    setProcessing(true);
    try {
      const response = await apiRequest("POST", `/api/vaults/${vaultId}/parties`, {
        role: "beneficiary",
        name: isNonprofit ? nonprofitName : name,
        email,
        phone: phone || undefined,
        isNonprofit,
        nonprofitName: isNonprofit ? nonprofitName : undefined,
        nonprofitEIN: isNonprofit ? nonprofitEIN : undefined,
        nonprofitWebsite: isNonprofit ? nonprofitWebsite : undefined,
        letterToBeneficiary: letterToBeneficiary || undefined,
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/vaults", vaultId, "parties"] });
        toast({
          title: "Beneficiary Added",
          description: `${isNonprofit ? nonprofitName : name} has been added as a beneficiary.`,
        });
        setAddDialogOpen(false);
        resetForm();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add beneficiary",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const confirmEdit = async () => {
    if (!vaultId || !selectedBeneficiary || !name || !email) return;
    
    setProcessing(true);
    try {
      const response = await apiRequest("PATCH", `/api/parties/${selectedBeneficiary.id}`, {
        name: isNonprofit ? nonprofitName : name,
        email,
        phone: phone || undefined,
        isNonprofit,
        nonprofitName: isNonprofit ? nonprofitName : undefined,
        nonprofitEIN: isNonprofit ? nonprofitEIN : undefined,
        nonprofitWebsite: isNonprofit ? nonprofitWebsite : undefined,
        letterToBeneficiary: letterToBeneficiary || undefined,
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/vaults", vaultId, "parties"] });
        toast({
          title: "Beneficiary Updated",
          description: "Beneficiary information has been updated.",
        });
        setEditDialogOpen(false);
        resetForm();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update beneficiary",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const confirmAssetAllocation = async () => {
    if (!vaultId || !selectedBeneficiary) return;
    
    setProcessing(true);
    try {
      const allocatedAssetIds = assetAllocations[selectedBeneficiary.id] || [];
      
      // Convert asset IDs to the format expected by the backend
      const assetData = allocatedAssetIds.map((assetId) => {
        const asset = availableAssets.find(
          (a) => {
            if (a.type === "token") {
              return `${a.chainId}-${a.address}` === assetId;
            } else {
              return `${a.chainId}-${a.contractAddress}-${a.tokenId}` === assetId;
            }
          }
        );
        
        if (asset) {
          if (asset.type === "token") {
            return {
              type: "token",
              chainId: asset.chainId,
              address: asset.address,
              symbol: asset.symbol,
              amount: asset.balanceFormatted,
            };
          } else {
            return {
              type: "nft",
              chainId: asset.chainId,
              contractAddress: asset.contractAddress,
              tokenId: asset.tokenId,
            };
          }
        }
        return null;
      }).filter(Boolean);
      
      const response = await apiRequest("PATCH", `/api/parties/${selectedBeneficiary.id}`, {
        allocatedAssets: allocatedAssetIds, // Keep IDs for backward compatibility
        allocatedAssetsData: assetData, // Include full asset data
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/vaults", vaultId, "parties"] });
        toast({
          title: "Assets Allocated",
          description: `Assets have been assigned to ${selectedBeneficiary.name}.`,
        });
        setAllocationDialogOpen(false);
        setSelectedBeneficiary(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to allocate assets",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const confirmRemove = async () => {
    if (!vaultId || !selectedBeneficiary) return;

    setProcessing(true);
    try {
      const response = await apiRequest("DELETE", `/api/parties/${selectedBeneficiary.id}`);
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/vaults", vaultId, "parties"] });
        toast({
          title: "Beneficiary Removed",
          description: `${selectedBeneficiary.name} has been removed as a beneficiary.`,
        });
        setRemoveDialogOpen(false);
        setSelectedBeneficiary(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove beneficiary",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setIsNonprofit(false);
    setNonprofitName("");
    setNonprofitEIN("");
    setNonprofitWebsite("");
    setLetterToBeneficiary("");
    setSelectedBeneficiary(null);
  };

  // Calculate total allocated amounts (USD value)
  const calculateAllocatedAmounts = () => {
    const allocations: Record<string, { total: number; assets: string[] }> = {};
    
    beneficiaries.forEach((beneficiary) => {
      const allocatedAssets = (beneficiary as any).allocatedAssets || [];
      let totalValue = 0;
      
      allocatedAssets.forEach((assetId: string) => {
        const asset = availableAssets.find(
          (a) => {
            if (a.type === "token") {
              return `${a.chainId}-${a.address}` === assetId;
            } else {
              return `${a.chainId}-${a.contractAddress}-${a.tokenId}` === assetId;
            }
          }
        );
        if (asset && asset.type === "token") {
          totalValue += asset.valueUsd || 0;
        }
      });
      
      allocations[beneficiary.id] = {
        total: totalValue,
        assets: allocatedAssets,
      };
    });
    
    return allocations;
  };

  const allocatedAmounts = calculateAllocatedAmounts();
  const totalAllocated = Object.values(allocatedAmounts).reduce((sum, a) => sum + a.total, 0);

  const toggleAssetAllocation = (beneficiaryId: string, assetId: string) => {
    const current = assetAllocations[beneficiaryId] || [];
    if (current.includes(assetId)) {
      setAssetAllocations({
        ...assetAllocations,
        [beneficiaryId]: current.filter(id => id !== assetId),
      });
    } else {
      setAssetAllocations({
        ...assetAllocations,
        [beneficiaryId]: [...current, assetId],
      });
    }
  };

  if (vaultsLoading || beneficiariesLoading) {
    return (
      <SidebarProvider>
        <EnhancedAppSidebar />
        <SidebarInset>
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
          </div>
          <DashboardHeader />
          <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="mesh-gradient" />
            <div className="noise-overlay" />
            <div className="container max-w-6xl mx-auto py-8 px-6 relative z-10">
              <Skeleton className="h-12 w-48 mb-8 bg-slate-800/50" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 bg-slate-800/50" />
                ))}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const allocatedAssetIds = selectedBeneficiary ? (assetAllocations[selectedBeneficiary.id] || []) : [];

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
              className="absolute w-96 h-96 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)",
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
            {/* Premium Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-5xl font-bold display-font heading-glow mb-3 flex items-center gap-3">
                    <Gift className="w-10 h-10 text-pink-400" />
                    Beneficiaries
                  </h1>
                  <p className="text-slate-400 text-lg">
                    Manage who receives your assets and how they are distributed
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="glass px-6 py-3 rounded-xl"
                  >
                    <Badge variant="outline" className="text-lg px-4 py-2 bg-white/5 border-white/10">
                      {beneficiaries.length}
                    </Badge>
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddBeneficiary}
                    className="btn-premium btn-primary flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Beneficiary
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Portfolio Overview Card */}
            {(isWalletConnected || portfolioValue > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6 mb-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white display-font">Portfolio</h3>
                      <p className="text-sm text-slate-400">Your crypto assets across all chains</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchAssets}
                      disabled={loadingAssets}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingAssets ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
                
                {loadingAssets ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full bg-slate-800/50" />
                    <Skeleton className="h-12 w-full bg-slate-800/50" />
                  </div>
                ) : assetError ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-400">Error loading assets</p>
                      <p className="text-xs text-red-300/80">{assetError}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Total Portfolio Value */}
                    <div className="flex items-baseline gap-2 pb-4 border-b border-white/10">
                      <span className="text-3xl font-bold font-display text-white">
                        ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-lg text-slate-400">USD</span>
                    </div>

                    {/* Token Assets */}
                    {assets.filter((a) => a.type === "token" && parseFloat(a.balanceFormatted) > 0).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                          <Coins className="w-4 h-4" />
                          Tokens
                        </h4>
                        <div className="space-y-2">
                          {assets
                            .filter((a): a is TokenAsset => a.type === "token" && parseFloat(a.balanceFormatted) > 0)
                            .slice(0, 5)
                            .map((token) => (
                              <div
                                key={`${token.chainId}-${token.address}`}
                                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                                    {token.symbol.slice(0, 2)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-white">{token.symbol}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {token.chainName}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-slate-400">{token.name}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-white">{token.balanceFormatted}</p>
                                  {token.valueUsd && (
                                    <p className="text-xs text-slate-400">${token.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* NFT Assets */}
                    {assets.filter((a) => a.type === "nft").length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                          <Image className="w-4 h-4" />
                          NFTs ({assets.filter((a) => a.type === "nft").length})
                        </h4>
                        <div className="grid grid-cols-4 gap-2">
                          {assets
                            .filter((a): a is NFTAsset => a.type === "nft")
                            .slice(0, 8)
                            .map((nft) => (
                              <div
                                key={`${nft.chainId}-${nft.contractAddress}-${nft.tokenId}`}
                                className="aspect-square rounded-lg bg-slate-800/30 overflow-hidden hover:bg-slate-800/50 transition-colors relative group"
                              >
                                {nft.image ? (
                                  <img
                                    src={nft.image}
                                    alt={nft.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23334155' width='100' height='100'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%2394a3b8' font-size='12'%3ENFT%3C/text%3E%3C/svg%3E";
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                                    No Image
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="absolute bottom-0 left-0 right-0 p-2">
                                    <p className="text-xs text-white truncate">{nft.name}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {assets.length === 0 && !loadingAssets && (
                      <div className="text-center py-8 text-slate-400">
                        <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No assets found</p>
                        <p className="text-xs mt-1">Connect your wallet to see your crypto assets</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {beneficiaries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card p-12 text-center"
              >
                <Gift className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-2xl font-bold text-white mb-2 display-font">No Beneficiaries Added</h3>
                <p className="text-slate-400 mb-6 text-lg">
                  Add beneficiaries to specify who should receive your crypto assets and NFTs.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddBeneficiary}
                  className="btn-premium btn-primary"
                >
                  Add First Beneficiary
                </motion.button>
              </motion.div>
            ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beneficiaries.map((beneficiary: ExtendedParty) => {
              const allocatedCount = beneficiary.allocatedAssets?.length || 0;
              const isNPO = beneficiary.isNonprofit;
              const allocatedAssets = beneficiary.allocatedAssets || [];
              // Calculate allocation percentage based on allocated amount vs total
              const totalAllocated = beneficiaries.reduce((sum: number, b: any) => {
                return sum + (allocatedAmounts[b.id]?.total || 0);
              }, 0);
              const beneficiaryAllocated = allocatedAmounts[beneficiary.id]?.total || 0;
              const allocationPercent = totalAllocated > 0 
                ? Math.round((beneficiaryAllocated / totalAllocated) * 100)
                : beneficiaries.length > 0 ? Math.round(100 / beneficiaries.length) : 0;
              
              return (
                <EnhancedBeneficiaryCard
                  key={beneficiary.id}
                  id={beneficiary.id}
                  name={beneficiary.name}
                  email={beneficiary.email}
                  phone={beneficiary.phone}
                  isNonprofit={isNPO}
                  allocationPercent={allocationPercent}
                  allocatedAmount={beneficiaryAllocated}
                  allocatedAssets={allocatedAssets.map((a) => {
                    const asset = availableAssets.find((av) => {
                      if (av.type === "token") {
                        return `${av.chainId}-${av.address}` === a;
                      } else {
                        return `${av.chainId}-${av.contractAddress}-${av.tokenId}` === a;
                      }
                    });
                    if (asset?.type === "token") {
                      return asset.symbol;
                    } else if (asset?.type === "nft") {
                      return asset.name;
                    }
                    return a;
                  })}
                  walletAddress={beneficiary.walletAddress}
                  letterToBeneficiary={beneficiary.letterToBeneficiary}
                  onEdit={() => handleEditBeneficiary(beneficiary)}
                  onRemove={() => handleRemoveBeneficiary(beneficiary)}
                  onAllocateAssets={() => handleAllocateAssets(beneficiary)}
                  onViewLetter={() => handleViewLetter(beneficiary)}
                  onChangeHistory={async () => {
                    try {
                      const response = await fetch(`/api/parties/${beneficiary.id}/history`, {
                        credentials: "include",
                      });
                      if (response.ok) {
                        const data = await response.json();
                        toast({
                          title: "Change History",
                          description: `${data.history.length} change${data.history.length !== 1 ? "s" : ""} recorded`,
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "History",
                        description: "Unable to load history",
                        variant: "destructive",
                      });
                    }
                  }}
                />
              );
            })}
          </div>
        )}


        {/* Add Beneficiary Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Beneficiary</DialogTitle>
              <DialogDescription>
                Add a person or nonprofit organization who should receive your assets
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-nonprofit"
                  checked={isNonprofit}
                  onCheckedChange={(checked) => setIsNonprofit(checked as boolean)}
                />
                <Label htmlFor="is-nonprofit" className="flex items-center gap-2 cursor-pointer">
                  <Heart className="w-4 h-4 text-chart-2" />
                  This is a nonprofit organization
                </Label>
              </div>

              {isNonprofit ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nonprofit-name">Organization Name *</Label>
                    <Input
                      id="nonprofit-name"
                      placeholder="GiveWell, Ethereum Foundation, etc."
                      value={nonprofitName}
                      onChange={(e) => setNonprofitName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nonprofit-ein">EIN (Tax ID)</Label>
                    <Input
                      id="nonprofit-ein"
                      placeholder="12-3456789"
                      value={nonprofitEIN}
                      onChange={(e) => setNonprofitEIN(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nonprofit-website">Website</Label>
                    <Input
                      id="nonprofit-website"
                      placeholder="https://example.org"
                      value={nonprofitWebsite}
                      onChange={(e) => setNonprofitWebsite(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      placeholder="+1 (555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="letter">Personal Letter to Beneficiary (Optional)</Label>
                <Textarea
                  id="letter"
                  placeholder="Write a personal message that will be delivered to this beneficiary when they receive the assets..."
                  value={letterToBeneficiary}
                  onChange={(e) => setLetterToBeneficiary(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  This letter will be securely stored and delivered to the beneficiary along with their allocated assets.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button
                onClick={confirmAdd}
                disabled={processing || (isNonprofit ? !nonprofitName : (!name || !email))}
              >
                {processing ? "Adding..." : "Add Beneficiary"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Beneficiary Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Beneficiary</DialogTitle>
              <DialogDescription>
                Update beneficiary information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-is-nonprofit"
                  checked={isNonprofit}
                  onCheckedChange={(checked) => setIsNonprofit(checked as boolean)}
                />
                <Label htmlFor="edit-is-nonprofit" className="flex items-center gap-2 cursor-pointer">
                  <Heart className="w-4 h-4 text-chart-2" />
                  This is a nonprofit organization
                </Label>
              </div>

              {isNonprofit ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-nonprofit-name">Organization Name *</Label>
                    <Input
                      id="edit-nonprofit-name"
                      value={nonprofitName}
                      onChange={(e) => setNonprofitName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-nonprofit-ein">EIN (Tax ID)</Label>
                    <Input
                      id="edit-nonprofit-ein"
                      value={nonprofitEIN}
                      onChange={(e) => setNonprofitEIN(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-nonprofit-website">Website</Label>
                    <Input
                      id="edit-nonprofit-website"
                      value={nonprofitWebsite}
                      onChange={(e) => setNonprofitWebsite(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Contact Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name *</Label>
                    <Input
                      id="edit-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone (Optional)</Label>
                    <Input
                      id="edit-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="edit-letter">Personal Letter to Beneficiary (Optional)</Label>
                <Textarea
                  id="edit-letter"
                  placeholder="Write a personal message that will be delivered to this beneficiary when they receive the assets..."
                  value={letterToBeneficiary}
                  onChange={(e) => setLetterToBeneficiary(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  This letter will be securely stored and delivered to the beneficiary along with their allocated assets.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button
                onClick={confirmEdit}
                disabled={processing || (isNonprofit ? !nonprofitName : (!name || !email))}
              >
                {processing ? "Updating..." : "Update Beneficiary"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Letter Dialog */}
        <Dialog open={letterDialogOpen} onOpenChange={setLetterDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Personal Letter to {selectedBeneficiary?.name}
              </DialogTitle>
              <DialogDescription>
                Write a personal message that will be securely delivered to this beneficiary 
                when they receive their allocated assets. This is your opportunity to leave 
                a final message, instructions, or personal note.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                placeholder="Dear [Beneficiary Name],&#10;&#10;I want you to know that...&#10;&#10;With love,&#10;[Your Name]"
                value={letterToBeneficiary}
                onChange={(e) => setLetterToBeneficiary(e.target.value)}
                rows={12}
                className="resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                💡 Tip: Include instructions, account information, or a personal message. 
                This letter is encrypted and will only be revealed during the vault recovery process.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLetterDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveLetter} disabled={processing}>
                {processing ? "Saving..." : "Save Letter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Asset Allocation Dialog */}
        <Dialog open={allocationDialogOpen} onOpenChange={setAllocationDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Allocate Assets to {selectedBeneficiary?.name}</DialogTitle>
              <DialogDescription>
                Select which crypto assets and NFTs should be allocated to this beneficiary
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {loadingAssets ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full bg-slate-800/50" />
                  <Skeleton className="h-16 w-full bg-slate-800/50" />
                </div>
              ) : availableAssets.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No assets available</p>
                  <p className="text-xs mt-1">Connect your wallet to see your crypto assets</p>
                </div>
              ) : (
                <>
                  {/* Chain Filter */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-slate-400">Filter by chain:</span>
                    {Object.values(SUPPORTED_CHAINS).map((chain) => {
                      const isSelected = selectedChains.includes(chain.id);
                      return (
                        <Button
                          key={chain.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedChains(selectedChains.filter((id) => id !== chain.id));
                            } else {
                              setSelectedChains([...selectedChains, chain.id]);
                            }
                          }}
                        >
                          {chain.name}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Tokens */}
                  {availableAssets.filter((a) => a.type === "token").length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                        <Coins className="w-4 h-4" />
                        Tokens
                      </h4>
                      <div className="grid gap-3">
                        {availableAssets
                          .filter((a): a is TokenAsset => a.type === "token")
                          .map((token) => {
                            const assetId = `${token.chainId}-${token.address}`;
                            const isAllocated = allocatedAssetIds.includes(assetId);
                            
                            return (
                              <div
                                key={assetId}
                                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                                  isAllocated
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                }`}
                                onClick={() => toggleAssetAllocation(selectedBeneficiary.id, assetId)}
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <Checkbox checked={isAllocated} disabled />
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                                    {token.symbol.slice(0, 2)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-white">{token.symbol}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {token.chainName}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-slate-400">{token.name}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-white">{token.balanceFormatted}</p>
                                  {token.valueUsd && (
                                    <p className="text-xs text-slate-400">
                                      ${token.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* NFTs */}
                  {availableAssets.filter((a) => a.type === "nft").length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        NFTs
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        {availableAssets
                          .filter((a): a is NFTAsset => a.type === "nft")
                          .map((nft) => {
                            const assetId = `${nft.chainId}-${nft.contractAddress}-${nft.tokenId}`;
                            const isAllocated = allocatedAssetIds.includes(assetId);
                            
                            return (
                              <div
                                key={assetId}
                                className={`relative border rounded-lg overflow-hidden cursor-pointer transition-colors ${
                                  isAllocated
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                }`}
                                onClick={() => toggleAssetAllocation(selectedBeneficiary.id, assetId)}
                              >
                                <div className="aspect-square relative">
                                  {nft.image ? (
                                    <img
                                      src={nft.image}
                                      alt={nft.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23334155' width='100' height='100'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%2394a3b8' font-size='12'%3ENFT%3C/text%3E%3C/svg%3E";
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 text-xs">
                                      No Image
                                    </div>
                                  )}
                                  <div className="absolute top-2 right-2">
                                    <Checkbox checked={isAllocated} disabled />
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-900/50">
                                  <p className="text-sm font-medium text-white truncate">{nft.name}</p>
                                  <p className="text-xs text-slate-400 truncate">{nft.collectionName || nft.contractAddress.slice(0, 6)}</p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                      
                      {/* Total allocated summary */}
                      {allocatedAssetIds.length > 0 && (
                        <div className="mt-4 p-4 rounded-lg bg-slate-800/30 border border-primary/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-slate-300">Total Allocated:</span>
                            <span className="text-lg font-bold text-primary">
                              $
                              {allocatedAssetIds
                                .map((id) => {
                                  const asset = availableAssets.find(
                                    (a) => {
                                      if (a.type === "token") {
                                        return `${a.chainId}-${a.address}` === id;
                                      } else {
                                        return `${a.chainId}-${a.contractAddress}-${a.tokenId}` === id;
                                      }
                                    }
                                  );
                                  if (asset && asset.type === "token") {
                                    return asset.valueUsd || 0;
                                  }
                                  return 0;
                                })
                                .reduce((sum, val) => sum + val, 0)
                                .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {allocatedAssetIds.length} asset{allocatedAssetIds.length !== 1 ? "s" : ""} selected
                          </div>
                        </div>
                      )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAllocationDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmAssetAllocation} disabled={processing}>
                {processing ? "Saving..." : "Save Allocation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Beneficiary Dialog */}
        <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Beneficiary</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {selectedBeneficiary?.name} as a beneficiary? 
                Any allocated assets will be released and can be reassigned.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmRemove}
                disabled={processing}
              >
                {processing ? "Removing..." : "Remove Beneficiary"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Info Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>About Beneficiaries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Beneficiaries are the individuals or organizations who will receive your crypto assets and NFTs 
              after the vault recovery process is triggered.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Asset Allocation</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Assign specific tokens to beneficiaries</li>
                  <li>• Assign specific NFTs to beneficiaries</li>
                  <li>• Split assets across multiple beneficiaries</li>
                  <li>• Update allocations anytime</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Nonprofit Organizations</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Donate assets to nonprofits</li>
                  <li>• Specify organization name and EIN</li>
                  <li>• Allocate assets for charitable giving</li>
                  <li>• Tax-deductible inheritance planning</li>
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

