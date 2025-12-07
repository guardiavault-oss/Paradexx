import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { 
  Fingerprint, 
  Shield, 
  Users, 
  TrendingUp, 
  Lock, 
  Zap,
  FileCheck,
  Heart,
  Cpu,
  Sparkles,
  Eye,
  Bell,
  Globe
} from "lucide-react";
import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";
import { getPerformanceConfig } from "@/utils/performance";
import Features3DCarousel from "./Features3DCarousel";

registerPlugin(ScrollTrigger, "ScrollTrigger");

const mainFeatures = [
  {
    icon: Fingerprint,
    title: "Biometric Authentication",
    description: "Military-grade biometric security that never stores your data in the cloud",
    details: [
      "Face ID, Touch ID, Windows Hello support",
      "Local-only biometric data processing",
      "Sub-second authentication speed",
      "99.999% accuracy rate",
      "Backup PIN with encrypted recovery"
    ],
    stats: [
      { label: "Auth Speed", value: "<0.3s", trend: "up" },
      { label: "Accuracy", value: "99.999%", trend: "stable" },
      { label: "Failed Attempts", value: "0.001%", trend: "down" }
    ],
    gradient: "from-purple-500 via-pink-500 to-purple-600",
    accentColor: "#a855f7",
    chartType: "security",
  },
  {
    icon: Users,
    title: "Guardian Recovery System",
    description: "Distributed trust model with cryptographic key sharding for ultimate security",
    details: [
      "2-of-3 or 3-of-5 threshold schemes",
      "Shamir's Secret Sharing algorithm",
      "Guardian vetting & verification",
      "Time-locked recovery periods",
      "Emergency override protocols"
    ],
    stats: [
      { label: "Recovery Time", value: "24-72h", trend: "stable" },
      { label: "Success Rate", value: "99.8%", trend: "up" },
      { label: "Guardians Active", value: "15K+", trend: "up" }
    ],
    gradient: "from-blue-500 via-cyan-500 to-blue-600",
    accentColor: "#3b82f6",
    chartType: "network",
  },
  {
    icon: Heart,
    title: "Dead Man's Switch",
    description: "Automated inheritance trigger with intelligent activity monitoring",
    details: [
      "Customizable check-in periods (7-90 days)",
      "Multi-channel verification (email, SMS, app)",
      "Grace period with escalating alerts",
      "Proof of life smart contract",
      "Beneficiary notification system"
    ],
    stats: [
      { label: "Active Switches", value: "8,234", trend: "up" },
      { label: "Avg Check-in", value: "30 days", trend: "stable" },
      { label: "Triggered", value: "127", trend: "up" }
    ],
    gradient: "from-red-500 via-orange-500 to-red-600",
    accentColor: "#ef4444",
    chartType: "timeline",
  },
  {
    icon: TrendingUp,
    title: "Yield Generation",
    description: "Algorithmic yield optimization across multiple DeFi protocols",
    details: [
      "5-8% APY with auto-compounding",
      "Diversified across 12+ protocols",
      "Smart rebalancing every 6 hours",
      "Only 1% performance fee",
      "Real-time yield tracking"
    ],
    stats: [
      { label: "Average APY", value: "6.4%", trend: "up" },
      { label: "Total Value", value: "$24M", trend: "up" },
      { label: "Active Vaults", value: "3,421", trend: "up" }
    ],
    gradient: "from-green-500 via-emerald-500 to-green-600",
    accentColor: "#10b981",
    chartType: "graph",
  },
  {
    icon: FileCheck,
    title: "Smart Will Builder",
    description: "Legal-tech integration with blockchain-verified asset distribution",
    details: [
      "State-compliant will templates",
      "Percentage-based distributions",
      "Multi-asset support (crypto, NFTs, tokens)",
      "Conditional inheritance rules",
      "Lawyer review network"
    ],
    stats: [
      { label: "Wills Created", value: "12,455", trend: "up" },
      { label: "Assets Protected", value: "$89M", trend: "up" },
      { label: "Legal Reviews", value: "2,134", trend: "up" }
    ],
    gradient: "from-indigo-500 via-purple-500 to-indigo-600",
    accentColor: "#6366f1",
    chartType: "distribution",
  },
  {
    icon: Lock,
    title: "Multi-Signature Security",
    description: "Enterprise-grade multi-sig with role-based access control",
    details: [
      "2-of-3, 3-of-5, or custom thresholds",
      "Role hierarchies & permissions",
      "Time-locked transactions",
      "Audit trail & compliance logs",
      "Hardware wallet integration"
    ],
    stats: [
      { label: "Active Multi-sigs", value: "4,892", trend: "up" },
      { label: "Tx Approved", value: "45.2K", trend: "up" },
      { label: "Avg Signers", value: "3.2", trend: "stable" }
    ],
    gradient: "from-yellow-500 via-orange-500 to-yellow-600",
    accentColor: "#f59e0b",
    chartType: "security",
  },
  {
    icon: Globe,
    title: "Guardian Portal",
    description: "Lightweight web interface for non-crypto users. Simple, secure, and accessible from any device",
    details: [
      "Web-based guardian dashboard",
      "No crypto knowledge required",
      "Secure fragment management",
      "Multi-device access",
      "Intuitive recovery workflow"
    ],
    stats: [
      { label: "Active Guardians", value: "12.5K", trend: "up" },
      { label: "Portal Logins", value: "89.2K", trend: "up" },
      { label: "Success Rate", value: "98.5%", trend: "up" }
    ],
    gradient: "from-emerald-500 via-teal-500 to-emerald-600",
    accentColor: "#22c55e",
    chartType: "network",
  },
  {
    icon: Bell,
    title: "Notifications & Verification",
    description: "Email, SMS, or Telegram alerts when key events happen. Stay informed about your vault status",
    details: [
      "Multi-channel notifications",
      "Real-time vault status updates",
      "Check-in reminders",
      "Recovery event alerts",
      "Customizable notification preferences"
    ],
    stats: [
      { label: "Notifications Sent", value: "2.4M", trend: "up" },
      { label: "Delivery Rate", value: "99.7%", trend: "stable" },
      { label: "Avg Response Time", value: "<2min", trend: "down" }
    ],
    gradient: "from-amber-500 via-yellow-500 to-amber-600",
    accentColor: "#f59e0b",
    chartType: "timeline",
  },
];

// Mini visualization components
const MiniGraph = ({ color }: { color: string }) => (
  <svg className="w-full h-24" viewBox="0 0 200 80" fill="none">
    <defs>
      <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
        <stop offset="100%" stopColor={color} stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <path
      d="M 0 60 Q 30 45, 50 40 T 100 35 T 150 25 T 200 20"
      stroke={color}
      strokeWidth="2"
      fill="none"
      className="animate-draw-line"
    />
    <path
      d="M 0 60 Q 30 45, 50 40 T 100 35 T 150 25 T 200 20 L 200 80 L 0 80 Z"
      fill={`url(#gradient-${color})`}
    />
    {[20, 50, 80, 110, 140, 170].map((x, i) => (
      <circle key={i} cx={x} cy={60 - i * 7} r="3" fill={color} className="animate-pulse-slow" />
    ))}
  </svg>
);

const NetworkViz = ({ color }: { color: string }) => (
  <svg className="w-full h-24" viewBox="0 0 200 80" fill="none">
    {/* Connections */}
    <line x1="100" y1="40" x2="40" y2="20" stroke={color} strokeWidth="1" opacity="0.3" />
    <line x1="100" y1="40" x2="160" y2="20" stroke={color} strokeWidth="1" opacity="0.3" />
    <line x1="100" y1="40" x2="40" y2="60" stroke={color} strokeWidth="1" opacity="0.3" />
    <line x1="100" y1="40" x2="160" y2="60" stroke={color} strokeWidth="1" opacity="0.3" />
    <line x1="40" y1="20" x2="160" y2="20" stroke={color} strokeWidth="1" opacity="0.2" />
    <line x1="40" y1="60" x2="160" y2="60" stroke={color} strokeWidth="1" opacity="0.2" />
    
    {/* Nodes */}
    <circle cx="100" cy="40" r="8" fill={color} opacity="0.8" className="animate-pulse-slow" />
    <circle cx="40" cy="20" r="6" fill={color} opacity="0.6" />
    <circle cx="160" cy="20" r="6" fill={color} opacity="0.6" />
    <circle cx="40" cy="60" r="6" fill={color} opacity="0.6" />
    <circle cx="160" cy="60" r="6" fill={color} opacity="0.6" />
    <circle cx="20" cy="40" r="4" fill={color} opacity="0.4" />
    <circle cx="180" cy="40" r="4" fill={color} opacity="0.4" />
  </svg>
);

const TimelineViz = ({ color }: { color: string }) => (
  <svg className="w-full h-24" viewBox="0 0 200 80" fill="none">
    <line x1="20" y1="40" x2="180" y2="40" stroke={color} strokeWidth="2" opacity="0.3" />
    {[30, 70, 110, 150].map((x, i) => (
      <g key={i}>
        <circle cx={x} cy="40" r="6" fill={color} opacity={i === 3 ? 1 : 0.5} className={i === 3 ? "animate-pulse-slow" : ""} />
        <text x={x} y="60" fill={color} fontSize="8" textAnchor="middle" opacity="0.7">
          {i === 0 ? "7d" : i === 1 ? "30d" : i === 2 ? "60d" : "90d"}
        </text>
      </g>
    ))}
  </svg>
);

const DistributionViz = ({ color }: { color: string }) => (
  <svg className="w-full h-24" viewBox="0 0 200 80" fill="none">
    {[
      { x: 40, h: 60, w: 25 },
      { x: 75, h: 45, w: 25 },
      { x: 110, h: 70, w: 25 },
      { x: 145, h: 35, w: 25 }
    ].map((bar, i) => (
      <g key={i}>
        <rect 
          x={bar.x} 
          y={80 - bar.h} 
          width={bar.w} 
          height={bar.h} 
          fill={color} 
          opacity="0.6"
          rx="3"
        />
        <rect 
          x={bar.x} 
          y={80 - bar.h} 
          width={bar.w} 
          height="4" 
          fill={color} 
          opacity="1"
          rx="3"
        />
      </g>
    ))}
  </svg>
);

const SecurityViz = ({ color }: { color: string }) => (
  <svg className="w-full h-24" viewBox="0 0 200 80" fill="none">
    <circle cx="100" cy="40" r="30" stroke={color} strokeWidth="2" opacity="0.2" fill="none" />
    <circle cx="100" cy="40" r="20" stroke={color} strokeWidth="2" opacity="0.4" fill="none" className="animate-pulse-slow" />
    <circle cx="100" cy="40" r="10" fill={color} opacity="0.8" className="animate-pulse-slow" />
    <path d="M 100 10 L 130 40 L 100 70 L 70 40 Z" stroke={color} strokeWidth="2" fill="none" opacity="0.3" />
  </svg>
);

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // GSAP animations for section entrance
    const perfConfig = getPerformanceConfig();
    let ctx: gsap.Context | null = null;

    // Ensure ScrollTrigger is properly registered and available
    if (!ScrollTrigger || typeof ScrollTrigger.create !== 'function') {
      console.warn('[FeaturesSection] ScrollTrigger not available, skipping animation');
      return;
    }

    const timeoutId = setTimeout(() => {
      if (!sectionRef.current) return;
      
      ctx = gsap.context(() => {
        // Entrance animation for section
        gsap.fromTo(
          sectionRef.current,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: perfConfig.reduceAnimations ? 0.6 : 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }, sectionRef);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (ctx) ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} id="features" className="relative overflow-hidden py-12">

      <div className="relative z-10 container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-full mb-6 backdrop-blur-xl">
            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse-slow" />
            <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              NEXT-GEN FEATURES
            </span>
          </div>
          
          <h2 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-cyan-200">
              Built for Tomorrow
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Experience the future of digital asset protection with our cutting-edge technology stack
          </p>
        </div>

        {/* Horizontal Scroll Carousel Container */}
        <div className="relative w-full">
          <Features3DCarousel 
            features={mainFeatures.map(f => ({
              icon: f.icon,
              title: f.title,
              description: f.description,
              gradient: f.gradient,
              accentColor: f.accentColor,
            }))}
          />
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 30px); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes draw-line {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }

        .animate-float {
          animation: float 20s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 20s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-draw-line {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw-line 2s ease-out forwards;
        }


        @media (prefers-reduced-motion: reduce) {
          .animate-float,
          .animate-float-delayed,
          .animate-pulse-slow,
          .animate-draw-line {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}