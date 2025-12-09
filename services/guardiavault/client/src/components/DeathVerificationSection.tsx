import { useRef, useEffect } from "react";
import { Shield, CheckCircle2, AlertTriangle, Lock, Eye, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFadeInUp } from "@/hooks/useGsapScroll";
import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";


registerPlugin(ScrollTrigger, "ScrollTrigger");

export default function DeathVerificationSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useFadeInUp();
  const problemRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);
  const privacyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elements = [problemRef, solutionRef, privacyRef];
    
    elements.forEach((ref) => {
      if (ref.current) {
        gsap.fromTo(
          ref.current,
          {
            opacity: 0,
            y: 50,
          },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ref.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    });
  }, []);

  const problems = [
    {
      icon: AlertTriangle,
      title: "Lost Your Phone While Traveling",
      description: "You're perfectly fine, just can't check in",
    },
    {
      icon: AlertTriangle,
      title: "Medical Emergency",
      description: "You're in the hospital and can't check in",
    },
    {
      icon: AlertTriangle,
      title: "Just Life Happening",
      description: "You simply forgot during a busy or difficult time",
    },
  ];

  const protections = [
    "Your assets won't be released if you just forgot to check in",
    "Protects your family from fake death claims and scammers",
    "Keeps your identity safe even after you're gone",
    "Your assets only go to your family when it's really time",
  ];

  const privacyFeatures = [
    {
      icon: Lock,
      title: "Encrypted Data Storage",
      description: "All personal data encrypted with AES-256-GCM",
    },
    {
      icon: Eye,
      title: "Opt-In Only",
      description: "You control when to enable death verification",
    },
    {
      icon: Shield,
      title: "HIPAA Compliant",
      description: "Meets healthcare data privacy standards",
    },
    {
      icon: Trash2,
      title: "Delete Anytime",
      description: "Remove your data with one click",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="py-24 pb-40 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden"
      id="fraud-protection"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Title */}
        <div ref={titleRef} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary">NEW FEATURE</span>
          </div>
          <h2 className="text-5xl font-bold font-display mb-4">
            Protect Your Family From <span className="gradient-text-primary">Mistakes & Fraud</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            We check official records before anything happens. This means your assets stay safe 
            even if you lose your phone, and your family is protected from fraud.
          </p>
        </div>

        {/* Problem Section */}
        <div ref={problemRef} className="mb-16">
          <Card className="border-red-500/20 bg-gradient-to-br from-red-950/20 to-red-900/10">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                What Happens If You Just Can't Check In?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground mb-6">
                Most systems only check if you missed your check-in. But life happens:
              </p>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                {problems.map((problem, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-lg bg-background/50 border border-border/50"
                  >
                    <problem.icon className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold mb-1">{problem.title}</h4>
                      <p className="text-sm text-muted-foreground">{problem.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-lg font-semibold text-red-400">
                  😱 Without real verification, your assets could go to the wrong people while you're still here!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Solution Section */}
        <div ref={solutionRef} className="mb-16">
          <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                How We Keep Your Family Safe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground mb-6">
                We check official records before anything happens (only with your permission). 
                This keeps your assets safe from mistakes and protects your family from fraud.
              </p>
              
              {/* Death Certificate Verification Image */}
              <div className="mb-8 flex justify-center">
                <div className="relative max-w-2xl w-full">
                  <img 
                    src="/certificate.png" 
                    alt="Death Verification System - Secure Multi-Source Verification with Fraud Protection"
                    className="w-full h-auto rounded-lg shadow-2xl border-2 border-primary/20 animate-pulse-glow"
                    style={{
                      filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent rounded-lg pointer-events-none" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    What We Prevent
                  </h4>
                  <ul className="space-y-2">
                    {protections.map((protection, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-foreground">{protection}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    How It Works
                  </h4>
                  <p className="text-muted-foreground mb-4">
                    We check official government records and multiple sources to verify. 
                    This protects you from mistakes and protects your family from fraud.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-foreground">SSDI (Social Security Death Index) monitoring</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-foreground">Obituary verification from trusted sources</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-foreground">Official death certificate verification</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-foreground">Multi-source consensus engine</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Privacy Section */}
        <div ref={privacyRef}>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <Lock className="w-6 h-6 text-primary" />
                Your Privacy & Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground mb-6">
                We take your privacy seriously. You have complete control over your data.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {privacyFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                  >
                    <feature.icon className="w-8 h-8 text-primary mb-4" />
                    <h4 className="font-semibold mb-2">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-6 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Zero-Knowledge Architecture:</strong> Where possible, 
                  we use zero-knowledge proofs to verify information without exposing your personal data. 
                  Your SSN is never stored in plaintext—only a cryptographic hash.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

