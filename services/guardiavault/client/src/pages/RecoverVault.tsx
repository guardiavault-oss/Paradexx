import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle2, Key, AlertCircle, Copy, Eye, EyeOff, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { EnhancedAppSidebar } from "@/components/EnhancedAppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useVaults } from "@/hooks/useVaults";
import { Badge } from "@/components/ui/badge";
import "../design-system.css";

export default function RecoverVault() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: vaultsData } = useVaults();
  const vault = vaultsData?.vaults?.[0]; // Get first vault for scheme detection
  const [reconstructedSecret, setReconstructedSecret] = useState<string>("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [detectedScheme, setDetectedScheme] = useState<'2-of-3' | '3-of-5'>('2-of-3');

  // Detect scheme from vault or default to 2-of-3
  const scheme = vault?.fragmentScheme === '3-of-5' ? '3-of-5' : '2-of-3';
  const threshold = scheme === '3-of-5' ? 3 : 2;
  const totalFragments = scheme === '3-of-5' ? 5 : 3;
  
  // Initialize fragments array based on scheme
  const initialFragments = scheme === '3-of-5' ? ["", "", "", "", ""] : ["", "", ""];
  const [fragments, setFragments] = useState<string[]>(initialFragments);
  
  const filledFragments = fragments.filter((f) => f.trim() !== "").length;
  const progress = (filledFragments / threshold) * 100;
  
  // Update fragments array when scheme changes
  useEffect(() => {
    if (scheme === '3-of-5' && fragments.length < 5) {
      setFragments([...fragments, ...Array(5 - fragments.length).fill("")]);
    } else if (scheme === '2-of-3' && fragments.length > 3) {
      setFragments(fragments.slice(0, 3));
    }
  }, [scheme]);

  const handleFragmentChange = (index: number, value: string) => {
    const newFragments = [...fragments];
    newFragments[index] = value;
    setFragments(newFragments);
  };

  const addFragmentSlot = () => {
    if (fragments.length < totalFragments) {
      setFragments([...fragments, ""]);
    }
  };

  const removeFragmentSlot = (index: number) => {
    if (fragments.length > threshold) {
      setFragments(fragments.filter((_, i) => i !== index));
    }
  };

  const handleRecover = async () => {
    const validFragments = fragments.filter((f) => f.trim() !== "");

    if (validFragments.length < threshold) {
      toast({
        title: "Insufficient Fragments",
        description: `You need at least ${threshold} fragments to recover the secret.`,
        variant: "destructive",
      });
      return;
    }

    setIsRecovering(true);

    try {
      const response = await fetch("/api/vaults/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fragments: validFragments,
          vaultId: vault?.id // Pass vault ID for scheme detection
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reconstruct secret");
      }

      const { secret, scheme: responseScheme } = await response.json();
      setReconstructedSecret(secret);
      if (responseScheme) {
        setDetectedScheme(responseScheme);
      }

      toast({
        title: "Recovery Successful",
        description: "The secret has been reconstructed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Recovery Failed",
        description: error.message || "Failed to reconstruct the secret. Please verify your fragments.",
        variant: "destructive",
      });
    } finally {
      setIsRecovering(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(reconstructedSecret);
    toast({
      title: "Copied",
      description: "Secret copied to clipboard",
    });
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
                background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
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

          <div className="relative z-10 container max-w-4xl mx-auto px-6 py-8">
            {/* Premium Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <button
                onClick={() => setLocation("/dashboard")}
                className="mb-6 glass px-4 py-2 rounded-xl flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="mb-6">
                <h1 className="text-5xl font-bold display-font heading-glow mb-3 flex items-center gap-3">
                  <Key className="w-10 h-10 text-purple-400" />
                  Recover Vault Secret
                </h1>
                <p className="text-slate-400 text-lg">
                  Collect fragments from guardians to reconstruct the recovery phrase
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-400">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Recovery Progress</h3>
                </div>
                <span className="text-sm text-slate-400 font-medium">
                  {filledFragments} of {threshold} required
                </span>
              </div>
              <Progress value={progress} className="mb-3 h-3" />
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  You need at least {threshold} fragments from different guardians ({scheme} scheme)
                </p>
                {scheme === '3-of-5' && (
                  <Badge variant="outline" className="bg-orange-500/10 border-orange-500/20 text-orange-400 text-xs">
                    Legacy Vault
                  </Badge>
                )}
              </div>
            </motion.div>

            {!reconstructedSecret ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-6 border border-orange-500/20 bg-orange-500/5"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-white mb-2">Important Instructions</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        Contact each guardian separately and ask them to provide their encrypted fragment and passphrase.
                        Each guardian should decrypt their fragment using their unique passphrase before providing it to you.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {fragments.map((fragment, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    whileHover={{ y: -2 }}
                  >
                    <Card className="glass-card border-white/10">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between text-white">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-400">
                              <Key className="w-4 h-4 text-white" />
                            </div>
                            Fragment {index + 1}
                            {fragment.trim() !== "" && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            )}
                          </div>
                          {fragments.length > threshold && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFragmentSlot(index)}
                              className="text-slate-400 hover:text-white"
                              data-testid={`button-remove-fragment-${index}`}
                            >
                              Remove
                            </Button>
                          )}
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Enter the decrypted fragment from guardian {index + 1}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Label htmlFor={`fragment-${index}`} className="text-white mb-2">Fragment Data</Label>
                        <Input
                          id={`fragment-${index}`}
                          type="text"
                          placeholder="Enter fragment hex string..."
                          value={fragment}
                          onChange={(e) => handleFragmentChange(index, e.target.value)}
                          className="font-mono text-sm bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-primary focus-visible:border-primary/50"
                          data-testid={`input-fragment-${index}`}
                          autoComplete="off"
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {fragments.length < totalFragments && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addFragmentSlot}
                    className="w-full btn-premium btn-glass"
                    data-testid="button-add-fragment"
                  >
                    Add Another Fragment Slot
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRecover}
                  disabled={filledFragments < threshold || isRecovering}
                  className="w-full btn-premium btn-primary text-lg py-6"
                  data-testid="button-recover"
                >
                  {isRecovering ? "Reconstructing..." : "Reconstruct Secret"}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 border border-emerald-500/20 bg-emerald-500/5"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-emerald-400 mb-1">Secret Successfully Reconstructed!</h4>
                      <p className="text-slate-400 text-sm">
                        Handle with extreme care. Store it securely and never share it.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-card"
                >
                  <CardHeader>
                    <CardTitle className="text-white display-font">Recovered Secret</CardTitle>
                    <CardDescription className="text-slate-400">
                      This is your reconstructed recovery phrase. Store it securely and never share it.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <div className="p-4 bg-slate-900/50 border border-white/10 rounded-xl font-mono text-sm break-all text-white">
                        {isRevealed ? reconstructedSecret : "•".repeat(reconstructedSecret.length)}
                      </div>
                      <div className="absolute top-3 right-3 flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsRevealed(!isRevealed)}
                          className="hover:bg-white/10 text-slate-400 hover:text-white"
                          data-testid="button-toggle-reveal"
                        >
                          {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={copyToClipboard}
                          className="hover:bg-white/10 text-slate-400 hover:text-white"
                          data-testid="button-copy"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="glass p-4 rounded-xl border border-red-500/20 bg-red-500/5"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-red-400 mb-1">Security Warning</h4>
                          <p className="text-slate-400 text-sm">
                            This recovery phrase gives complete access to the wallet.
                            Write it down on paper, store it in a secure location, and delete it from this device immediately
                            after saving.
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <div className="flex gap-3">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                        <Button 
                          variant="outline"
                          onClick={() => window.print()} 
                          className="w-full btn-premium btn-glass"
                          data-testid="button-print"
                        >
                          Print for Safekeeping
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setReconstructedSecret("");
                            setFragments(["", "", ""]);
                            toast({
                              title: "Secret Cleared",
                              description: "The secret has been removed from memory",
                            });
                          }}
                          className="w-full"
                          data-testid="button-clear"
                        >
                          Clear Secret
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
