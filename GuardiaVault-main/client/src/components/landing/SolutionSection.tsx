import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
// Optimized GSAP import - use optimized imports for better tree-shaking
import { gsap, ScrollTrigger, MotionPathPlugin, registerPlugin } from "@/lib/gsap-optimized";
import { Shield, Users, Lock, CheckCircle, Sparkles, Zap, ChevronRight, Eye, Brain, Globe, Cpu, Fingerprint } from "lucide-react";
// Note: This component uses Canvas API, not Three.js

registerPlugin(ScrollTrigger, "ScrollTrigger");
registerPlugin(MotionPathPlugin, "MotionPathPlugin");

const solutions = [
  {
    icon: Shield,
    title: "Guardian-Based Recovery",
    description: "2-of-3 threshold system with encrypted key fragments distributed among trusted guardians. No single point of failure.",
    gradient: "from-blue-500 to-cyan-500",
    stats: { security: 99.99, uptime: 100, users: "50K+" },
    features: [
      "Quantum-resistant encryption",
      "Zero-knowledge proofs",
      "Multi-signature validation",
      "Decentralized key sharding"
    ],
    techStack: ["Shamir's Secret", "MPC", "ZK-SNARKs"],
  },
  {
    icon: Users,
    title: "Automated Inheritance",
    description: "Smart contracts execute your will automatically upon verified death. No lawyers, no delays, no disputes.",
    gradient: "from-purple-500 to-pink-500",
    stats: { assets: "$2.5B", contracts: "10K+", speed: "< 1s" },
    features: [
      "Oracle-based verification",
      "Cross-chain compatibility",
      "Legal compliance engine",
      "AI-powered dispute resolution"
    ],
    techStack: ["Chainlink", "Ethereum", "Polygon"],
  },
  {
    icon: Lock,
    title: "Biometric Security",
    description: "Face ID, Touch ID, or Windows Hello. Your biometric data never leaves your device - maximum security with zero compromise.",
    gradient: "from-emerald-500 to-teal-500",
    stats: { accuracy: 99.97, devices: "1M+", latency: "50ms" },
    features: [
      "WebAuthn integration",
      "Hardware security keys",
      "Behavioral biometrics",
      "Liveness detection"
    ],
    techStack: ["FIDO2", "WebAuthn", "PassKeys"],
  },
];

// Particle System Component
const ParticleField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      hue: number;
      reset: () => void;
      update: () => void;
      draw: () => void;
    }

    const particles: Particle[] = [];
    const particleCount = 100;

    class ParticleClass implements Particle {
      x: number = 0;
      y: number = 0;
      size: number = 0;
      speedY: number = 0;
      speedX: number = 0;
      opacity: number = 0;
      hue: number = 0;

      constructor() {
        this.reset();
        if (canvas) {
          this.y = Math.random() * canvas.height;
        }
      }

      reset() {
        if (canvas) {
          this.x = Math.random() * canvas.width;
        }
        this.y = -10;
        this.size = Math.random() * 2 + 0.5;
        this.speedY = Math.random() * 0.5 + 0.2;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.3;
        this.hue = Math.random() * 60 + 200; // Blue to purple range
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;

        // Mouse interaction
        const dx = this.x - mouseRef.current.x;
        const dy = this.y - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          const force = (100 - distance) / 100;
          this.x += (dx / distance) * force * 2;
          this.y += (dy / distance) * force * 2;
        }

        if (canvas && (this.y > canvas.height + 10 || this.x < -10 || this.x > canvas.width + 10)) {
          this.reset();
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = `hsl(${this.hue}, 70%, 60%)`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${this.hue}, 70%, 60%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new ParticleClass());
    }

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ mixBlendMode: "screen" }} />;
};

// 3D Card Component with advanced effects
interface Solution3DCardProps {
  solution: typeof solutions[0];
  index: number;
  cardRef: (el: HTMLDivElement | null, index: number) => void;
}

const Solution3DCard = ({ solution, index, cardRef }: Solution3DCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<(HTMLElement | null)[]>([]);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!innerRef.current) return;

    const card = innerRef.current as HTMLDivElement;
    
    // 3D tilt effect
    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovered) return;
      
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      gsap.to(card, {
        rotateY: (x - 0.5) * 20,
        rotateX: (y - 0.5) * -20,
        duration: 0.3,
        ease: "power2.out",
        transformPerspective: 1000,
      });

      // Move glow with mouse
      if (glowRef.current) {
        gsap.to(glowRef.current, {
          x: (x - 0.5) * 100,
          y: (y - 0.5) * 100,
          duration: 0.3,
        });
      }
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.5,
        ease: "power2.out",
      });

      if (glowRef.current) {
        gsap.to(glowRef.current, {
          x: 0,
          y: 0,
          duration: 0.5,
        });
      }
    };

    card.addEventListener("mousemove", handleMouseMove as EventListener);
    card.addEventListener("mouseleave", handleMouseLeave);

    // Animate stats on hover
    if (isHovered && statsRef.current.length > 0) {
      statsRef.current.forEach((stat, i) => {
        if (!stat) return;
        const element = stat as HTMLElement;
        gsap.from(element, {
          textContent: 0,
          duration: 1.5,
          delay: i * 0.1,
          ease: "power2.out",
          snap: { textContent: 1 },
          onUpdate: function() {
            const value = this.targets()[0].textContent;
            const keys = Object.keys(solution.stats);
            const key = keys[i] as keyof typeof solution.stats;
            const statValue = solution.stats[key];
            if (typeof statValue === 'string') {
              element.textContent = statValue;
            } else {
              element.textContent = parseFloat(value).toFixed(key === 'security' || key === 'accuracy' ? 2 : 0);
            }
          }
        });
      });
    }

    return () => {
      card.removeEventListener("mousemove", handleMouseMove as EventListener);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isHovered, solution.stats]);

  return (
    <div
      ref={(el) => {
        cardRef(el, index);
      }}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dynamic Glow Effect */}
      <div 
        ref={glowRef}
        className={`absolute -inset-4 bg-gradient-to-r ${solution.gradient} rounded-3xl opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-500`} 
      />

      {/* Main Card */}
      <div
        ref={innerRef}
        className={`relative h-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 hover:border-slate-700 transition-all cursor-pointer transform-gpu ${
          isExpanded ? 'scale-105 z-50' : ''
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${solution.gradient} opacity-5`} />
          {isHovered && (
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px] animate-grid-flow" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Icon with animation */}
          <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${solution.gradient} mb-6 transform transition-transform ${
            isHovered ? 'scale-110 rotate-3' : ''
          }`}>
            <solution.icon className="w-8 h-8 text-white" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-4">{solution.title}</h3>
          <p className="text-slate-400 leading-relaxed mb-6">{solution.description}</p>

          {/* Animated Stats */}
          {isHovered && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {Object.entries(solution.stats).map(([key, value]: [string, string | number], i: number) => (
                <div key={key} className="text-center">
                  <div 
                    ref={el => {
                      if (el) {
                        statsRef.current[i] = el as HTMLElement;
                      }
                    }}
                    className={`text-xl font-bold bg-gradient-to-r ${solution.gradient} text-transparent bg-clip-text`}
                  >
                    {typeof value === 'string' ? value : '0'}
                  </div>
                  <div className="text-xs text-slate-500 capitalize">{key}</div>
                </div>
              ))}
            </div>
          )}

          {/* Tech Stack Pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {solution.techStack.map((tech: string, i: number) => (
              <span
                key={tech}
                className={`px-3 py-1 text-xs rounded-full bg-gradient-to-r ${solution.gradient} bg-opacity-10 text-slate-300 border border-slate-700 ${
                  isHovered ? 'animate-pulse-subtle' : ''
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Features List with staggered animation */}
          <ul className="space-y-2">
            {solution.features.slice(0, isExpanded ? 4 : 3).map((feature: string, i: number) => (
              <li
                key={feature}
                className={`flex items-center gap-2 text-sm text-slate-300 transition-all ${
                  isHovered ? 'translate-x-2' : ''
                }`}
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                <CheckCircle className={`w-4 h-4 text-emerald-400 flex-shrink-0 ${
                  isHovered ? 'animate-bounce-subtle' : ''
                }`} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {/* Expand Indicator */}
          <div className={`mt-4 flex items-center gap-2 text-xs text-slate-500 transition-colors ${
            isHovered ? 'text-slate-400' : ''
          }`}>
            <span>{isExpanded ? 'Click to collapse' : 'Click to explore'}</span>
            <ChevronRight className={`w-3 h-3 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`} />
          </div>
        </div>

      </div>
    </div>
  );
};

// Magnetic Button Component
interface MagneticButtonProps {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: "primary" | "secondary";
}

const MagneticButton = ({ children, onClick, variant = "primary" }: MagneticButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!buttonRef.current) return;

    const button = buttonRef.current;
    const text = textRef.current;
    if (!text) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      const distance = Math.sqrt(x * x + y * y);
      const maxDistance = 100;
      
      if (distance < maxDistance) {
        const force = (maxDistance - distance) / maxDistance;
        
        gsap.to(button, {
          x: x * force * 0.3,
          y: y * force * 0.3,
          duration: 0.3,
          ease: "power2.out"
        });

        gsap.to(text, {
          x: x * force * 0.1,
          y: y * force * 0.1,
          duration: 0.3,
          ease: "power2.out"
        });
      }
    };

    const handleMouseLeave = () => {
      gsap.to([button, text], {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.3)"
      });
    };

    button.addEventListener("mousemove", handleMouseMove);
    button.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      button.removeEventListener("mousemove", handleMouseMove);
      button.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const baseClasses = "relative px-8 py-4 rounded-2xl font-semibold transition-all overflow-hidden transform-gpu";
  const variants = {
    primary: "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-105",
    secondary: "bg-slate-800/50 backdrop-blur border border-slate-700 text-white hover:bg-slate-800"
  };

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} group`}
    >
      <span ref={textRef} className="relative z-10 flex items-center gap-2">
        {children}
      </span>
      
      {/* Ripple Effect Background */}
      {variant === "primary" && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 animate-gradient-shift" />
        </div>
      )}
    </button>
  );
};

// Animated Counter Component
interface AnimatedCounterProps {
  value: number | string;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

const AnimatedCounter = ({ value, suffix = "", prefix = "", duration = 2 }: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const numericValue = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
      
      gsap.to({ val: 0 }, {
        val: numericValue,
        duration: duration,
        ease: "power2.out",
        onUpdate: function() {
          setCount(Math.floor(this.targets()[0].val));
        },
        scrollTrigger: {
          trigger: nodeRef.current,
          start: "top 80%",
          once: true
        }
      });
    });

    return () => ctx.revert();
  }, [value, duration]);

  return (
    <span ref={nodeRef} className="tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

// Main Component
export default function SolutionSectionEnhanced() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [, setLocation] = useLocation();

  // Set card ref callback
  const setCardRef = useCallback((el: HTMLDivElement | null, index: number) => {
    if (el) cardsRef.current[index] = el;
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Create master timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
          end: "bottom 20%",
          scrub: 1,
          pin: false,
        }
      });

      // Parallax effect for background elements (only if elements exist)
      const parallaxSlow = document.querySelector(".parallax-slow");
      if (parallaxSlow) {
        gsap.to(".parallax-slow", {
          yPercent: -30,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            scrub: 1
          }
        });
      }

      const parallaxFast = document.querySelector(".parallax-fast");
      if (parallaxFast) {
        gsap.to(".parallax-fast", {
          yPercent: -50,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            scrub: 0.5
          }
        });
      }

      // Header reveal with split text animation
      if (headerRef.current) {
        const title = headerRef.current.querySelector('h2');
        const subtitle = headerRef.current.querySelector('p');
        
        gsap.fromTo(
          title,
          {
            opacity: 0,
            y: 100,
            scale: 0.8,
            rotationX: 45,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationX: 0,
            duration: 1.5,
            ease: "power4.out",
            scrollTrigger: {
              trigger: headerRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );

        gsap.fromTo(
          subtitle,
          {
            opacity: 0,
            y: 50,
          },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            delay: 0.3,
            ease: "power3.out",
            scrollTrigger: {
              trigger: headerRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // Cards staggered 3D entrance
      cardsRef.current.forEach((card, index) => {
        if (!card) return;

        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 100,
            scale: 0.8,
            rotationY: -45,
            transformPerspective: 1000,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationY: 0,
            duration: 1.2,
            ease: "power3.out",
            delay: index * 0.15,
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      });


      // Animated line that connects cards
      if (timelineRef.current) {
        gsap.fromTo(
          timelineRef.current,
          {
            scaleX: 0,
            transformOrigin: "left center",
          },
          {
            scaleX: 1,
            duration: 2,
            ease: "power2.inOut",
            scrollTrigger: {
              trigger: cardsRef.current[0],
              start: "top 70%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    }, sectionRef);

    // Feature rotation
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 3);
    }, 3000);

    return () => {
      ctx.revert();
      clearInterval(interval);
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative py-12 overflow-hidden">

      <div className="relative z-10 container mx-auto px-6">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-20">
          <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text animate-gradient-shift">
              The Solution
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Protect, manage, and pass on your digital wealth with GuardiaVault — advanced security, designed for real people.
          </p>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {['Zero Knowledge', 'Quantum Safe', 'Multi-Chain', 'AI Powered'].map((feature, i) => (
              <span
                key={feature}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  activeFeature === i % 3
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700'
                }`}
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Connection Timeline */}
        <div className="relative max-w-6xl mx-auto mb-4">
          <div ref={timelineRef} className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transform -translate-y-1/2 z-0" />
        </div>

        {/* Solution Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 max-w-6xl mx-auto">
          {solutions.map((solution, index) => (
            <Solution3DCard
              key={solution.title}
              solution={solution}
              index={index}
              cardRef={setCardRef}
            />
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 max-w-4xl mx-auto">
          {[
            { icon: Globe, label: 'Global Coverage', value: '150+ Countries' },
            { icon: Fingerprint, label: 'Secured Assets', value: '$2.5B+' },
            { icon: Cpu, label: 'Transactions/sec', value: '10,000+' },
            { icon: Eye, label: 'Uptime', value: '99.99%' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="text-center group cursor-pointer"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="inline-flex p-3 rounded-2xl bg-slate-800/50 border border-slate-700 mb-3 group-hover:scale-110 transition-transform">
                <stat.icon className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stat.value.includes('+') || stat.value.includes('%') ? (
                  <AnimatedCounter value={stat.value.replace(/[^0-9.]/g, '')} suffix={stat.value.match(/[+%]/)?.[0] || ''} />
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-30px, 30px) rotate(120deg); }
          66% { transform: translate(20px, -20px) rotate(240deg); }
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes grid-flow {
          0% { transform: translateX(0); }
          100% { transform: translateX(30px); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }

        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }

        .animate-float {
          animation: float 20s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 20s ease-in-out infinite;
        }

        .animate-gradient-shift {
          animation: gradient-shift 8s ease infinite;
          background-size: 200% 200%;
        }

        .animate-grid-flow {
          animation: grid-flow 20s linear infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 1s ease-in-out infinite;
        }

        .animation-delay-500 {
          animation-delay: 500ms;
        }
      `}</style>
    </section>
  );
}