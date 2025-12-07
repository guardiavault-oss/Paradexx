import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Sparkles, Zap } from "lucide-react";
import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";


registerPlugin(ScrollTrigger, "ScrollTrigger");

interface FinalCTASectionProps {
  onGetStarted?: () => void;
  isWalletConnected?: boolean;
}

export default function FinalCTASection({ onGetStarted, isWalletConnected }: FinalCTASectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        {
          opacity: 0,
          scale: 0.95,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: contentRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 sm:py-32 bg-gradient-to-b from-slate-900 via-blue-950 to-purple-950 relative overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent_50%)]" />
      </div>

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div ref={contentRef} className="max-w-5xl mx-auto">
          {/* Main CTA card */}
          <div className="relative">
            {/* Gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-3xl blur-xl opacity-50" />

            <div className="relative bg-slate-950/90 backdrop-blur-xl rounded-3xl p-8 sm:p-12 md:p-16 border border-white/10">
              {/* Icon decoration */}
              <div className="flex justify-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-400/30 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-blue-400" />
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-400/30 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-400/30 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-cyan-400" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-display mb-6 leading-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">
                    Start Protecting Your Legacy
                  </span>
                  <br />
                  <span className="text-white">
                    Today
                  </span>
                </h2>

                <p className="text-lg sm:text-xl md:text-2xl text-white/70 mb-8 max-w-3xl mx-auto leading-relaxed">
                  Join thousands of crypto holders who are earning yield while ensuring their assets are protected for their loved ones.
                </p>

                {/* Features list */}
                <div className="flex flex-col sm:flex-row justify-center gap-6 mb-10 text-white/80">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-sm sm:text-base font-medium">5-8% APY</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-sm sm:text-base font-medium">100% Non-Custodial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-sm sm:text-base font-medium">Free Inheritance</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  size="lg"
                  className="text-lg px-12 py-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold shadow-2xl shadow-blue-500/50 transform hover:scale-105 transition-all duration-300 group"
                  onClick={onGetStarted}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>

                <p className="text-sm text-white/50 mt-6">
                  No credit card required • Setup in 5 minutes • Cancel anytime
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

