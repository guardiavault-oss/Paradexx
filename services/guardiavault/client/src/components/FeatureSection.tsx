import React, { useRef, useEffect, useState } from "react";
import { InteractiveNebulaShader } from "@/components/ui/liquid-shader";
import { logError } from "@/utils/logger";
// Using images from public folder
const guardianImage = "/new-vault-1.png"; // Guardian network with connected phones
const timelockImage = "/schedule.png"; // Schedule/check-in illustration
const blockchainImage = "/blockchain-forever.png"; // Built to last forever illustration
const smartContractsImage = "/contract.png"; // Smart Contracts illustration
const verificationImage = "/family-tree.png"; // Family stays informed illustration
const deathVerificationImage = "/death.png"; // Real Death Verification illustration
// Intelligent Security images
const aiRiskMonitorImage = "/guardian-protocol.png"; // AI Risk Monitor (uses guardian image)
const behavioralBiometricsImage = "/ai-risk-monitor.png"; // Behavioral Biometrics
const guardianProtocolImage = "/zero-trust-architecture.png"; // Guardian Protocol
const zeroTrustImage = "/zero-trust.png"; // Zero Trust Architecture
import { useFadeInUp } from "@/hooks/useGsapScroll";
import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";

import { 
  Users, 
  Clock, 
  Shield, 
  Blocks, 
  Code, 
  FileCheck, 
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Brain,
  Eye,
  Lock,
  Fingerprint,
  TrendingUp,
  Vote
} from "lucide-react";

registerPlugin(ScrollTrigger, "ScrollTrigger");

interface Feature {
  title: string;
  description: string;
  image: string;
  features: string[];
  icon: React.ElementType;
  color: string;
  gradient: string;
  stat?: string;
  statLabel?: string;
  difficulty?: string;
}

const features: Feature[] = [
  {
    title: "Create Your Vault",
    description:
      "Store your wallet access securely — we never hold your keys. Works with MetaMask, Ledger, and mobile wallets. Vaults use 2-of-3 key fragments for recovery. Fully encrypted, decentralized, non-custodial. You stay in control — always.",
    image: guardianImage,
    icon: Shield,
    color: "rgba(59, 130, 246, 1)",
    gradient: "from-blue-500 to-cyan-500",
    stat: "2-of-3",
    statLabel: "Key Fragments",
    difficulty: "Simple Setup",
    features: [
      "Store your wallet access securely — we never hold your keys",
      "Works with MetaMask, Ledger, and mobile wallets",
      "Vaults use 2-of-3 key fragments for recovery",
      "Fully encrypted, decentralized, non-custodial",
      "You stay in control — always",
    ],
  },
  {
    title: "Add Guardians & Beneficiaries",
    description:
      "Choose 2 trusted people. They don't need an account — just an email. Each Guardian gets a secure link to their Guardian Portal. No app, no login, no crypto knowledge needed. Invite bonus: your Guardians get 50% off their own vault. Simple for them, powerful for you.",
    image: guardianImage,
    icon: Users,
    color: "rgba(139, 92, 246, 1)",
    gradient: "from-purple-500 to-pink-500",
    stat: "2",
    statLabel: "Trusted Guardians",
    difficulty: "Easy",
    features: [
      "Choose 2 trusted people — just an email needed",
      "Each Guardian gets a secure link to their Guardian Portal",
      "No app, no login, no crypto knowledge needed",
      "Invite bonus: Guardians get 50% off their own vault",
      "Simple for them, powerful for you",
    ],
  },
  {
    title: "Activate Biometric Check-ins",
    description:
      "'Are you still alive?' but respectfully automated. Periodic check-ins verify you're still active. Uses fingerprint, FaceID, or password fallback. If check-ins fail + death verified → vault recovery starts. Built-in death certificate verification via official databases & oracles.",
    image: timelockImage,
    icon: Fingerprint,
    color: "rgba(34, 197, 94, 1)",
    gradient: "from-green-500 to-emerald-500",
    stat: "24/7",
    statLabel: "Monitoring",
    difficulty: "Automated",
    features: [
      "Periodic check-ins verify you're still active",
      "Uses fingerprint, FaceID, or password fallback",
      "If check-ins fail + death verified → vault recovery starts",
      "Built-in death certificate verification via official databases & oracles",
      "Respectfully automated — no false triggers",
    ],
  },
  {
    title: "Auto-Recovery & Distribution",
    description:
      "If the worst happens — your plan executes automatically. Guardians authenticate → system reconstructs vault (2-of-3). Beneficiaries receive assets, including principal + yield. Optionally, stake idle funds with safe DeFi protocols (Lido, Aave) to earn 3–5% APY. Estate planning that pays for itself.",
    image: blockchainImage,
    icon: TrendingUp,
    color: "rgba(245, 158, 11, 1)",
    gradient: "from-orange-500 to-yellow-500",
    stat: "3–5%",
    statLabel: "APY",
    difficulty: "Automatic",
    features: [
      "Guardians authenticate → system reconstructs vault (2-of-3)",
      "Beneficiaries receive assets, including principal + yield",
      "Optionally stake idle funds with safe DeFi protocols (Lido, Aave)",
      "Earn 3–5% APY — estate planning that pays for itself",
      "Your plan executes automatically",
    ],
  },
  {
    title: "Built to Last Forever",
    description:
      "Your inheritance plan works automatically, even if our company doesn't exist anymore. Once you set it up, it runs on the blockchain forever.",
    image: blockchainImage,
    icon: Blocks,
    color: "rgba(245, 158, 11, 1)",
    gradient: "from-orange-500 to-yellow-500",
    stat: "∞",
    statLabel: "Permanent Protection",
    difficulty: "Immortal",
    features: [
      "Works even if we're gone",
      "Automatic and reliable",
      "No monthly fees after setup",
      "Built on secure blockchain technology",
    ],
  },
  {
    title: "Smart Contracts That Protect You",
    description:
      "Your vault is secured by blockchain smart contracts that automatically execute when conditions are met. No human intervention needed—the code itself ensures your wishes are carried out exactly as you specified, forever.",
    image: smartContractsImage,
    icon: Code,
    color: "rgba(236, 72, 153, 1)",
    gradient: "from-pink-500 to-rose-500",
    stat: "100%",
    statLabel: "Automated",
    difficulty: "Advanced",
    features: [
      "Automatically executes your plan",
      "Open-source and audited code",
      "Immutable once deployed",
      "No one can change the rules",
      "Transparent and verifiable",
      "Works without our company",
    ],
  },
  {
    title: "Real Death Verification™",
    description:
      "We verify death through official records before anything happens. This means your assets stay safe if you just lose your phone or forget to check in. Your family's privacy is always protected.",
    image: deathVerificationImage,
    icon: FileCheck,
    color: "rgba(16, 185, 129, 1)",
    gradient: "from-teal-500 to-cyan-500",
    stat: "5+",
    statLabel: "Verification Sources",
    difficulty: "Comprehensive",
    features: [
      "Official death records checked",
      "Multiple sources verify before release",
      "Won't trigger if you're just traveling",
      "Protects against fraud",
      "Your data is private and encrypted",
      "You control everything",
    ],
  },
  {
    title: "AI Risk Monitor",
    description:
      "Advanced machine learning continuously monitors for suspicious patterns, anomalous behavior, and sophisticated impersonation attempts. Your vault learns and adapts to protect you.",
    image: aiRiskMonitorImage,
    icon: Brain,
    color: "rgba(59, 130, 246, 1)",
    gradient: "from-blue-500 to-cyan-500",
    stat: "24/7",
    statLabel: "Monitoring",
    difficulty: "AI-Powered",
    features: [
      "Detects suspicious login patterns",
      "Identifies anomalous behavior",
      "Stops impersonation attempts",
      "Machine learning adaptation",
      "Real-time threat detection",
      "Continuous security evolution",
    ],
  },
  {
    title: "Behavioral Biometrics",
    description:
      "Your unique typing patterns, mouse movements, and interaction signatures create an unbreakable identity fingerprint. Even if someone steals your password, they can't replicate you.",
    image: behavioralBiometricsImage,
    icon: Eye,
    color: "rgba(139, 92, 246, 1)",
    gradient: "from-purple-500 to-pink-500",
    stat: "99.9%",
    statLabel: "Accuracy",
    difficulty: "Biometric",
    features: [
      "Continuous typing pattern analysis",
      "Mouse movement signature",
      "Interaction behavior tracking",
      "Impossible to replicate",
      "Privacy-preserving technology",
      "Seamless user experience",
    ],
  },
  {
    title: "Guardian Protocol",
    description:
      "Multi-layered authorization system ensures access is only released when you explicitly authorize or verified absence is confirmed. Multiple layers of protection work together.",
    image: guardianProtocolImage,
    icon: Shield,
    color: "rgba(34, 197, 94, 1)",
    gradient: "from-green-500 to-emerald-500",
    stat: "3/5",
    statLabel: "Consensus Required",
    difficulty: "Multi-Layer",
    features: [
      "Multi-layered authorization",
      "Explicit user authorization",
      "Verified absence confirmation",
      "Guardian consensus system",
      "Fragment-based security",
      "No single point of failure",
    ],
  },
  {
    title: "Zero Trust Architecture",
    description:
      "Distributed security model with no single password, no central point of failure, and seamless legacy access protocols. Every interaction is verified, nothing is trusted by default.",
    image: zeroTrustImage,
    icon: Lock,
    color: "rgba(249, 115, 22, 1)",
    gradient: "from-orange-500 to-red-500",
    stat: "0",
    statLabel: "Trust Points",
    difficulty: "Zero Trust",
    features: [
      "No single password system",
      "No central point of failure",
      "Distributed security model",
      "Seamless legacy access",
      "Continuous verification",
      "Assume breach mentality",
    ],
  },
  {
    title: "Biometric Check-in Verification",
    description:
      "Enhanced check-ins with behavioral biometric verification. Your typing patterns and mouse movements create a unique signature that verifies your identity during every check-in. Optional or mandatory based on your security preferences.",
    image: behavioralBiometricsImage,
    icon: Eye,
    color: "rgba(147, 51, 234, 1)",
    gradient: "from-purple-600 to-violet-600",
    stat: "99.9%",
    statLabel: "Accuracy",
    difficulty: "Advanced Security",
    features: [
      "Typing pattern analysis",
      "Mouse movement signature",
      "Real-time identity verification",
      "Optional or mandatory",
      "No additional hardware needed",
      "Continuous learning",
    ],
  },
  {
    title: "Automated Death Certificate Verification",
    description:
      "Multi-source death verification with automatic official certificate ordering. When death is suspected from other sources (SSDI, obituaries), we automatically order official death certificates for 100% verified confirmation. No manual steps required.",
    image: deathVerificationImage,
    icon: FileCheck,
    color: "rgba(220, 38, 38, 1)",
    gradient: "from-red-600 to-rose-600",
    stat: "100%",
    statLabel: "Official Confirmation",
    difficulty: "Enterprise Grade",
    features: [
      "Automatic certificate ordering",
      "Multi-source verification",
      "Official government records",
      "VitalChek integration",
      "State API support",
      "Automatic vault triggering",
    ],
  },
  {
    title: "Yield-Generating Vaults",
    description:
      "Your vault funds earn yield while waiting. Automatically stakes in secure, audited protocols like Lido, Aave, and Compound. Only 1% performance fee on earnings—keep 99% of your yield. Your principal is always protected.",
    image: blockchainImage,
    icon: Sparkles,
    color: "rgba(34, 197, 94, 1)",
    gradient: "from-emerald-500 to-green-500",
    stat: "1%",
    statLabel: "Performance Fee",
    difficulty: "Passive Income",
    features: [
      "Auto-staking in secure protocols",
      "3-5% APY on average",
      "Only 1% fee on yield",
      "Principal always protected",
      "Lido, Aave, Compound support",
      "Funds auto-unstake on trigger",
    ],
  },
  {
    title: "dao-based Verification",
    description:
      "Community-driven verification system powered by staked verifiers. Stake tokens to become a verifier, vote on claims, and earn reputation. Higher reputation means higher vote weight. Prevents fraud through decentralized consensus.",
    image: guardianImage,
    icon: Users,
    color: "rgba(59, 130, 246, 1)",
    gradient: "from-blue-600 to-cyan-600",
    stat: "2/3",
    statLabel: "Threshold",
    difficulty: "Decentralized",
    features: [
      "Community verifiers",
      "Reputation-based voting",
      "Stake tokens to participate",
      "Auto-resolution at 2/3",
      "Prevents fraud",
      "Transparent process",
    ],
  },
];

// Progress Indicator Component
const ProgressIndicator: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col gap-3">
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className="relative group"
        >
          <div
            className={`w-3 h-3 rounded-full transition-all duration-500 ${
              index === current
                ? "bg-primary scale-125 shadow-lg shadow-primary/50"
                : index < current
                ? "bg-primary/50"
                : "bg-white/20"
            }`}
          />
          {index === current && (
            <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
          )}
        </div>
      ))}
    </div>
  );
};

// Animated Counter Component
const AnimatedStat: React.FC<{ stat: string; label: string; color: string }> = ({ 
  stat, 
  label,
  color 
}) => {
  const statRef = useRef<HTMLDivElement>(null);
  const [displayStat, setDisplayStat] = useState(stat);

  useEffect(() => {
    if (!statRef.current) return;

    ScrollTrigger.create({
      trigger: statRef.current,
      start: "top 80%",
      once: true,
      onEnter: () => {
        // Animate number if it's numeric
        const numMatch = stat.match(/\d+/);
        if (numMatch) {
          const targetNum = parseInt(numMatch[0]);
          const obj = { value: 0 };
          gsap.to(obj, {
            value: targetNum,
            duration: 2,
            ease: "power2.out",
            onUpdate: () => {
              setDisplayStat(stat.replace(/\d+/, Math.floor(obj.value).toString()));
            },
          });
        }
      },
    });
  }, [stat]);

  return (
    <div ref={statRef} className="text-center">
      <div 
        className="text-5xl md:text-6xl font-black mb-2"
        style={{ color }}
      >
        {displayStat}
      </div>
      <div className="text-sm uppercase tracking-wider font-bold text-white/60">
        {label}
      </div>
    </div>
  );
};

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const card3dRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  // Enhanced 3D card mouse interaction with depth
  useEffect(() => {
    const card3d = card3dRef.current;
    const imageContainer = imageContainerRef.current;
    if (!card3d || !imageContainer) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card3d.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 40;
      const rotateY = (centerX - x) / 40;
      const moveX = (x - centerX) / 50;
      const moveY = (y - centerY) / 50;
      
      // Apply 3D transform with parallax
      gsap.to(imageContainer, {
        rotateX: rotateX,
        rotateY: rotateY,
        x: moveX,
        y: moveY,
        transformPerspective: 1500,
        transformOrigin: "center center",
        duration: 0.4,
        ease: "power2.out",
      });

      // Animate particles
      const particles = card3d.querySelectorAll('.float-particle');
      particles.forEach((particle, i) => {
        gsap.to(particle, {
          x: moveX * (i + 1) * 0.5,
          y: moveY * (i + 1) * 0.5,
          duration: 0.6,
          ease: "power2.out",
        });
      });

      // Dynamic shadow
      const shadowElement = card3d.querySelector('.card-shadow') as HTMLElement;
      if (shadowElement) {
        const opacity = Math.min(0.4, Math.abs(rotateX) * 0.04 + Math.abs(rotateY) * 0.04);
        gsap.to(shadowElement, {
          opacity: opacity,
          x: -rotateY * 2,
          y: -rotateX * 2,
          duration: 0.4,
        });
      }
    };

    const handleMouseLeave = () => {
      gsap.to(imageContainer, {
        rotateX: 0,
        rotateY: 0,
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
      });

      const particles = card3d.querySelectorAll('.float-particle');
      particles.forEach((particle) => {
        gsap.to(particle, {
          x: 0,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
        });
      });

      const shadowElement = card3d.querySelector('.card-shadow') as HTMLElement;
      if (shadowElement) {
        gsap.to(shadowElement, {
          opacity: 0,
          x: 0,
          y: 0,
          duration: 0.8,
        });
      }
    };

    card3d.addEventListener("mousemove", handleMouseMove);
    card3d.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card3d.removeEventListener("mousemove", handleMouseMove);
      card3d.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    if (!cardRef.current || !imageRef.current || !listRef.current || !titleRef.current || !descriptionRef.current) return;

    const isReverse = index % 2 === 1;

    const ctx = gsap.context(() => {
      // Card entrance with scale and fade
      gsap.fromTo(
        cardRef.current,
        {
          opacity: 0,
          y: 100,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          ease: "power4.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 90%",
            end: "top 50%",
            scrub: 2,
            onEnter: () => setIsInView(true),
            onLeave: () => setIsInView(false),
            onEnterBack: () => setIsInView(true),
            onLeaveBack: () => setIsInView(false),
          },
        }
      );

      // Enhanced 3D image entrance
      gsap.fromTo(
        imageRef.current,
        {
          opacity: 0,
          scale: 0.85,
          z: -200,
          rotateX: isReverse ? 15 : -15,
          rotateY: isReverse ? -10 : 10,
        },
        {
          opacity: 1,
          scale: 1,
          z: 0,
          rotateX: 0,
          rotateY: 0,
          ease: "power4.out",
          scrollTrigger: {
            trigger: imageRef.current,
            start: "top 90%",
            end: "top 40%",
            scrub: 2.5,
          },
        }
      );

      // Animated title with character split
      const titleText = feature.title;
      let titleChars: (HTMLSpanElement | HTMLBRElement)[] = [];
      
      // Special handling for "Smart Contracts That Protect You" - add line break before "That"
      if (titleText === "Smart Contracts That Protect You") {
        const beforeBreak = "Smart Contracts ";
        const afterBreak = "That Protect You";
        
        // Split and create spans for "Smart Contracts "
        const beforeChars = beforeBreak.split("").map((char) => {
          const span = document.createElement("span");
          span.textContent = char === " " ? "\u00A0" : char;
          span.style.display = "inline-block";
          return span;
        });
        
        // Add line break
        const br = document.createElement("br");
        
        // Split and create spans for "That Protect You"
        const afterChars = afterBreak.split("").map((char) => {
          const span = document.createElement("span");
          span.textContent = char === " " ? "\u00A0" : char;
          span.style.display = "inline-block";
          return span;
        });
        
        titleChars = [...beforeChars, br, ...afterChars];
      } else if (titleText === "Share With People You Trust") {
        // Special handling for "Share With People You Trust" - add line break after "Share With"
        const beforeBreak = "Share With ";
        const afterBreak = "People You Trust";
        
        // Split and create spans for "Share With "
        const beforeChars = beforeBreak.split("").map((char) => {
          const span = document.createElement("span");
          span.textContent = char === " " ? "\u00A0" : char;
          span.style.display = "inline-block";
          return span;
        });
        
        // Add line break
        const br = document.createElement("br");
        
        // Split and create spans for "People You Trust"
        const afterChars = afterBreak.split("").map((char) => {
          const span = document.createElement("span");
          span.textContent = char === " " ? "\u00A0" : char;
          span.style.display = "inline-block";
          return span;
        });
        
        titleChars = [...beforeChars, br, ...afterChars];
      } else if (titleText === "Your Family Stays Informed") {
        // Special handling for "Your Family Stays Informed" - add line break after "Your Family"
        const beforeBreak = "Your Family ";
        const afterBreak = "Stays Informed";
        
        // Split and create spans for "Your Family "
        const beforeChars = beforeBreak.split("").map((char) => {
          const span = document.createElement("span");
          span.textContent = char === " " ? "\u00A0" : char;
          span.style.display = "inline-block";
          return span;
        });
        
        // Add line break
        const br = document.createElement("br");
        
        // Split and create spans for "Stays Informed"
        const afterChars = afterBreak.split("").map((char) => {
          const span = document.createElement("span");
          span.textContent = char === " " ? "\u00A0" : char;
          span.style.display = "inline-block";
          return span;
        });
        
        titleChars = [...beforeChars, br, ...afterChars];
      } else if (titleText === "Zero Trust Architecture") {
        // Special handling for "Zero Trust Architecture" - add line break after "Zero Trust"
        const beforeBreak = "Zero Trust ";
        const afterBreak = "Architecture";
        
        // Split and create spans for "Zero Trust "
        const beforeChars = beforeBreak.split("").map((char) => {
          const span = document.createElement("span");
          span.textContent = char === " " ? "\u00A0" : char;
          span.style.display = "inline-block";
          return span;
        });
        
        // Add line break
        const br = document.createElement("br");
        
        // Split and create spans for "Architecture"
        const afterChars = afterBreak.split("").map((char) => {
          const span = document.createElement("span");
          span.textContent = char === " " ? "\u00A0" : char;
          span.style.display = "inline-block";
          return span;
        });
        
        titleChars = [...beforeChars, br, ...afterChars];
      } else if (titleText === "Yield-Generating Vaults") {
        // Special handling for "Yield-Generating Vaults" - add line break after "Yield-Generating"
        const beforeBreak = "Yield-Generating ";
        const afterBreak = "Vaults";
        
        // Split and create spans for "Yield-Generating "
        const beforeChars = beforeBreak.split("").map((char) => {
          const span = document.createElement("span");
          span.textContent = char === " " ? "\u00A0" : char;
          span.style.display = "inline-block";
          return span;
        });
        
        // Add line break
        const br = document.createElement("br");
        
        // Split and create spans for "Vaults"
        const afterChars = afterBreak.split("").map((char) => {
          const span = document.createElement("span");
          span.textContent = char === " " ? "\u00A0" : char;
          span.style.display = "inline-block";
          return span;
        });
        
        titleChars = [...beforeChars, br, ...afterChars];
      } else if (titleText === "dao-based Verification" || titleText === "DAO-Based Verification") {
        // Special handling for "dao-based Verification" - add line break after "dao-based", lowercase for first part
        const beforeBreak = "dao-based ";
        const afterBreak = "Verification";
        
        // Split and create spans for "dao-based "
        const beforeChars = beforeBreak.split("").map((char) => {
          const span = document.createElement("span");
          span.textContent = char === " " ? "\u00A0" : char;
          span.style.display = "inline-block";
          return span;
        });
        
        // Add line break
        const br = document.createElement("br");
        
        // Split and create spans for "Verification"
        const afterChars = afterBreak.split("").map((char) => {
          const span = document.createElement("span");
          span.textContent = char === " " ? "\u00A0" : char;
          span.style.display = "inline-block";
          return span;
        });
        
        titleChars = [...beforeChars, br, ...afterChars];
      } else {
        // Default character split for other titles
        titleChars = titleText.split("").map((char) => {
          const span = document.createElement("span");
          span.textContent = char === " " ? "\u00A0" : char;
          span.style.display = "inline-block";
          return span;
        });
      }

      if (titleRef.current) {
        titleRef.current.innerHTML = "";
        titleChars.forEach((element) => titleRef.current?.appendChild(element));

        // Animate only span elements (not br)
        const spanElements = titleChars.filter(el => el.tagName === 'SPAN') as HTMLSpanElement[];
        
        gsap.fromTo(
          spanElements,
          {
            opacity: 0,
            y: 60,
            rotateX: -90,
            scale: 0.8,
          },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
            stagger: 0.02,
            ease: "back.out(2)",
            scrollTrigger: {
              trigger: titleRef.current,
              start: "top 85%",
              end: "top 45%",
              scrub: 1.8,
            },
          }
        );
      }

      // Description word animation
      const descriptionWords = feature.description.split(" ");
      if (descriptionRef.current) {
        descriptionRef.current.innerHTML = "";
        descriptionWords.forEach((word, i) => {
          const span = document.createElement("span");
          span.textContent = word + (i < descriptionWords.length - 1 ? "\u00A0" : "");
          span.style.display = "inline-block";
          span.style.marginRight = "0.25em";
          descriptionRef.current?.appendChild(span);
        });

        gsap.fromTo(
          descriptionRef.current.children,
          {
            opacity: 0,
            y: 30,
            scale: 0.9,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.03,
            ease: "power3.out",
            scrollTrigger: {
              trigger: descriptionRef.current,
              start: "top 85%",
              end: "top 35%",
              scrub: 1.5,
            },
          }
        );
      }

      // Feature list with enhanced stagger
      if (!listRef.current) return;
      gsap.fromTo(
        listRef.current.children,
        {
          opacity: 0,
          x: -40,
          scale: 0.85,
        },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          stagger: 0.08,
          ease: "back.out(1.5)",
          scrollTrigger: {
            trigger: listRef.current,
            start: "top 85%",
            end: "top 25%",
            scrub: 1.2,
          },
        }
      );
    }, cardRef);

    return () => ctx.revert();
  }, [index, feature]);

  return (
    <div
      ref={cardRef}
      className={`grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 lg:gap-32 xl:gap-40 2xl:gap-56 items-center relative ${
        index % 2 === 1 ? "lg:flex-row-reverse" : ""
      }`}
    >
      {/* Step Number Indicator */}
      <div className="absolute -top-12 left-0 flex items-center gap-4">
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}10)`,
            border: `2px solid ${feature.color}40`,
            boxShadow: `0 0 30px ${feature.color}20`,
          }}
        >
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${feature.color}10, transparent)`,
            }}
          />
          <span style={{ color: feature.color }}>
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        
        {feature.difficulty && (
          <div className="px-4 py-2 rounded-full backdrop-blur-sm" style={{
            background: `${feature.color}15`,
            border: `1px solid ${feature.color}30`,
          }}>
            <span className="text-sm font-bold" style={{ color: feature.color }}>
              {feature.difficulty}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className={`${index % 2 === 1 ? "lg:order-2" : ""} space-y-8`}>
        {/* Icon Badge */}
        <div 
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${feature.color}25, ${feature.color}15)`,
            border: `2px solid ${feature.color}50`,
            boxShadow: `0 0 40px ${feature.color}25`,
          }}
        >
          <div 
            className="absolute inset-0 animate-pulse"
            style={{
              background: `radial-gradient(circle, ${feature.color}20, transparent 70%)`,
            }}
          />
          <feature.icon 
            className="w-10 h-10 relative z-10" 
            style={{ color: feature.color }}
          />
        </div>

        {/* Stat Display */}
        {feature.stat && feature.statLabel && (
          <div 
            className="inline-block p-6 rounded-2xl backdrop-blur-xl"
            style={{
              background: `linear-gradient(135deg, ${feature.color}15, ${feature.color}08)`,
              border: `2px solid ${feature.color}30`,
              boxShadow: `0 0 40px ${feature.color}15`,
            }}
          >
            <AnimatedStat 
              stat={feature.stat} 
              label={feature.statLabel}
              color={feature.color}
            />
          </div>
        )}

        <h3 
          ref={titleRef}
          className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black font-display text-white leading-tight ${
            feature.title === "Set Your Own Schedule" ||
            feature.title === "Built to Last Forever" ||
            feature.title === "Real Death Verification™"
              ? "md:whitespace-nowrap"
              : ""
          }`}
        />
        
        <p 
          ref={descriptionRef}
          className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/70 leading-relaxed font-light"
        />
        
        <ul ref={listRef} className="space-y-4">
          {feature.features.map((item, i) => (
            <li 
              key={item} 
              className="flex items-start gap-4 group/item"
            >
              <div 
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-1 group-hover/item:scale-110 transition-transform duration-300"
                style={{
                  background: `linear-gradient(135deg, ${feature.color}40, ${feature.color}20)`,
                  boxShadow: `0 0 20px ${feature.color}30`,
                }}
              >
                <CheckCircle2 
                  className="w-4 h-4" 
                  style={{ color: feature.color }}
                />
              </div>
              <span className="text-white/85 text-lg leading-relaxed">
                {item}
              </span>
            </li>
          ))}
        </ul>

        {/* Connection Line to Next Step */}
        {index < features.length - 1 && (
          <div className="hidden lg:flex items-center gap-3 pt-8 text-white/40">
            <ArrowRight className="w-5 h-5" />
            <span className="text-sm uppercase tracking-wider font-semibold">
              Next Step
            </span>
          </div>
        )}
      </div>

      {/* Image Section */}
      <div className={`${index % 2 === 1 ? "lg:order-1" : ""}`}>
        <div
          ref={card3dRef}
          className="perspective-container relative"
          style={{ perspective: "2000px" }}
        >
          <div
            ref={imageContainerRef}
            className="relative cursor-pointer"
            style={{ transformStyle: "preserve-3d" }}
          >
              <div 
              ref={imageRef}
              className="relative w-full h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] xl:h-[550px] flex items-center justify-center"
              style={{
                transformStyle: "preserve-3d",
              }}
            >
              {/* 3D Shadow with dynamic movement */}
              <div 
                className="card-shadow absolute inset-0 rounded-3xl opacity-0 pointer-events-none"
                style={{ 
                  transform: "translateZ(-120px) scale(1.3)",
                  background: `radial-gradient(ellipse, ${feature.color}30, transparent 70%)`,
                  filter: "blur(60px)",
                }}
              />
              
              {/* Premium Glassmorphism Frame */}
              <div 
                className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden backdrop-blur-2xl"
                style={{ 
                  transform: "translateZ(10px)",
                  background: `linear-gradient(135deg, ${feature.color}08, ${feature.color}03)`,
                  boxShadow: `
                    inset 0 2px 4px rgba(255, 255, 255, 0.15),
                    0 0 80px ${feature.color}20,
                    0 20px 60px rgba(0, 0, 0, 0.4),
                    inset 0 -2px 6px rgba(0, 0, 0, 0.4)
                  `,
                }}
              />

              {/* Animated Border */}
              <div 
                className="absolute -inset-[2px] rounded-3xl pointer-events-none"
                style={{ 
                  transform: "translateZ(12px)",
                  background: `linear-gradient(135deg, ${feature.color}40, ${feature.color}20, ${feature.color}40)`,
                  backgroundSize: "200% 200%",
                  animation: `borderFlow ${3 + index}s ease infinite`,
                  padding: "2px",
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  maskComposite: "exclude",
                }}
              />

              {/* Inner glow frame */}
              <div 
                className="absolute inset-[12px] rounded-2xl pointer-events-none"
                style={{ 
                  transform: "translateZ(20px)",
                  border: `2px solid ${feature.color}25`,
                  background: `linear-gradient(135deg, ${feature.color}08, transparent)`,
                  boxShadow: `inset 0 0 60px ${feature.color}15`,
                }}
              />

              {/* Corner Brackets - Enhanced */}
              {[
                { top: 4, left: 4, border: "border-t-3 border-l-3", rounded: "rounded-tl-xl" },
                { top: 4, right: 4, border: "border-t-3 border-r-3", rounded: "rounded-tr-xl" },
                { bottom: 4, left: 4, border: "border-b-3 border-l-3", rounded: "rounded-bl-xl" },
                { bottom: 4, right: 4, border: "border-b-3 border-r-3", rounded: "rounded-br-xl" },
              ].map((corner, i) => (
                <div
                  key={i}
                  className="absolute w-12 h-12 pointer-events-none"
                  style={{ 
                    ...corner,
                    transform: "translateZ(30px)",
                  }}
                >
                  <div 
                    className={`w-10 h-10 ${corner.border} ${corner.rounded}`}
                    style={{ borderColor: `${feature.color}60` }}
                  />
                  <div 
                    className={`absolute inset-0 w-8 h-8 ${corner.border} ${corner.rounded}`}
                    style={{ borderColor: `${feature.color}40` }}
                  />
                  <div 
                    className="absolute inset-0 w-12 h-12 blur-md"
                    style={{ background: `${feature.color}15` }}
                  />
                </div>
              ))}
              
              {/* Main Image with enhanced effects */}
              <div 
                className="relative w-full h-full flex items-center"
                style={{ 
                  transform: "translateZ(35px)",
                  padding: index === 0 ? "24px" : "48px",
                  justifyContent: index === 0 ? "flex-end" : "center",
                }}
              >
                {/* Image container with glassmorphism backer for first image */}
                {index === 0 ? (
                  <div className="relative" style={{ transform: "scale(1.2) translateX(-10%)", zIndex: 10 }}>
                    {/* Glassmorphism backer - directly behind image - made larger and more visible */}
                    <div 
                      className="absolute rounded-2xl pointer-events-none"
                      style={{
                        top: "-8%",
                        left: "-8%",
                        right: "-8%",
                        bottom: "-8%",
                        width: "116%",
                        height: "116%",
                        background: `linear-gradient(135deg, ${feature.color}40, ${feature.color}30, ${feature.color}35)`,
                        backdropFilter: "blur(60px)",
                        WebkitBackdropFilter: "blur(60px)",
                        boxShadow: `
                          0 0 100px ${feature.color}50,
                          0 0 150px ${feature.color}40,
                          inset 0 0 80px ${feature.color}30,
                          inset 0 0 120px ${feature.color}20
                        `,
                        border: `3px solid ${feature.color}50`,
                        opacity: 1,
                        zIndex: 0,
                      }}
                    />
                    {/* Foggy glow layer behind */}
                    <div 
                      className="absolute rounded-2xl pointer-events-none"
                      style={{
                        top: "-10%",
                        left: "-10%",
                        right: "-10%",
                        bottom: "-10%",
                        width: "120%",
                        height: "120%",
                        background: `radial-gradient(ellipse at center, ${feature.color}40, transparent 60%)`,
                        filter: "blur(70px)",
                        opacity: 0.9,
                        zIndex: -1,
                      }}
                    />
                    {/* Additional depth fog */}
                    <div 
                      className="absolute rounded-2xl pointer-events-none"
                      style={{
                        top: "-12%",
                        left: "-12%",
                        right: "-12%",
                        bottom: "-12%",
                        width: "124%",
                        height: "124%",
                        background: `radial-gradient(ellipse at 60% 40%, ${feature.color}30, transparent 70%)`,
                        filter: "blur(90px)",
                        opacity: 0.8,
                        zIndex: -2,
                      }}
                    />
                    {/* Image */}
                    <img
                      src={feature.image}
                      alt={feature.title}
                      loading="lazy"
                      className="w-[120%] h-[120%] max-w-none max-h-none object-contain transition-transform duration-700 relative"
                      style={{
                        filter: `
                          drop-shadow(0 40px 80px rgba(0, 0, 0, 0.5)) 
                          drop-shadow(0 0 40px ${feature.color}30)
                          brightness(1.1)
                          contrast(1.05)
                          drop-shadow(0 0 60px ${feature.color}40)
                        `,
                        zIndex: 2,
                      }}
                      onError={(e) => {
                        logError(new Error(`Failed to load image: ${feature.image}`), {
                          context: "FeatureSection",
                          image: feature.image,
                        });
                      }}
                    />
                    {/* Border dashes around image - positioned after image to ensure visibility */}
                    <div className="absolute pointer-events-none" style={{ 
                      top: "-4px",
                      left: "-4px",
                      right: "-4px",
                      bottom: "-4px",
                      zIndex: 5,
                    }}>
                      {/* Top border */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{
                          background: `repeating-linear-gradient(to right, ${feature.color}CC 0px, ${feature.color}CC 10px, transparent 10px, transparent 20px)`,
                        }}
                      />
                      {/* Bottom border */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-1"
                        style={{
                          background: `repeating-linear-gradient(to right, ${feature.color}CC 0px, ${feature.color}CC 10px, transparent 10px, transparent 20px)`,
                        }}
                      />
                      {/* Left border */}
                      <div 
                        className="absolute top-0 bottom-0 left-0 w-1"
                        style={{
                          background: `repeating-linear-gradient(to bottom, ${feature.color}CC 0px, ${feature.color}CC 10px, transparent 10px, transparent 20px)`,
                        }}
                      />
                      {/* Right border - ensure it's visible */}
                      <div 
                        className="absolute top-0 bottom-0 right-0 w-1"
                        style={{
                          background: `repeating-linear-gradient(to bottom, ${feature.color}CC 0px, ${feature.color}CC 10px, transparent 10px, transparent 20px)`,
                          zIndex: 6,
                        }}
                      />
                      {/* Corner brackets */}
                      <div 
                        className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-lg"
                        style={{ borderColor: `${feature.color}CC` }}
                      />
                      <div 
                        className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 rounded-tr-lg"
                        style={{ borderColor: `${feature.color}CC`, zIndex: 7 }}
                      />
                      <div 
                        className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 rounded-bl-lg"
                        style={{ borderColor: `${feature.color}CC` }}
                      />
                      <div 
                        className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-lg"
                        style={{ borderColor: `${feature.color}CC`, zIndex: 7 }}
                      />
                    </div>
                  </div>
                ) : (
                  <img
                    src={feature.image}
                    alt={feature.title}
                    loading="lazy"
                    className="max-w-full max-h-full object-contain transition-transform duration-700"
                    style={{
                      filter: `
                        drop-shadow(0 40px 80px rgba(0, 0, 0, 0.5)) 
                        drop-shadow(0 0 40px ${feature.color}30)
                        brightness(1.1)
                        contrast(1.05)
                      `,
                    }}
                    onError={(e) => {
                      logError(new Error(`Failed to load image: ${feature.image}`), {
                        context: "FeatureSection",
                        image: feature.image,
                      });
                    }}
                  />
                )}
              </div>

              {/* Floating particles with individual animations */}
              <div 
                className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden"
                style={{ transform: "translateZ(40px)" }}
              >
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="float-particle absolute rounded-full animate-pulse"
                    style={{
                      width: `${8 + i * 4}px`,
                      height: `${8 + i * 4}px`,
                      background: `radial-gradient(circle, ${feature.color}40, ${feature.color}10)`,
                      left: `${15 + i * 12}%`,
                      top: `${10 + i * 15}%`,
                      filter: "blur(4px)",
                      animationDelay: `${i * 0.3}s`,
                      boxShadow: `0 0 20px ${feature.color}40`,
                    }}
                  />
                ))}
              </div>

              {/* Ambient glow orbs */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{ transform: "translateZ(45px)" }}
              >
                <div 
                  className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full animate-pulse"
                  style={{
                    background: `radial-gradient(circle, ${feature.color}20, transparent 70%)`,
                    filter: "blur(40px)",
                  }}
                />
                <div 
                  className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full animate-pulse"
                  style={{
                    background: `radial-gradient(circle, ${feature.color}15, transparent 70%)`,
                    filter: "blur(50px)",
                    animationDelay: "1.5s",
                  }}
                />
              </div>

              {/* Depth layers for parallax */}
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-0 rounded-3xl pointer-events-none"
                  style={{
                    transform: `translateZ(${-30 - i * 20}px) scale(${1.05 + i * 0.05})`,
                    background: `radial-gradient(ellipse at center, ${feature.color}${String(8 - i * 2).padStart(2, '0')}, transparent 70%)`,
                    filter: `blur(${10 + i * 10}px)`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeatureSection() {
  const titleRef = useFadeInUp();
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const shaderContainerRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Track which feature is in view
    const triggers = features.map((_, index) => {
      return ScrollTrigger.create({
        trigger: `#feature-${index}`,
        start: "top 60%",
        end: "bottom 40%",
        onEnter: () => setCurrentStep(index),
        onEnterBack: () => setCurrentStep(index),
      });
    });

    return () => {
      triggers.forEach(trigger => trigger.kill());
    };
  }, []);

  // Update shader container height to match section height
  useEffect(() => {
    const updateShaderHeight = () => {
      if (sectionRef.current && shaderContainerRef.current) {
        const sectionHeight = sectionRef.current.scrollHeight;
        shaderContainerRef.current.style.height = `${sectionHeight}px`;
        // Also update overlay divs
        const overlayDivs = sectionRef.current.querySelectorAll('.shader-overlay');
        overlayDivs.forEach((div) => {
          (div as HTMLElement).style.height = `${sectionHeight}px`;
        });
      }
    };

    updateShaderHeight();
    
    // Update on resize and content changes
    window.addEventListener('resize', updateShaderHeight);
    const observer = new ResizeObserver(updateShaderHeight);
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    // Also update after a short delay to ensure content is loaded
    const timeoutId = window.setTimeout(updateShaderHeight, 100);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('resize', updateShaderHeight);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!subtitleRef.current) return;

    gsap.fromTo(
      subtitleRef.current,
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        ease: "power3.out",
        scrollTrigger: {
          trigger: subtitleRef.current,
          start: "top 90%",
          end: "top 60%",
          scrub: 1.5,
        },
      }
    );
  }, []);

  return (
    <section ref={sectionRef} className="py-16 sm:py-24 md:py-32 pb-16 sm:pb-32 md:pb-48 bg-background relative" id="features" style={{ overflowX: 'hidden' }}>
      {/* Interactive Nebula Shader Background - lazy loaded when section is in view */}
      <div ref={shaderContainerRef} className="absolute inset-0 z-0 pointer-events-none" style={{ top: 0, left: 0, right: 0, bottom: 'auto' }}>
        <InteractiveNebulaShader 
          disableCenterDimming={true}
          fixed={false}
          className="w-full h-full"
        />
      </div>
      
      {/* Overlay for better content readability - reduced opacity to show shader */}
      <div className="shader-overlay absolute inset-0 bg-background/30 z-10 pointer-events-none" style={{ top: 0, left: 0, right: 0, bottom: 'auto' }} />
      
      {/* Multi-layer Background Enhancement */}
      <div className="shader-overlay absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent z-10 pointer-events-none" style={{ top: 0, left: 0, right: 0, bottom: 'auto' }} />

      {/* Progress Indicator */}
      <ProgressIndicator current={currentStep} total={features.length} />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20 lg:mb-24">
          <div className="inline-flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8 px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-primary/10 border-2 border-primary/30 rounded-full backdrop-blur-sm">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary animate-pulse" />
            <span className="text-sm sm:text-base md:text-lg font-bold text-primary uppercase tracking-wider">
              Complete Protection System
            </span>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary animate-pulse" />
          </div>

          <h2 
            ref={titleRef}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl font-black font-display mb-4 sm:mb-6 md:mb-8 tracking-tight leading-tight sm:leading-none bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70"
          >
            🔐 The Solution: The GuardiaVault Protocol
          </h2>
          
          <p 
            ref={subtitleRef}
            className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-white/60 max-w-4xl mx-auto font-light leading-relaxed px-2"
          >
            GuardiaVault protects your crypto through biometric vaults, key fragments, and trusted Guardians — ensuring your assets can always be recovered safely, by the right people.
          </p>
          
          <p className="text-lg sm:text-xl md:text-2xl text-white/80 max-w-4xl mx-auto font-semibold leading-relaxed px-2 mt-4">
            🧭 Here's how it works:
          </p>

          {/* Feature Count */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-12 mt-8 sm:mt-12 md:mt-16">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-primary mb-1 sm:mb-2">10</div>
              <div className="text-xs sm:text-sm uppercase tracking-wider text-white/50 font-bold">
                Security Layers
              </div>
            </div>
            <div className="w-px h-12 sm:h-14 md:h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            <div className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-primary mb-1 sm:mb-2">100%</div>
              <div className="text-xs sm:text-sm uppercase tracking-wider text-white/50 font-bold">
                Automated
              </div>
            </div>
            <div className="w-px h-12 sm:h-14 md:h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            <div className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-primary mb-1 sm:mb-2">∞</div>
              <div className="text-xs sm:text-sm uppercase tracking-wider text-white/50 font-bold">
                Forever
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="space-y-24 sm:space-y-32 md:space-y-40 lg:space-y-48 xl:space-y-56">
          {features.map((feature, index) => {
            // Add separator after "Smart Contracts That Protect You" (index 2)
            const showSeparator = index === 2;
            
            return (
              <React.Fragment key={feature.title}>
                <div id={`feature-${index}`}>
                  <FeatureCard feature={feature} index={index} />
                </div>
                {showSeparator && (
                  <div className="text-center py-8 sm:py-12 md:py-16">
                    <div className="inline-block px-8 sm:px-12 md:px-16 py-4 sm:py-6 md:py-8 rounded-2xl backdrop-blur-xl border-2 border-primary/30 bg-primary/10">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-primary uppercase tracking-wider">
                        FEATURES
                      </h2>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

      </div>

      <style>{`
        @keyframes borderFlow {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .delay-1000 {
          animation-delay: 1s;
        }

        .border-t-3 {
          border-top-width: 3px;
        }

        .border-b-3 {
          border-bottom-width: 3px;
        }

        .border-l-3 {
          border-left-width: 3px;
        }

        .border-r-3 {
          border-right-width: 3px;
        }
      `}</style>
    </section>
  );
}