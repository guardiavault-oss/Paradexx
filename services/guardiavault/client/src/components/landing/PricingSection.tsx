import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";
import { Check, Shield, TrendingUp, Zap } from "lucide-react";

registerPlugin(ScrollTrigger, "ScrollTrigger");

const plans = [
  {
    name: "Starter",
    monthlyPrice: 49.99,
    description: "Perfect for individuals securing one wallet",
    features: [
      "2-of-3 guardian recovery",
      "Guardian portal access",
      "Basic will builder",
      "Email notifications",
      "Biometric check-ins",
      "Single wallet support",
    ],
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    name: "Vault Pro",
    monthlyPrice: 99.99,
    description: "For power users, DAOs, and estate attorneys",
    features: [
      "Everything in Starter, plus:",
      "Multi-wallet support (BTC, ETH, NFTs)",
      "Smart will builder (legal PDF + on-chain)",
      "Hardware key & Web3 signatures",
      "Priority recovery & concierge setup",
      "Earn 3-5% APY on staked vaults",
    ],
    gradient: "from-purple-500 to-pink-500",
  },
  {
    name: "Guardian+",
    monthlyPrice: 249.99,
    description: "For families and estate planners",
    features: [
      "Everything in Vault Pro, plus:",
      "Automated death verification",
      "3 guardians + 3 beneficiaries",
      "SMS/Telegram notifications",
      "Biometric & 2FA login",
      "On-chain will execution",
    ],
    gradient: "from-blue-500 to-cyan-500",
  },
];

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const ctaRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);

  // Calculate prices
  const getPrice = (monthlyPrice: number) => {
    if (isYearly) {
      const yearlyPrice = monthlyPrice * 12 * 0.8; // 20% discount
      return {
        price: `$${yearlyPrice.toFixed(2)}`,
        period: "/year",
        savings: `Save $${(monthlyPrice * 12 * 0.2).toFixed(2)}`,
      };
    }
    return {
      price: `$${monthlyPrice.toFixed(2)}`,
      period: "/month",
      savings: null,
    };
  };

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Header animation
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          {
            opacity: 0,
            y: 50,
          },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: headerRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // Cards animation with stagger
      cardsRef.current.forEach((card, index) => {
        if (!card) return;

        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 80,
            scale: 0.9,
            rotationY: index % 2 === 0 ? -15 : 15,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationY: 0,
            duration: 1.2,
            ease: "power4.out",
            delay: index * 0.15,
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );

        // Hover effect
        card.addEventListener("mouseenter", () => {
          gsap.to(card, {
            scale: 1.05,
            y: -10,
            duration: 0.4,
            ease: "power2.out",
          });
        });

        card.addEventListener("mouseleave", () => {
          gsap.to(card, {
            scale: 1,
            y: 0,
            duration: 0.4,
            ease: "power2.out",
          });
        });
      });

      // CTA animation
      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current,
          {
            opacity: 0,
            y: 30,
          },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ctaRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // Toggle animation
      if (toggleRef.current) {
        gsap.fromTo(
          toggleRef.current,
          {
            opacity: 0,
            scale: 0.9,
          },
          {
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: "back.out(1.2)",
            scrollTrigger: {
              trigger: toggleRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [isYearly]);

  return (
    <section ref={sectionRef} id="pricing" className="relative py-12 overflow-hidden">

      <div className="relative z-10 container mx-auto px-6">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-12">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
              Simple, Transparent Pricing
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-4">
            Choose the perfect plan to protect your digital legacy
          </p>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
            Protect forever. No hidden fees, cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div ref={toggleRef} className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium transition-colors ${!isYearly ? "text-white" : "text-slate-400"}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                isYearly ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                  isYearly ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${isYearly ? "text-white" : "text-slate-400"}`}>
              Yearly
            </span>
            {isYearly && (
              <span className="ml-2 px-3 py-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold">
                Save 20%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const pricing = getPrice(plan.monthlyPrice);
            
            return (
              <div
                key={plan.name}
                ref={(el) => {
                  if (el) cardsRef.current[index] = el;
                }}
                className="relative group"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Card Glow */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${plan.gradient} rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />

                {/* Card */}
                <div className="relative h-full bg-slate-900/70 backdrop-blur-xl border-2 border-slate-800 rounded-3xl p-8 hover:border-slate-700 transition-all">
                  {/* Header */}
                  <div className="mb-6">
                    <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${plan.gradient} mb-4`}>
                      {plan.name === "Starter" && <Shield className="w-6 h-6 text-white" />}
                      {plan.name === "Guardian+" && <TrendingUp className="w-6 h-6 text-white" />}
                      {plan.name === "Vault Pro" && <Zap className="w-6 h-6 text-white" />}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-bold text-white">{pricing.price}</span>
                      <span className="text-slate-400">{pricing.period}</span>
                    </div>
                    {pricing.savings && (
                      <p className="text-sm text-emerald-400 font-medium">{pricing.savings}</p>
                    )}
                  </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-slate-300 text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link href={`/checkout?plan=${encodeURIComponent(plan.name)}`}>
                  <button
                    className={`w-full py-4 rounded-2xl font-semibold transition-all ${
                      plan.name === "Guardian+"
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105"
                        : "bg-slate-800/50 text-white hover:bg-slate-800 border border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
            );
          })}
        </div>

        {/* Trust Indicators */}
        <div ref={ctaRef} className="text-center">
          <div className="inline-block">
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-3xl p-8 max-w-3xl">
              <div className="flex items-center justify-center gap-8 flex-wrap mb-6">
                <div className="flex items-center gap-2 text-slate-400">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span className="text-sm">Payment Protected</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm">No Hidden Fees</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm">Cancel Anytime</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm">
                Enterprise solutions available.{" "}
                <a href="#contact" className="text-blue-400 hover:text-blue-300 underline">
                  Contact us
                </a>{" "}
                for custom pricing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

