import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Percent,
  Clock,
  Shield,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { logError } from "@/utils/logger";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { EnhancedAppSidebar } from "@/components/EnhancedAppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIOptimizer from "@/components/dashboard/AIOptimizer";
import StrategyOptimizer from "@/components/dashboard/StrategyOptimizer";
import YieldLeaderboard from "@/components/dashboard/YieldLeaderboard";
import YieldChallenges from "@/components/dashboard/YieldChallenges";
import "../design-system.css";

interface YieldVault {
  id: number;
  asset: string;
  principal: string;
  yieldAccumulated: string;
  totalValue: string;
  apy: number;
  stakingProtocol: string;
  createdAt: number;
}

export default function YieldVaults() {
  const [, setLocation] = useLocation();
  const { walletAddress, isWalletConnected } = useWallet();
  const { toast } = useToast();
  const [vaults, setVaults] = useState<YieldVault[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [asset, setAsset] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [stakingProtocol, setStakingProtocol] = useState("lido");

  const stakingProtocols = [
    // Lending Protocols
    { value: "aave", label: "Aave Lending", apy: 3.8, category: "Lending", description: "Earn interest by lending crypto assets" },
    { value: "compound", label: "Compound Lending", apy: 3.5, category: "Lending", description: "Decentralized lending and borrowing" },
    
    // DEX / Trading Yield
    { value: "uniswap", label: "Uniswap V3 LP", apy: 8.5, category: "DEX Yield", description: "Provide liquidity and earn trading fees" },
    { value: "curve", label: "Curve Finance", apy: 7.2, category: "DEX Yield", description: "Stablecoin liquidity pools with low slippage" },
    { value: "balancer", label: "Balancer Pools", apy: 6.8, category: "DEX Yield", description: "Multi-token automated portfolio manager" },
    
    // Staking Protocols
    { value: "rocketpool", label: "Rocket Pool", apy: 4.5, category: "Staking", description: "Decentralized Ethereum staking" },
    { value: "lido", label: "Lido Staking", apy: 4.2, category: "Staking", description: "Liquid staking for ETH" },
    { value: "frax", label: "Frax Staking", apy: 5.1, category: "Staking", description: "Frax ETH staking protocol" },
  ];

  const selectedProtocol = stakingProtocols.find((p) => p.value === stakingProtocol);

  useEffect(() => {
    // Fetch user's yield vaults
    fetchYieldVaults();
  }, [walletAddress]);

  const fetchYieldVaults = async () => {
    if (!walletAddress) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/yield-vaults`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch yield vaults");
      }
      
      const data = await response.json();
      setVaults(data.vaults || []);
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "fetchYieldVaults",
      });
      toast({
        title: "Error",
        description: "Failed to load yield vaults",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVault = async () => {
    if (!isWalletConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to create a yield vault",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);

      // Create yield vault via backend API
      const response = await fetch(`/api/yield-vaults`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          guardiaVaultId: 0, // In production, get from user's vault
          asset,
          amount,
          stakingProtocol,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create yield vault");
      }

      const data = await response.json();

      toast({
        title: "Yield Vault Created!",
        description: `Staked ${amount} ${asset} in ${selectedProtocol?.label}`,
      });

      // Reset form
      setAmount("");
      await fetchYieldVaults();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create yield vault",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const calculateEstimatedYield = () => {
    if (!amount || !selectedProtocol) return "0";
    const principal = parseFloat(amount);
    const yearlyYield = principal * (selectedProtocol.apy / 100);
    const fee = yearlyYield * 0.01; // 1% performance fee
    return (yearlyYield - fee).toFixed(2);
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
              className="absolute w-96 h-96 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, transparent 70%)",
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
                background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
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
              <button
                onClick={() => setLocation("/dashboard")}
                className="mb-6 glass px-4 py-2 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-5xl font-bold display-font heading-glow mb-3 flex items-center gap-3">
                    <TrendingUp className="w-10 h-10 text-emerald-400" />
                    Earn 3-8% APY on Your Crypto
                  </h1>
                  <p className="text-slate-400 text-lg">
                    Diversify across lending (Aave), DEX yield (Uniswap), and staking (Rocket Pool). Auto-compound your assets with free inheritance protection included.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Create New Vault */}
            <Card className="glass-card mb-8">
              <CardHeader>
                <CardTitle>Create Yield Vault</CardTitle>
                <CardDescription>
                  Deposit funds to earn yield. 1% performance fee on all yield earned.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Asset</Label>
                    <Select value={asset} onValueChange={setAsset}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDC">USDC</SelectItem>
                        <SelectItem value="DAI">DAI</SelectItem>
                        <SelectItem value="USDT">USDT</SelectItem>
                        <SelectItem value="WETH">WETH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      placeholder="1000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Protocol Strategy</Label>
                    <Select value={stakingProtocol} onValueChange={setStakingProtocol}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {/* Lending Protocols */}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Lending Protocols</div>
                        {stakingProtocols.filter(p => p.category === "Lending").map((protocol) => (
                          <SelectItem key={protocol.value} value={protocol.value}>
                            <div className="flex flex-col">
                              <div className="font-medium">{protocol.label} - {protocol.apy}% APY</div>
                              <div className="text-xs text-muted-foreground">{protocol.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                        
                        {/* DEX Yield */}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">DEX / Trading Yield</div>
                        {stakingProtocols.filter(p => p.category === "DEX Yield").map((protocol) => (
                          <SelectItem key={protocol.value} value={protocol.value}>
                            <div className="flex flex-col">
                              <div className="font-medium">{protocol.label} - {protocol.apy}% APY</div>
                              <div className="text-xs text-muted-foreground">{protocol.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                        
                        {/* Staking Protocols */}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Staking Protocols</div>
                        {stakingProtocols.filter(p => p.category === "Staking").map((protocol) => (
                          <SelectItem key={protocol.value} value={protocol.value}>
                            <div className="flex flex-col">
                              <div className="font-medium">{protocol.label} - {protocol.apy}% APY</div>
                              <div className="text-xs text-muted-foreground">{protocol.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedProtocol && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <Badge variant="outline" className="mr-2">{selectedProtocol.category}</Badge>
                        {selectedProtocol.description}
                      </p>
                    )}
                  </div>
                </div>

                {amount && selectedProtocol && (
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertTitle>Estimated Annual Yield</AlertTitle>
                    <AlertDescription>
                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between">
                          <span>Principal:</span>
                          <span className="font-semibold">{amount} {asset}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated APY:</span>
                          <span className="font-semibold">{selectedProtocol.apy}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Annual Yield:</span>
                          <span className="font-semibold">
                            ${calculateEstimatedYield()} ({selectedProtocol.apy}%)
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Performance Fee (1%):</span>
                          <span>
                            ${((parseFloat(calculateEstimatedYield()) / 0.99) * 0.01).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-primary font-semibold pt-2 border-t">
                          <span>Net Annual Yield:</span>
                          <span>${calculateEstimatedYield()}</span>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleCreateVault}
                  disabled={!isWalletConnected || creating || !amount}
                  className="w-full"
                  size="lg"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Vault...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Create Yield Vault
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Tabs for Yield Tools */}
            <Tabs defaultValue="vaults" className="w-full mb-8">
              <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-6">
                <TabsTrigger value="vaults">Vaults</TabsTrigger>
                <TabsTrigger value="optimizer">AI Optimizer</TabsTrigger>
                <TabsTrigger value="strategy">Strategy</TabsTrigger>
                <TabsTrigger value="challenges">Challenges</TabsTrigger>
              </TabsList>

              <TabsContent value="vaults" className="space-y-6">
                {/* Existing Vaults */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">Your Yield Vaults</h2>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : vaults.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="py-12 text-center">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No Yield Vaults Yet</h3>
                    <p className="text-muted-foreground">
                      Create your first yield vault to start earning on your funds.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vaults.map((vault) => (
                    <Card key={vault.id} className="glass-card hover-elevate">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            Vault #{vault.id}
                          </CardTitle>
                          <Badge variant="secondary">{vault.asset}</Badge>
                        </div>
                        <CardDescription>
                          Staked in {vault.stakingProtocol}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-muted-foreground">Principal</Label>
                            <p className="text-xl font-bold">{vault.principal} {vault.asset}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Yield Earned</Label>
                            <p className="text-xl font-bold text-green-500">
                              +{vault.yieldAccumulated} {vault.asset}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Total Value</span>
                            <span className="text-2xl font-bold">
                              {vault.totalValue} {vault.asset}
                            </span>
                          </div>
                        </div>

                        {/* Performance Breakdown */}
                        <div className="pt-4 border-t space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Return on Investment</span>
                            <span className="font-semibold text-green-500">
                              {((parseFloat(vault.yieldAccumulated) / parseFloat(vault.principal)) * 100).toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Performance Fee (1%)</span>
                            <span className="text-muted-foreground">
                              {(parseFloat(vault.yieldAccumulated) / 0.99 * 0.01).toFixed(4)} {vault.asset}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Days Active</span>
                            <span className="text-muted-foreground">
                              {Math.floor((Date.now() - vault.createdAt * 1000) / (1000 * 60 * 60 * 24))} days
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                          <Percent className="w-4 h-4" />
                          <span>APY: {vault.apy}%</span>
                          <Clock className="w-4 h-4 ml-4" />
                          <span>
                            Created: {new Date(vault.createdAt * 1000).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

                  {/* Info */}
                  <Card className="glass-card mt-8">
                    <CardHeader>
                      <CardTitle>How Yield Vaults Work</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>
                        <strong>Auto-Staking:</strong> Your funds are automatically staked in secure,
                        audited protocols (Lido, Aave, Compound).
                      </p>
                      <p>
                        <strong>Yield Tracking:</strong> We track principal and yield separately. You
                        always get your principal back, plus earned yield.
                      </p>
                      <p>
                        <strong>Performance Fee:</strong> We charge 1% of all yield earned as a
                        performance fee. This fee is competitive and only applies to earnings.
                      </p>
                      <p>
                        <strong>On Trigger:</strong> When your vault triggers (death/inactivity), funds
                        are automatically unstaked and returned to beneficiaries as principal + yield.
                      </p>
                    </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="optimizer">
                <AIOptimizer />
              </TabsContent>

              <TabsContent value="strategy">
                <StrategyOptimizer />
              </TabsContent>

              <TabsContent value="challenges">
                <div className="space-y-6">
                  <YieldChallenges />
                  <YieldLeaderboard />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

