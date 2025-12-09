import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { logError } from "@/utils/logger";
import {
  Shield,
  Check,
  TrendingUp,
  Lock,
  Clock,
  Users,
  FileText,
  Key,
  Sparkles,
  ArrowRight,
  Play,
  Award,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import "../design-system.css";

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [timeRemaining, setTimeRemaining] = useState(3600); // 1 hour in seconds

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const plans = [
    {
      name: "Starter",
      monthlyPrice: 49.99,
      annualPrice: null,
      tagline: "Never lose access again.",
      description: "Best for: Everyday crypto users",
      color: "emerald",
      features: [
        "2-of-3 Multi-Sig Recovery",
        "Guardian Portal (no signup needed)",
        "1 Wallet, 1 Beneficiary",
        "Basic Will Builder (visual UI)",
        "Email recovery alerts",
      ],
      cta: "Start Free Trial →",
      ctaSubtext: "Secure your wallet in minutes",
    },
    {
      name: "Vault Pro",
      monthlyPrice: 99.99,
      annualPrice: null,
      tagline: "Institutional-grade digital vaulting.",
      description: "Best for: Power users, DAOs, and estate attorneys",
      color: "purple",
      features: [
        "Everything in Starter, plus:",
        "Multi-wallet support (BTC, ETH, NFTs)",
        "Smart Will Builder (legal PDF + on-chain logic)",
        "Hardware key & Web3 signature support",
        "Priority recovery & concierge setup",
        "Earn 3–5% APY on staked vaults",
      ],
      cta: "Go Pro →",
      ctaSubtext: "Protect what you've built — forever.",
    },
    {
      name: "Guardian+",
      monthlyPrice: 249.99,
      annualPrice: null,
      tagline: "Peace of mind for you and your family.",
      description: "Most Popular 💫",
      color: "blue",
      isPopular: true,
      features: [
        "Everything in Vault Pro, plus:",
        "Automated Death Certificate Verification",
        "3 Guardians + 3 Beneficiaries",
        "SMS/Telegram notifications",
        "Biometric & 2FA login",
        "On-chain Will Execution",
      ],
      cta: "Upgrade Now →",
      ctaSubtext: "Your family will thank you later.",
    },
  ];

  const trustBoosters = [
    {
      icon: Shield,
      title: "Your data stays encrypted",
      text: "No KYC. No custody. You stay in control.",
    },
    {
      icon: Clock,
      title: "Set it up once, protected for life",
      text: "Update anytime — no lawyers, no paperwork.",
    },
    {
      icon: Lock,
      title: "Over $200B in crypto lost forever",
      text: "Don't let your legacy vanish — your family deserves continuity.",
    },
  ];

  const handleSelectPlan = (planName: string) => {
    try {
      const plan = plans.find((p) => p.name === planName);
      if (!plan) {
        toast({
          title: "Invalid Plan",
          description: "Please select a valid plan",
          variant: "destructive",
        });
        return;
      }

      // Navigate to checkout with plan
      setLocation(`/checkout?plan=${encodeURIComponent(planName)}`);
    } catch (error: any) {
      logError(error);
      toast({
        title: "Error",
        description: "Failed to navigate to checkout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSeeDemo = () => {
    toast({
      title: "Demo Coming Soon",
      description: "Interactive demo will launch next week!",
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Premium Mesh Gradient Background */}
      <div className="mesh-gradient" />
      <div className="noise-overlay" />

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold display-font heading-glow mb-4">
            Protect your crypto legacy — even if life takes a turn.
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-8">
            Your funds. Your rules. Your peace of mind.
          </p>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Secure your digital assets from loss, death, or forgetfulness.
            Whether it's your wallet, your family, or your DAO — we've got you covered.
          </p>
        </motion.div>

        {/* Countdown Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 glass-card p-4 border border-amber-500/30 bg-gradient-to-r from-amber-950/20 to-orange-950/20"
        >
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              Founders Plan
            </Badge>
            <span className="text-white font-semibold">40% off for first 100 users</span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-mono font-bold">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full">
            <Users className="w-5 h-5 text-emerald-400" />
            <span className="text-slate-300">
              Trusted by <span className="font-bold text-white">2,000+</span> crypto users
            </span>
          </div>
        </motion.div>

        {/* Demo Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-12"
        >
          <Button
            onClick={handleSeeDemo}
            variant="outline"
            size="lg"
            className="glass border-white/20 hover:bg-white/10"
          >
            <Play className="w-5 h-5 mr-2" />
            See Demo
            <span className="ml-2 text-xs text-slate-400">(90s interactive mockup)</span>
          </Button>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="relative"
            >
              <Card
                className={`glass-card p-8 h-full flex flex-col ${
                  plan.isPopular
                    ? "border-2 border-blue-500/50 shadow-lg shadow-blue-500/20 scale-105"
                    : ""
                }`}
              >
                {plan.isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white">
                    Most Popular 💫
                  </Badge>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-3xl font-bold text-white">{plan.name}</h3>
                    {plan.color === "emerald" && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        🟢
                      </Badge>
                    )}
                    {plan.color === "blue" && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        🔵
                      </Badge>
                    )}
                    {plan.color === "purple" && (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        🟣
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg text-slate-300 mb-1">{plan.tagline}</p>
                  <p className="text-sm text-slate-500">{plan.description}</p>
                </div>

                {/* Pricing */}
                <div className="mb-6">
                  {plan.monthlyPrice ? (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-white">${plan.monthlyPrice}</span>
                        <span className="text-slate-400">/month</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-2">
                        ≈ ${(plan.monthlyPrice * 12).toFixed(0)}/year
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-white">${plan.annualPrice}</span>
                        <span className="text-slate-400">/year</span>
                      </div>
                      {plan.annualPrice && (
                        <p className="text-sm text-slate-500 mt-2">
                          ≈ ${(plan.annualPrice / 12).toFixed(2)}/month
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  onClick={() => handleSelectPlan(plan.name)}
                  className={`w-full ${
                    plan.isPopular
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                      : "glass border-white/20 hover:bg-white/10"
                  }`}
                  size="lg"
                >
                  {plan.cta}
                </Button>
                <p className="text-xs text-center text-slate-500 mt-2">{plan.ctaSubtext}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Upsell Triggers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16 max-w-7xl mx-auto"
        >
          <Card className="glass-card p-6 border-emerald-500/20">
            <div className="flex items-start gap-4">
              <TrendingUp className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-white mb-2">Earn While You Wait</h4>
                <p className="text-sm text-slate-400 mb-3">
                  Your funds are earning 0%. Stake through GuardiaVault to earn 4% APY.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/dashboard/yield-vaults")}
                >
                  Enable Yield <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6 border-purple-500/20">
            <div className="flex items-start gap-4">
              <FileText className="w-8 h-8 text-purple-400 shrink-0" />
              <div>
                <h4 className="font-bold text-white mb-2">Legal Smart Will</h4>
                <p className="text-sm text-slate-400 mb-3">
                  Upgrade to include a real legal document recognized by your state.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectPlan("Vault Pro")}
                >
                  Upgrade to Pro <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6 border-blue-500/20">
            <div className="flex items-start gap-4">
              <Users className="w-8 h-8 text-blue-400 shrink-0" />
              <div>
                <h4 className="font-bold text-white mb-2">Add More Guardians</h4>
                <p className="text-sm text-slate-400 mb-3">
                  Strengthen your recovery system. Add more guardians for $5/month each.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/dashboard/guardians")}
                >
                  Manage Guardians <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Trust Boosters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Why GuardiaVault?</h2>
            <p className="text-slate-400">
              Don't let your legacy vanish — your family, friends, and DAOs deserve continuity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {trustBoosters.map((booster, index) => {
              const Icon = booster.icon;
              return (
                <Card key={index} className="glass-card p-6 text-center">
                  <Icon className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                  <h3 className="font-bold text-white mb-2">{booster.title}</h3>
                  <p className="text-sm text-slate-400">{booster.text}</p>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Guardian Portal Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-8 max-w-4xl mx-auto mb-16"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <Key className="w-6 h-6 text-emerald-400" />
                Guardian Portal
              </h3>
              <p className="text-slate-400">
                No signup needed — just verify email. Simple, secure, accessible.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-6 border border-white/10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-sm text-slate-300">
                  Guardian receives email invitation
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
                <span className="text-sm text-slate-300">
                  Click link, verify email (no account needed)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-400" />
                <span className="text-sm text-slate-300">
                  Access guardian dashboard with key fragment
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Fun Fact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center glass-card p-8 max-w-3xl mx-auto"
        >
          <Award className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-4">
            💡 Fun Fact
          </h3>
          <p className="text-lg text-slate-300">
            Over <span className="font-bold text-emerald-400">$200B in crypto</span> has been lost forever
            because people died without a plan.
          </p>
          <p className="text-slate-400 mt-4">
            Don't let your legacy vanish — your family, friends, and DAOs deserve continuity.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

