import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Wallet, ArrowRight, Loader2 } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { logError } from "@/utils/logger";

export default function CreateVault() {
  const [, setLocation] = useLocation();
  const { walletAddress, isWalletConnected, connectWallet } = useWallet();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreateVault = async () => {
    if (!isWalletConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a vault.",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid deposit amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);

      // Create vault logic would go here
      // This is a placeholder for the actual vault creation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Vault created successfully",
        description: "Your GuardiaVault has been created. Set up recovery next.",
      });

      // Redirect to setup recovery
      setLocation("/setup-recovery");
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "createVault",
      });
      toast({
        title: "Failed to create vault",
        description: "An error occurred while creating your vault. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950">
      <Navigation />

      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Create Your GuardiaVault
            </h1>
            <p className="text-lg text-slate-400">
              Secure your crypto assets and start earning yield while protecting your digital legacy
            </p>
          </div>

          {/* Main Card */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Initial Deposit</CardTitle>
              <CardDescription>
                Deposit assets into your vault to activate protection and start earning 5-8% APY
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Wallet Connection */}
              {!isWalletConnected ? (
                <div className="text-center py-8">
                  <Wallet className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Connect Your Wallet
                  </h3>
                  <p className="text-slate-400 mb-6">
                    Connect your wallet to create a GuardiaVault
                  </p>
                  <Button
                    onClick={connectWallet}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                  >
                    Connect Wallet
                  </Button>
                </div>
              ) : (
                <>
                  {/* Connected Wallet */}
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-green-400" />
                      <div className="flex-1">
                        <p className="text-sm text-slate-400">Connected Wallet</p>
                        <p className="text-white font-mono">
                          {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-white">
                      Deposit Amount (ETH)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    <p className="text-sm text-slate-400">
                      Minimum deposit: 0.01 ETH
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 pt-4">
                    <h4 className="text-sm font-semibold text-white">What you'll get:</h4>
                    <div className="space-y-2">
                      {[
                        "5-8% APY on deposited assets",
                        "Free inheritance protection",
                        "Multi-signature recovery system",
                        "Biometric check-in security",
                      ].map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          <span className="text-slate-300 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Create Button */}
                  <Button
                    onClick={handleCreateVault}
                    disabled={creating || !amount || parseFloat(amount) <= 0}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
                    size="lg"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Vault...
                      </>
                    ) : (
                      <>
                        Create Vault
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Help Text */}
          <p className="text-center text-slate-400 mt-6">
            Need help? Visit our{" "}
            <a href="/dashboard/support" className="text-blue-400 hover:underline">
              support center
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
