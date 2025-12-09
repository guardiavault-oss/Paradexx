import React, { useRef, useEffect, useState } from "react";
import { Lock, Zap, CheckCircle2, TrendingUp, Shield, Wallet, Users, Award, Sparkles, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";


registerPlugin(ScrollTrigger, "ScrollTrigger");

interface Benefit {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  gradient: string;
}

const benefits: Benefit[] = [
  {
    icon: TrendingUp,
    title: "Earn Competitive Yields",
    description: "Auto-compound your crypto in top DeFi protocols like Lido, Aave, and Compound. Earn 5-8% APY while maintaining full control of your assets.",
    color: "#10b981",
    gradient: "from-emerald-500 to-green-600",
  },
  {
    icon: Shield,
    title: "Military-Grade Security",
    description: "Your assets are protected with biometric authentication, multi-signature technology, and distributed key management. Non-custodial and secure.",
    color: "#3b82f6",
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    icon: Users,
    title: "Family Protection Built-In",
    description: "Free inheritance protection ensures your loved ones can access your assets if something happens. Set up guardians and beneficiaries in minutes.",
    color: "#8b5cf6",
    gradient: "from-purple-500 to-pink-600",
  },
  {
    icon: Wallet,
    title: "100% Non-Custodial",
    description: "You maintain complete ownership and control. We never hold your keys or have access to your funds. Your crypto, your control, always.",
    color: "#06b6d4",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    icon: Award,
    title: "No Hidden Fees",
    description: "Transparent pricing with 0% setup fees. Only pay for what you use. No surprises, no hidden costs. Cancel anytime.",
    color: "#f59e0b",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    icon: Target,
    title: "Simple Setup",
    description: "Get started in under 5 minutes. Connect your wallet, choose your yield strategy, and set up inheritance protection. That's it.",
    color: "#ec4899",
    gradient: "from-pink-500 to-rose-600",
  },
];

// Animated Counter Component (kept the same)
const AnimatedCounter: React.FC<{ end: string; duration?: number }> = ({ 
  end, 
  duration = 2 
}) => {
  const [count, setCount] = useState<string>("0");
  const countRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!countRef.current || hasAnimated.current) return;

    const isNumber = !isNaN(parseFloat(end.replace(/,/g, '')));
    
    if (isNumber) {
      const endValue = parseFloat(end.replace(/,/g, ''));
      
      ScrollTrigger.create({
        trigger: countRef.current,
        start: "top 85%",
        once: true,
        onEnter: () => {
          hasAnimated.current = true;
          const obj = { value: 0 };
          gsap.to(obj, {
            value: endValue,
            duration: duration,
            ease: "power2.out",
            onUpdate: () => {
              if (endValue >= 1000000000) {
                // Show whole number (200B instead of 200.0B)
                const billions = Math.floor(obj.value / 1000000000);
                setCount(`$${billions}B`);
              } else if (endValue >= 1000000) {
                const millions = Math.floor(obj.value / 1000000);
                setCount(`${millions}M`);
              } else {
                setCount(Math.floor(obj.value).toLocaleString());
              }
            },
          });
        },
      });
    } else {
      setCount(end);
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars.trigger === countRef.current) {
          trigger.kill();
        }
      });
    };
  }, [end, duration]);

  return <span ref={countRef}>{count}</span>;
};

export default function BenefitsGrid() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const transitionOverlayRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // GSAP Animations (Simplified and Enhanced)
  useEffect(() => {
    if (!sectionRef.current || !cardsRef.current || !titleRef.current) return;

    const ctx = gsap.context(() => {
      // Background Transition (Cracked Vault Reveal)
      if (transitionOverlayRef.current) {
        gsap.fromTo(
          transitionOverlayRef.current,
          {
            clipPath: "inset(0% 0% 0% 0%)",
          },
          {
            clipPath: "inset(0% 0% 100% 0%)",
            duration: 1.5,
            ease: "power4.inOut",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 90%",
              end: "top 50%",
              scrub: 2,
            },
          }
        );
      }

      // Title & Subtitle Animation
      gsap.fromTo(
        [titleRef.current, subtitleRef.current],
        {
          opacity: 0,
          y: 60,
          rotationX: -10,
        },
        {
          opacity: 1,
          y: 0,
          rotationX: 0,
          ease: "power3.out",
          stagger: 0.2,
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 95%",
            end: "top 60%",
            scrub: 1.5,
          },
        }
      );

      // Timeline connector line
      const timelineLine = document.querySelector('.timeline-line');
      if (timelineLine) {
        gsap.fromTo(
          timelineLine,
          {
            scaleY: 0,
            transformOrigin: "top center",
          },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: cardsRef.current,
              start: "top 80%",
              end: "bottom 30%",
              scrub: 1,
            },
          }
        );
      }

      // Card entrance animation (Simplified for better performance & visual focus)
      if (!cardsRef.current) return;
      const cards = Array.from(cardsRef.current.children) as HTMLElement[];
      
      // Set initial state and ensure visibility
      gsap.set(cards, {
          opacity: 0,
          y: 100,
          scale: 0.9,
      });
      
      // Animate in when scrolled into view - use 'once: true' to ensure it animates
      gsap.to(cards, {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.15,
          ease: "back.out(1.2)",
          scrollTrigger: {
              trigger: cardsRef.current,
              start: "top 85%", 
              end: "top 50%",
              toggleActions: "play none none reverse",
              once: false, // Allow reverse on scroll back up
          }
      });
      
      // Fallback: Make cards visible if scroll trigger doesn't fire within 2 seconds
      window.setTimeout(() => {
          cards.forEach((card) => {
              const currentOpacity = gsap.getProperty(card, "opacity");
              if (currentOpacity === 0) {
                  gsap.to(card, { opacity: 1, duration: 0.5 });
              }
          });
      }, 2000);
      
      // Subtle Scroll 3D effect on cards
      cards.forEach((card, index) => {
        ScrollTrigger.create({
          trigger: card,
          start: "top 95%",
          end: "bottom 10%",
          scrub: true,
          onUpdate: (self) => {
            const progress = self.progress;
            const center = 0.5;
            const diff = progress - center;
            
            // Subtle Y rotation and lift as it scrolls through the center
            const rotateY = diff * -10;
            const z = Math.sin(progress * Math.PI) * 40; // Max lift at center
            
            const baseColor = index === cards.length - 1 ? "0, 220, 255" : "239, 68, 68";

            gsap.set(card, {
              rotateY: rotateY,
              z: z,
              transformPerspective: 1500,
              transformOrigin: "center center",
              boxShadow: `
                0 30px 90px rgba(${baseColor}, ${Math.abs(diff) < 0.3 ? 0.3 : 0.1}),
                0 10px 30px rgba(${baseColor}, ${Math.abs(diff) < 0.3 ? 0.15 : 0.05})
              `,
            });
          },
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
      className="py-20 sm:py-32 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden"
      id="benefits"
    >
      {/* Background gradient mesh */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(147,51,234,0.15),transparent_50%)]" />
      </div>

      {/* Animated grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section header */}
        <div ref={titleRef} className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 backdrop-blur-sm mb-6">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Why Choose GuardiaVault</span>
          </div>

          <h2 ref={subtitleRef} className="text-4xl sm:text-5xl md:text-6xl font-black font-display mb-6 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">
              Everything You Need
            </span>
            <br />
            <span className="text-white">
              In One Platform
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-white/70 leading-relaxed">
            Earn yield, protect your assets, and secure your legacy. All without giving up control.
          </p>
        </div>

        {/* Benefits grid */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <Card
              key={index}
              className={`group relative border-0 backdrop-blur-xl bg-gradient-to-br ${benefit.gradient} p-[1px] hover:scale-105 transition-all duration-500 overflow-hidden`}
            >
              {/* Inner card */}
              <div className="absolute inset-[1px] bg-slate-950/90 rounded-lg" />

              <CardContent className="relative p-8">
                {/* Animated glow effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-lg"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${benefit.color}, transparent)`,
                  }}
                />

                {/* Icon */}
                <div className="relative mb-6">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
                    style={{
                      background: `linear-gradient(135deg, ${benefit.color}30, ${benefit.color}10)`,
                      boxShadow: `0 0 30px ${benefit.color}30`,
                    }}
                  >
                    <benefit.icon
                      className="w-8 h-8 transition-transform duration-500 group-hover:scale-110"
                      style={{ color: benefit.color }}
                    />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-white/90 transition-colors">
                  {benefit.title}
                </h3>

                <p className="text-white/70 leading-relaxed">
                  {benefit.description}
                </p>

                {/* Decorative element */}
                <div
                  className="absolute bottom-4 right-4 text-6xl font-black opacity-5 select-none pointer-events-none"
                  style={{ color: benefit.color }}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}