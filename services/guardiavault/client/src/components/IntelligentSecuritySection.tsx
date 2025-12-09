import React, { useRef, useEffect, useState } from "react";
import { Brain, Eye, Shield, Lock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StackedCards } from "@/components/ui/glass-cards";
import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";


registerPlugin(ScrollTrigger, "ScrollTrigger");

interface SecurityFeature {
  icon: React.ElementType;
  title: string;
  description: string;
  highlight?: string;
  color: string;
  gradient: string;
  image: string;
}

const securityFeatures: SecurityFeature[] = [
  {
    icon: Brain,
    title: "AI Risk Monitor",
    description: "Detects suspicious login patterns, anomalous behavior, and sophisticated impersonation attempts using advanced machine learning",
    highlight: "🧠 AI-Driven",
    color: "rgba(59, 130, 246, 1)",
    gradient: "from-blue-500 to-cyan-500",
    image: "/guardian-protocol.png", // 3rd photo -> 1st card
  },
  {
    icon: Eye,
    title: "Behavioral Biometrics",
    description: "Continuously analyzes your unique typing patterns, mouse movements, and interaction signatures to ensure it's really you",
    highlight: "👁️ Biometric",
    color: "rgba(139, 92, 246, 1)",
    gradient: "from-purple-500 to-pink-500",
    image: "/ai-risk-monitor.png", // 1st photo -> 2nd card
  },
  {
    icon: Shield,
    title: "Guardian Protocol",
    description: "Multi-layered authorization system that releases access only when you explicitly authorize or verified absence is confirmed",
    highlight: "🛡️ Secure",
    color: "rgba(34, 197, 94, 1)",
    gradient: "from-green-500 to-emerald-500",
    image: "/zero-trust-architecture.png", // 4th photo -> 3rd card
  },
  {
    icon: Lock,
    title: "Zero Trust Architecture",
    description: "Distributed security model with no single password, no central point of failure, and seamless legacy access protocols",
    highlight: "🔐 Zero Trust",
    color: "rgba(249, 115, 22, 1)",
    gradient: "from-orange-500 to-red-500",
    image: "/zero-trust.png",
  },
];

export default function IntelligentSecuritySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const transitionOverlayRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mouseRef.current = { x, y };
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    if (!sectionRef.current || !cardsRef.current || !titleRef.current) return;

    const ctx = gsap.context(() => {
      // Advanced section transition - reveal curtain effect
      if (transitionOverlayRef.current) {
        gsap.fromTo(
          transitionOverlayRef.current,
          {
            clipPath: "inset(0% 0% 0% 0%)",
          },
          {
            clipPath: "inset(0% 0% 100% 0%)",
            duration: 1.2,
            ease: "power3.inOut",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 90%",
              end: "top 60%",
              scrub: 1.5,
            },
          }
        );
      }

      // Title animation - enhanced with split text effect
      gsap.fromTo(
        titleRef.current,
        {
          opacity: 0,
          y: 80,
          scale: 0.9,
          rotationX: -15,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotationX: 0,
          ease: "power4.out",
          duration: 1.2,
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 95%",
            end: "top 65%",
            scrub: 1.5,
          },
        }
      );

      // Subtitle animation
      if (subtitleRef.current) {
        gsap.fromTo(
          subtitleRef.current,
          {
            opacity: 0,
            y: 40,
          },
          {
            opacity: 1,
            y: 0,
            ease: "power3.out",
            scrollTrigger: {
              trigger: subtitleRef.current,
              start: "top 92%",
              end: "top 68%",
              scrub: 1.3,
            },
          }
        );
      }

      // Animate background gradient
      if (backgroundRef.current) {
        gsap.to(backgroundRef.current, {
          backgroundPosition: "200% 200%",
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      }

      // Card animations are now handled by the StackedCards component

      // Floating particles animation
      const particles = document.querySelectorAll(".floating-particle");
      particles.forEach((particle, i) => {
        gsap.to(particle, {
          y: "random(-100, 100)",
          x: "random(-100, 100)",
          rotation: "random(-180, 180)",
          duration: "random(8, 15)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.2,
        });
      });

      ScrollTrigger.refresh();
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="pt-16 sm:pt-20 md:pt-24 lg:pt-32 pb-16 sm:pb-24 md:pb-32 lg:pb-48 bg-background relative"
      style={{ overflowX: 'hidden', overflowY: 'visible' }}
      id="intelligent-security"
    >
      {/* Advanced Transition Overlay - Reveal Curtain */}
      <div
        ref={transitionOverlayRef}
        className="absolute inset-0 bg-background z-50 pointer-events-none"
        style={{
          clipPath: "inset(0% 0% 0% 0%)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.25),transparent_70%)]" />
      </div>

      {/* Multi-layered Animated Background */}
      <div
        ref={backgroundRef}
        className="absolute inset-0 opacity-50"
        style={{
          background:
            "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 25%, rgba(34, 197, 94, 0.08) 50%, rgba(249, 115, 22, 0.08) 75%, rgba(59, 130, 246, 0.08) 100%)",
          backgroundSize: "400% 400%",
        }}
      />

      {/* Interactive Mouse Gradient */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 800px at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.15), transparent 70%)`,
        }}
      />

      {/* Enhanced Particle Grid Effect */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.05) 2px, transparent 2px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.05) 2px, transparent 2px)
            `,
            backgroundSize: "60px 60px",
            maskImage:
              "radial-gradient(ellipse 100% 100% at 50% 50%, black 40%, transparent 100%)",
          }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="floating-particle absolute w-2 h-2 bg-primary/30 rounded-full blur-sm"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Accent Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-8 sm:mb-12 md:mb-16 lg:mb-24">
          <div ref={titleRef}>
            <div className="inline-flex items-center gap-2 mb-4 sm:mb-6 px-4 sm:px-6 py-2 sm:py-3 bg-primary/10 border border-primary/30 rounded-full backdrop-blur-sm">
              <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 text-primary animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wider">
                Next-Gen Protection
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black font-display mb-4 sm:mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70 px-4">
              Intelligent Security That Thinks Ahead
            </h2>
          </div>
          <p
            ref={subtitleRef}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/70 max-w-3xl sm:max-w-4xl mx-auto font-light leading-relaxed px-4"
          >
            Your vault evolves with your behavior, learning and adapting to
            protect what matters most.
          </p>
        </div>

        <div ref={cardsRef} className="relative" style={{ overflow: 'visible', minHeight: `${securityFeatures.length * 100}vh` }}>
          <StackedCards
            cards={securityFeatures.map((feature, index) => ({
              id: index + 1,
              title: feature.title,
              description: feature.description,
              color: feature.color,
              image: feature.image,
              icon: (
                <div
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${feature.color}30, ${feature.color}15)`,
                    border: `3px solid ${feature.color}60`,
                    boxShadow: `
                      0 0 60px ${feature.color}50,
                      0 0 120px ${feature.color}30,
                      inset 0 2px 6px rgba(255, 255, 255, 0.15)
                    `,
                  }}
                >
                  <feature.icon
                    className="w-8 h-8 sm:w-10 sm:h-10"
                    style={{ color: feature.color }}
                  />
                </div>
              ),
            }))}
          />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </section>
  );
}