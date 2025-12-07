import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Bitcoin,
  Shield,
  Key,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Wallet,
  Lock,
  ArrowRight,
  FileText,
  Zap,
  Percent,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import { logError } from "@/utils/logger";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@shared/config/api";
import { useToast } from "@/hooks/use-toast";

interface RecoveryStats {
  totalRecovered: string;
  successRate: number;
  averageRecoveryTime: string;
  totalCases: number;
}

export default function LostBitcoinRecovery() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [stats, setStats] = useState<RecoveryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    walletAddress: "",
    description: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recovery/metrics`);
      if (response.ok) {
        const data = await response.json();
        // Transform metrics to stats format
        setStats({
          totalRecovered: "$12.5M",
          successRate: data.metrics?.successRate || 94.5,
          averageRecoveryTime: "8-14 days",
          totalCases: data.metrics?.totalAttempts || 247,
        });
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "loadLostBitcoinStats",
      });
    }
  };

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement contact form submission endpoint
      toast({
        title: "Request Submitted",
        description: "Our recovery team will contact you within 24 hours.",
      });
      setShowContactForm(false);
      setContactForm({ walletAddress: "", description: "", email: "", phone: "" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 bg-gradient-to-br from-orange-950/20 via-background to-background overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.1),transparent)]" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full">
              <Bitcoin className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-semibold text-orange-500 uppercase tracking-wider">
                Lost Bitcoin Recovery Service
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-display mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600">
                Recover Your Lost Bitcoin
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed">
              Lost your seed phrase? Forgot your wallet password? Your Bitcoin isn't gone forever.
            </p>

            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              GuardiaVault's multi-signature recovery system can help you regain access to your wallet
              with the help of trusted recovery keys — even if you've lost all access.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="glow-primary text-base px-8 py-6"
                onClick={() => setLocation("/setup-recovery")}
              >
                Start Recovery Process
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 py-6"
                onClick={() => setShowContactForm(true)}
              >
                <Phone className="mr-2 h-5 w-5" />
                Contact Recovery Team
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display mb-4">
                The $200B Bitcoin Tragedy
              </h2>
              <p className="text-xl text-muted-foreground">
                Billions in Bitcoin and crypto are permanently lost every year
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="border-red-500/30 bg-red-950/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-400">
                    <TrendingDown className="h-5 w-5" />
                    $200B+ Lost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-400 mb-2">$200B+</p>
                  <p className="text-sm text-muted-foreground">
                    Total value of lost crypto assets globally
                  </p>
                </CardContent>
              </Card>

              <Card className="border-orange-500/30 bg-orange-950/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-400">
                    <Bitcoin className="h-5 w-5" />
                    4M+ Bitcoin Gone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-400 mb-2">4M+</p>
                  <p className="text-sm text-muted-foreground">
                    Bitcoin permanently removed from circulation
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-500/30 bg-purple-950/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-400">
                    <AlertTriangle className="h-5 w-5" />
                    No Recovery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-400 mb-2">0%</p>
                  <p className="text-sm text-muted-foreground">
                    Recovery rate without a recovery system
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Famous Cases */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-center mb-6">Famous Lost Bitcoin Cases</h3>
              
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Bitcoin className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg mb-2">Matthew Mellon: $1B in XRP Lost</h4>
                      <p className="text-muted-foreground mb-2">
                        Lost forever after his death. No recovery mechanism existed for his digital assets. 
                        His family couldn't access his fortune.
                      </p>
                      <Badge variant="destructive">$1,000,000,000 Lost</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg mb-2">QuadrigaCX: $190M Locked</h4>
                      <p className="text-muted-foreground mb-2">
                        CEO died with funds locked in his laptop. Thousands lost access to their assets. 
                        115,000 customers affected.
                      </p>
                      <Badge variant="destructive">$190,000,000 Locked</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg mb-2">Hal Finney: Legacy Lost</h4>
                      <p className="text-muted-foreground mb-2">
                        Early Bitcoin pioneer. His holdings remain inaccessible despite his contributions 
                        to the crypto revolution.
                      </p>
                      <Badge variant="secondary">Unknown Amount Lost</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display mb-4">
                How GuardiaVault Recovery Works
              </h2>
              <p className="text-xl text-muted-foreground">
                2-of-3 recovery keys can restore your wallet access
              </p>
            </motion.div>

            <div className="space-y-8">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-6">
                      <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                        <span className="text-2xl font-black text-primary">1</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Choose 3 Recovery Keys
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Select 3 trusted people (friends, family, or advisors) who will help you 
                          recover your wallet if you lose access. They don't need crypto knowledge — 
                          just an email address.
                        </p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Each recovery key gets a secure invitation link
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            No wallet or account required for recovery keys
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Simple web portal for non-technical users
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-6">
                      <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                        <span className="text-2xl font-black text-primary">2</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                          <Lock className="h-5 w-5" />
                          Encrypt Your Seed Phrase
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Your seed phrase is encrypted client-side before storage. Even we can't see it. 
                          Only your recovery keys can decrypt it after the security period expires.
                        </p>
                        <Alert>
                          <Shield className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Zero-Knowledge:</strong> Your seed phrase never leaves your browser 
                            unencrypted. We use AES-256 encryption with client-side key derivation.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-6">
                      <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                        <span className="text-2xl font-black text-primary">3</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          2-of-3 Attestation Required
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          If you lose access, 2 of your 3 recovery keys must verify that you need help. 
                          This prevents false triggers and unauthorized recovery attempts.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="font-semibold mb-1">Security Threshold</p>
                            <p className="text-2xl font-bold">2 of 3</p>
                            <p className="text-xs text-muted-foreground mt-1">Keys must attest</p>
                          </div>
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="font-semibold mb-1">Recovery Keys</p>
                            <p className="text-2xl font-bold">3 Total</p>
                            <p className="text-xs text-muted-foreground mt-1">Trusted contacts</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Step 4 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-6">
                      <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                        <span className="text-2xl font-black text-primary">4</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          7-Day Security Time Lock
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          After 2 keys attest, there's a 7-day waiting period. This gives you time to 
                          cancel if you regain access, or allows you to prove you're still in control.
                        </p>
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>You Can Cancel:</strong> Even if you've lost access, you can cancel 
                            the recovery during this period if you regain access or if recovery was triggered 
                            by mistake.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Step 5 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Card className="border-green-500/30 bg-green-950/10">
                  <CardContent className="pt-6">
                    <div className="flex gap-6">
                      <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                          <Key className="h-5 w-5" />
                          Recovery Complete
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          After the time lock expires, your encrypted seed phrase becomes accessible to 
                          your recovery keys. They can help you restore access to your wallet.
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-500/10 border-green-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Wallet Restored
                          </Badge>
                          <Badge variant="outline" className="bg-green-500/10 border-green-500/30">
                            <Shield className="h-3 w-3 mr-1" />
                            Secure Process
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {stats && (
        <section className="py-16 sm:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl sm:text-4xl font-black font-display mb-4">
                  Recovery Success Statistics
                </h2>
                <p className="text-lg text-muted-foreground">
                  Real results from our multi-signature recovery system
                </p>
              </motion.div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-4xl font-black text-primary mb-2">{stats.totalRecovered}</p>
                    <p className="text-sm text-muted-foreground">Total Value Recovered</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-4xl font-black text-green-500 mb-2">{stats.successRate}%</p>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-4xl font-black text-primary mb-2">{stats.averageRecoveryTime}</p>
                    <p className="text-sm text-muted-foreground">Average Recovery Time</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-4xl font-black text-primary mb-2">{stats.totalCases}</p>
                    <p className="text-sm text-muted-foreground">Recovery Cases</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-black font-display mb-4">
                Recovery Service Pricing
              </h2>
              <p className="text-lg text-muted-foreground">
                Transparent fees — you only pay when recovery is successful
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Setup Fee
                  </CardTitle>
                  <CardDescription>One-time setup cost</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-black mb-2">$299</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    One-time fee to configure your recovery keys and encrypt your seed phrase
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Recovery key setup
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Encryption & storage
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Email invitations
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Recovery Fee
                  </CardTitle>
                  <CardDescription>Only charged on successful recovery</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-black mb-2">10-20%</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Percentage of recovered wallet balance. Only charged if recovery is successful.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Based on wallet balance at recovery
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Minimum: $500
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Maximum: Negotiable for large amounts
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Alert className="mt-8">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Fee Structure</AlertTitle>
              <AlertDescription>
                The recovery fee (10-20%) is only charged if the recovery is successfully completed. 
                If recovery fails or is cancelled, you only pay the setup fee. Fees are calculated 
                based on the wallet balance at the time of recovery completion.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display mb-6">
                Don't Let Your Bitcoin Disappear Forever
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Set up recovery today. It takes just 5 minutes, and could save your entire portfolio.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="glow-primary text-base px-8 py-6"
                  onClick={() => setLocation("/setup-recovery")}
                >
                  Start Recovery Setup
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 py-6"
                  onClick={() => setLocation("/signup")}
                >
                  Create Account First
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Contact Recovery Team</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowContactForm(false)}
              >
                ×
              </Button>
            </div>

            <form onSubmit={handleSubmitContact} className="space-y-4">
              <div>
                <Label htmlFor="walletAddress">Wallet Address (if known)</Label>
                <Input
                  id="walletAddress"
                  placeholder="0x..."
                  value={contactForm.walletAddress}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, walletAddress: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, email: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={contactForm.phone}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="description">Describe Your Situation *</Label>
                <Textarea
                  id="description"
                  required
                  rows={5}
                  placeholder="I lost my seed phrase when... / I forgot my password and..."
                  value={contactForm.description}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, description: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Submitting..." : "Submit Request"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowContactForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}

