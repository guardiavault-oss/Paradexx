import { useRef, useEffect } from "react";
import { Shield, Lock, CheckCircle2, Users, Award, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AnimatedCounter from "./AnimatedCounter";
import { useFadeInUp } from "@/hooks/useGsapScroll";
import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";


registerPlugin(ScrollTrigger, "ScrollTrigger");

interface TrustIndicator {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string;
}

const trustIndicators: TrustIndicator[] = [
  {
    icon: Shield,
    label: "Smart Contracts",
    value: "Audited",
    subtitle: "By leading security firms",
  },
  {
    icon: Lock,
    label: "Encryption",
    value: "AES-256-GCM",
    subtitle: "Military-grade security",
  },
  {
    icon: Users,
    label: "Active Users",
    value: "1,000+",
    subtitle: "Trusting GuardiaVault",
  },
  {
    icon: Zap,
    label: "Uptime",
    value: "99.9%",
    subtitle: "Blockchain reliability",
  },
  {
    icon: CheckCircle2,
    label: "Zero Hacks",
    value: "0",
    subtitle: "Security track record",
  },
  {
    icon: Award,
    label: "Compliance",
    value: "HIPAA",
    subtitle: "Privacy standards",
  },
];

export default function TrustSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useFadeInUp();
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardsRef.current) {
      const cards = cardsRef.current.children;
      
      gsap.fromTo(
        Array.from(cards),
        {
          opacity: 0,
          y: 50,
          scale: 0.9,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-24 bg-gradient-to-b from-background to-primary/5 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div ref={titleRef} className="text-center mb-16">
          <h2 className="text-5xl font-bold font-display mb-4">
            Trusted by Crypto Holders
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built with security, transparency, and your privacy in mind
          </p>
        </div>

        <div ref={cardsRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {trustIndicators.map((indicator, index) => (
            <Card
              key={index}
              className="text-center p-6 hover-elevate border-border/50 bg-card/50 backdrop-blur-sm"
            >
              <CardContent className="p-0">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                    <indicator.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold font-display gradient-text-primary mb-1">
                      {indicator.value}
                    </div>
                    <div className="text-sm font-semibold text-foreground mb-1">
                      {indicator.label}
                    </div>
                    {indicator.subtitle && (
                      <div className="text-xs text-muted-foreground">
                        {indicator.subtitle}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Security Badges */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Security certifications and audits
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50 border border-border/50">
              <Shield className="w-8 h-8 text-primary" />
              <span className="text-xs font-semibold">Smart Contract</span>
              <span className="text-xs text-muted-foreground">Audited</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50 border border-border/50">
              <Lock className="w-8 h-8 text-primary" />
              <span className="text-xs font-semibold">Zero-Knowledge</span>
              <span className="text-xs text-muted-foreground">Architecture</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50 border border-border/50">
              <CheckCircle2 className="w-8 h-8 text-primary" />
              <span className="text-xs font-semibold">Non-Custodial</span>
              <span className="text-xs text-muted-foreground">You Control Keys</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50 border border-border/50">
              <Award className="w-8 h-8 text-primary" />
              <span className="text-xs font-semibold">HIPAA</span>
              <span className="text-xs text-muted-foreground">Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

