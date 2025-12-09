import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Users, Lock } from "lucide-react";
// Optimized GSAP import - use optimized imports for better tree-shaking
import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";
import { SimpleOptimizedImage } from "@/components/OptimizedImage";
import { getPerformanceConfig } from "@/utils/performance";

registerPlugin(ScrollTrigger, "ScrollTrigger");

interface VaultHeroProps {
  onGetStarted?: () => void;
  onLearnMore?: () => void;
  isWalletConnected?: boolean;
}

export default function VaultHero({ onGetStarted, onLearnMore, isWalletConnected }: VaultHeroProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const perfConfig = getPerformanceConfig();

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Hero entrance animation
    tl.fromTo(
      textRef.current,
      {
        opacity: 0,
        y: 60,
        scale: 0.95,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.2,
      }
    );
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ overflow: "visible" }}
    >
      
      {/* Content - NO black box, direct contrast with background */}
      <div className="container mx-auto px-4 sm:px-6 relative z-10 pt-32 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Large Logo at the top */}
          <div className="mb-12 flex justify-center">
            <SimpleOptimizedImage
              src="logo"
              alt="GuardiaVault"
              className="h-32 sm:h-40 md:h-48 lg:h-56 w-auto transition-transform hover:scale-105"
              priority
              width={224}
              height={224}
            />
          </div>
          <div ref={textRef} className="space-y-8">

            {/* Clear, focused headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.1] px-2">
              <span className="block text-white mb-2 text-reveal-split">
                <span className="block md:inline">Grow Your Crypto.</span>
                <span className="block md:inline md:ml-2">Protect It Forever.</span>
              </span>
            </h1>

            {/* Clearer subheadline with single focus */}
            <p className="text-lg sm:text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed px-4 text-reveal-split">
              Earn 5.2% APY on your ETH with Lido, while your wallet stays secure — even after you're gone.
            </p>

            {/* Trust signals - NEW */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400 px-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-400" />
                <span>Non-custodial — you always keep control</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Bank-level encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Automatic inheritance protection built in</span>
              </div>
            </div>

            {/* CTAs with clear hierarchy */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                className="magnetic-btn text-lg px-10 py-7 bg-gradient-to-r from-blue-600 to-purple-600
                         hover:from-blue-500 hover:to-purple-500 text-white font-bold
                         shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50
                         transform hover:scale-105 transition-all duration-300
                         relative overflow-hidden group w-full sm:w-auto min-h-[60px]"
                onClick={() => setLocation("/pricing")}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Staking
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                              translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </section>
  );
}
