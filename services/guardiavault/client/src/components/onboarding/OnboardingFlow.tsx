import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, TrendingUp, Shield, Zap, CheckCircle } from "lucide-react";
import { logError } from "@/utils/logger";
import WizardProgress from "@/components/WizardProgress";
import { useAnnounce } from "@/utils/accessibility";
import { gsap } from "@/lib/gsap-optimized";

const PRIMARY_GOALS = [
  {
    id: "yield",
    title: "Earn Yield",
    description: "Maximize my crypto returns with 4-5% APY",
    icon: TrendingUp,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    id: "inheritance",
    title: "Inheritance Protection",
    description: "Secure my crypto for my family's future",
    icon: Shield,
    gradient: "from-blue-500 to-purple-500",
  },
  {
    id: "both",
    title: "Both",
    description: "Earn yield while protecting for inheritance",
    icon: Zap,
    gradient: "from-purple-500 via-pink-500 to-orange-500",
  },
];

const CRYPTO_EXPERIENCE = [
  {
    id: "beginner",
    title: "Beginner",
    description: "New to crypto, need guidance",
    features: ["Step-by-step tutorials", "Simple setup", "24/7 support"],
  },
  {
    id: "intermediate",
    title: "Intermediate",
    description: "Some experience with DeFi",
    features: ["Advanced options", "Strategy optimization", "Analytics"],
  },
  {
    id: "advanced",
    title: "Advanced",
    description: "Experienced DeFi user",
    features: ["Full control", "API access", "Custom strategies"],
  },
];

interface OnboardingData {
  primaryGoal: string | null;
  cryptoExperience: string | null;
}

export default function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    primaryGoal: null,
    cryptoExperience: null,
  });
  const [suggestedStrategy, setSuggestedStrategy] = useState<any>(null);
  const [, setLocation] = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  const announce = useAnnounce();

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem("onboarding_data");
    if (saved) {
      const parsed = JSON.parse(saved);
      setData(parsed);
      if (parsed.primaryGoal && parsed.cryptoExperience) {
        calculateSuggestedStrategy(parsed);
      }
    }
  }, []);

  // Animate step transitions
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [step]);

  const calculateSuggestedStrategy = (userData: OnboardingData) => {
    let strategy = {
      name: "Lido Staking",
      apy: 5.2,
      asset: "ETH",
      reason: "Best overall yield for beginners",
    };

    if (userData.primaryGoal === "yield") {
      strategy = {
        name: "Lido Staking",
        apy: 5.2,
        asset: "ETH",
        reason: "Highest APY at 5.2%",
      };
    } else if (userData.primaryGoal === "inheritance") {
      strategy = {
        name: "Aave USDC",
        apy: 4.1,
        asset: "USDC",
        reason: "Stable returns for inheritance protection",
      };
    } else if (userData.primaryGoal === "both") {
      if (userData.cryptoExperience === "beginner") {
        strategy = {
          name: "Aave USDC",
          apy: 4.1,
          asset: "USDC",
          reason: "Balanced yield and stability for beginners",
        };
      } else {
        strategy = {
          name: "Lido Staking",
          apy: 5.2,
          asset: "ETH",
          reason: "Maximum yield with inheritance protection",
        };
      }
    }

    setSuggestedStrategy(strategy);
  };

  const handleGoalSelect = (goalId: string) => {
    const newData = { ...data, primaryGoal: goalId };
    setData(newData);
    localStorage.setItem("onboarding_data", JSON.stringify(newData));
    announce(`Goal selected: ${PRIMARY_GOALS.find(g => g.id === goalId)?.title || goalId}`);
    setTimeout(() => setStep(2), 300);
  };

  const handleExperienceSelect = (experienceId: string) => {
    const newData = { ...data, cryptoExperience: experienceId };
    setData(newData);
    localStorage.setItem("onboarding_data", JSON.stringify(newData));
    calculateSuggestedStrategy(newData);
    announce(`Experience level selected: ${CRYPTO_EXPERIENCE.find(e => e.id === experienceId)?.title || experienceId}`);
    setTimeout(() => setStep(3), 300);
  };

  const handleComplete = async () => {
    try {
      // Save to backend
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          primaryGoal: data.primaryGoal,
          cryptoExperience: data.cryptoExperience,
          suggestedStrategy: suggestedStrategy,
        }),
      });

      // Mark onboarding complete
      localStorage.setItem("onboarding_complete", "true");
      
      // Redirect to dashboard
      setLocation("/dashboard");
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "OnboardingFlow_saveData",
      });
      // Still redirect even if API fails
      localStorage.setItem("onboarding_complete", "true");
      setLocation("/dashboard");
    }
  };

  const onboardingSteps = [
    { id: 1, title: "Primary Goal", description: "Choose your main objective" },
    { id: 2, title: "Experience", description: "Tell us your crypto experience" },
    { id: 3, title: "Strategy", description: "Review your recommended strategy" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Wizard Progress Indicator */}
        <div className="mb-8">
          <WizardProgress steps={onboardingSteps} currentStep={step - 1} />
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl"
        >
          {/* Step 1: Primary Goal */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  What's your primary goal?
                </h2>
                <p className="text-slate-400">
                  Choose the main reason you're using GuardiaVault
                </p>
              </div>

              <div className="grid gap-4">
                {PRIMARY_GOALS.map((goal) => {
                  const Icon = goal.icon;
                  return (
                    <button
                      key={goal.id}
                      onClick={() => handleGoalSelect(goal.id)}
                      className={`group relative p-6 rounded-2xl border-2 transition-all text-left ${
                        data.primaryGoal === goal.id
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-xl bg-gradient-to-br ${goal.gradient}`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-1">
                            {goal.title}
                          </h3>
                          <p className="text-slate-400 text-sm">
                            {goal.description}
                          </p>
                        </div>
                        {data.primaryGoal === goal.id && (
                          <CheckCircle className="w-6 h-6 text-blue-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Crypto Experience */}
          {step === 2 && (
            <div className="space-y-6">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  What's your crypto experience?
                </h2>
                <p className="text-slate-400">
                  Help us tailor your experience
                </p>
              </div>

              <div className="grid gap-4">
                {CRYPTO_EXPERIENCE.map((exp) => (
                  <button
                    key={exp.id}
                    onClick={() => handleExperienceSelect(exp.id)}
                    className={`group relative p-6 rounded-2xl border-2 transition-all text-left ${
                      data.cryptoExperience === exp.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-1">
                          {exp.title}
                        </h3>
                        <p className="text-slate-400 text-sm mb-3">
                          {exp.description}
                        </p>
                        <ul className="space-y-1">
                          {exp.features.map((feature, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-slate-500 flex items-center gap-2"
                            >
                              <div className="w-1 h-1 rounded-full bg-slate-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {data.cryptoExperience === exp.id && (
                        <CheckCircle className="w-6 h-6 text-blue-400 ml-4" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Strategy Summary */}
          {step === 3 && suggestedStrategy && (
            <div className="space-y-6">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Your Recommended Strategy
                </h2>
                <p className="text-slate-400">
                  Based on your preferences, here's what we recommend
                </p>
              </div>

              <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {suggestedStrategy.name}
                    </h3>
                    <p className="text-slate-400">{suggestedStrategy.asset}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-3xl font-bold text-emerald-400">
                      {suggestedStrategy.apy}% APY
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
                  <p className="text-slate-300">
                    <span className="font-semibold text-white">Why this strategy:</span>{" "}
                    {suggestedStrategy.reason}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Inheritance Protection</span>
                    <span className="text-emerald-400 font-semibold">Included Free</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Risk Level</span>
                    <span className="text-white font-semibold">Low</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">TVL</span>
                    <span className="text-white font-semibold">
                      {suggestedStrategy.name === "Lido Staking" ? "$32B" : "$8.5B"}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
                onClick={handleComplete}
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

