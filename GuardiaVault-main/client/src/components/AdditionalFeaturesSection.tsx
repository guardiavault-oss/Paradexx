import React, { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, 
  Shield, 
  Users, 
  Bell, 
  Fingerprint,
  CheckCircle2
} from "lucide-react";
import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";


registerPlugin(ScrollTrigger, "ScrollTrigger");

interface AdditionalFeature {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const additionalFeatures: AdditionalFeature[] = [
  {
    icon: FileText,
    title: "Smart Will Builder",
    description: "Visual drag-and-drop logic. 'Wallet X → Wife 50% + Kids 50%'. 'NFTs → Charity'. Generates legal doc + on-chain execution.",
    color: "rgba(59, 130, 246, 1)",
  },
  {
    icon: Shield,
    title: "Multi-Sig Recovery",
    description: "Lost your seed phrase? 2 Guardians can restore it. Revenue model: 10–20% of recovered funds.",
    color: "rgba(139, 92, 246, 1)",
  },
  {
    icon: Users,
    title: "Guardian Portal",
    description: "Lightweight web interface for non-crypto users. Simple, secure, and accessible from any device.",
    color: "rgba(34, 197, 94, 1)",
  },
  {
    icon: Bell,
    title: "Notifications & Verification",
    description: "Email, SMS, or Telegram alerts when key events happen. Stay informed about your vault status.",
    color: "rgba(245, 158, 11, 1)",
  },
  {
    icon: Fingerprint,
    title: "Full Biometric + 2FA Security",
    description: "Fingerprint, FaceID, or email OTP verification. Multiple layers of security for maximum protection.",
    color: "rgba(236, 72, 153, 1)",
  },
];

export default function AdditionalFeaturesSection() {
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
        stagger: 0.15,
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
      className="py-16 sm:py-20 md:py-24 bg-background/50 relative overflow-hidden"
      id="additional-features"
    >
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div ref={titleRef} className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black font-display mb-4 sm:mb-6 tracking-tight text-white">
            🧱 Additional Features
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-3xl mx-auto">
            Powerful tools to protect and manage your digital legacy
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {additionalFeatures.map((feature, index) => (
            <Card
              key={index}
              className="backdrop-blur-xl border-2 hover-elevate transition-all duration-300 relative overflow-hidden group"
              style={{
                borderColor: `${feature.color}40`,
                background: `linear-gradient(135deg, ${feature.color}08, transparent)`,
              }}
            >
              <CardContent className="p-6 sm:p-8">
                <div className="mb-4 sm:mb-6">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                    style={{
                      background: `radial-gradient(circle, ${feature.color}30, ${feature.color}10)`,
                      border: `2px solid ${feature.color}50`,
                      boxShadow: `0 0 30px ${feature.color}30`,
                    }}
                  >
                    <feature.icon
                      className="w-8 h-8"
                      style={{ color: feature.color }}
                    />
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold font-display mb-3 text-white">
                    {feature.title}
                  </h3>
                </div>
                
                <p className="text-white/75 leading-relaxed text-sm sm:text-base">
                  {feature.description}
                </p>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 
                      className="w-5 h-5" 
                      style={{ color: feature.color }}
                    />
                    <span className="text-xs sm:text-sm text-white/60 uppercase tracking-wider font-semibold">
                      Included
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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

