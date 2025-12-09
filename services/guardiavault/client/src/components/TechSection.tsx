import React, { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Lock, 
  Network, 
  Code, 
  Fingerprint,
  Wallet,
  Server
} from "lucide-react";
import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";


registerPlugin(ScrollTrigger, "ScrollTrigger");

interface TechItem {
  icon: React.ElementType;
  name: string;
  description: string;
  color: string;
}

const techStack: TechItem[] = [
  {
    icon: Lock,
    name: "AES-256 + MPC",
    description: "Advanced encryption with Multi-Party Computation for secure key fragmenting",
    color: "rgba(59, 130, 246, 1)",
  },
  {
    icon: Network,
    name: "Chainlink Oracle",
    description: "Decentralized verification for death certificates and official records",
    color: "rgba(139, 92, 246, 1)",
  },
  {
    icon: Code,
    name: "EIP-4337 Smart Accounts",
    description: "Account abstraction for seamless wallet interactions and recovery",
    color: "rgba(34, 197, 94, 1)",
  },
  {
    icon: Fingerprint,
    name: "Biometric & Hardware Wallets",
    description: "Support for fingerprint, FaceID, and Ledger/Trezor hardware wallets",
    color: "rgba(245, 158, 11, 1)",
  },
  {
    icon: Server,
    name: "Secure Backend",
    description: "Built with Solidity + Node + Next.js for enterprise-grade security",
    color: "rgba(236, 72, 153, 1)",
  },
];

export default function TechSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!titleRef.current) return;

    gsap.fromTo(
      titleRef.current,
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }, []);

  useEffect(() => {
    if (!cardsRef.current) return;

    gsap.fromTo(
      cardsRef.current.children,
      {
        opacity: 0,
        y: 60,
        scale: 0.9,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: "back.out(1.2)",
        scrollTrigger: {
          trigger: cardsRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-background via-primary/5 to-background relative overflow-hidden"
      id="tech"
    >
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div ref={titleRef} className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black font-display mb-4 sm:mb-6 tracking-tight text-white">
            🔒 Tech Behind the Magic
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-3xl mx-auto">
            Enterprise-grade security built on proven cryptographic protocols
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {techStack.map((tech, index) => (
            <Card
              key={index}
              className="backdrop-blur-xl border-2 hover-elevate transition-all duration-300 relative overflow-hidden group"
              style={{
                borderColor: `${tech.color}40`,
                background: `linear-gradient(135deg, ${tech.color}08, transparent)`,
              }}
            >
              <CardContent className="p-6 sm:p-8">
                <div className="mb-4 sm:mb-6">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                    style={{
                      background: `radial-gradient(circle, ${tech.color}30, ${tech.color}10)`,
                      border: `2px solid ${tech.color}50`,
                      boxShadow: `0 0 30px ${tech.color}30`,
                    }}
                  >
                    <tech.icon
                      className="w-8 h-8"
                      style={{ color: tech.color }}
                    />
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold font-display mb-3 text-white">
                    {tech.name}
                  </h3>
                </div>
                
                <p className="text-white/75 leading-relaxed text-sm sm:text-base">
                  {tech.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 sm:mt-16 text-center">
          <p className="text-lg sm:text-xl md:text-2xl text-white/80 font-semibold max-w-4xl mx-auto px-4">
            🌍 The Future of Digital Legacy
          </p>
          <p className="text-base sm:text-lg text-white/70 mt-4 max-w-3xl mx-auto px-4 leading-relaxed">
            GuardiaVault is redefining what happens to crypto after life.
            <br />
            <span className="font-semibold text-white">This isn't just backup — it's continuity.</span>
            <br /><br />
            Because in the end, the greatest gift you can leave…
            <br />
            <span className="text-xl sm:text-2xl font-bold text-primary">is certainty.</span>
          </p>
        </div>
      </div>

      <style>{`
        .hover-elevate:hover {
          transform: translateY(-8px) scale(1.02) !important;
        }
      `}</style>
    </section>
  );
}

